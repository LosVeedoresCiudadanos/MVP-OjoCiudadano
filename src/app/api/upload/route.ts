import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import heicConvert from "heic-convert";
import { requireSession } from "@/lib/authz";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const TIPOS_HEIC = ["image/heic", "image/heif"];
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5MB

const EXTENSION_POR_TIPO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// Las fotos de iPhone salen en HEIC por defecto, y muchos navegadores
// móviles ni siquiera reportan un `type` (queda vacío) para ese formato —
// por eso también revisamos la extensión del nombre del archivo como
// respaldo, no solo el MIME type.
function esHeic(archivo: File) {
  if (TIPOS_HEIC.includes(archivo.type)) return true;
  if (!archivo.type || archivo.type === "application/octet-stream") {
    return /\.heic$|\.heif$/i.test(archivo.name);
  }
  return false;
}

// En Vercel el sistema de archivos es de solo lectura (funciones serverless),
// así que ahí no se puede escribir en /public/uploads. Cuando existe
// BLOB_READ_WRITE_TOKEN (Vercel Blob conectado al proyecto) se sube ahí; si
// no, se guarda en disco local como antes (dev sin Blob configurado).
async function guardarArchivo(nombreArchivo: string, buffer: Buffer, tipo: string) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(nombreArchivo, buffer, {
      access: "public",
      contentType: tipo,
    });
    return blob.url;
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, nombreArchivo), buffer);
  return `/uploads/${nombreArchivo}`;
}

export async function POST(request: Request) {
  const { error } = await requireSession();
  if (error) return error;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Body inválido, se espera multipart/form-data" }, { status: 400 });
  }

  const archivo = formData.get("archivo");
  if (!(archivo instanceof File)) {
    return NextResponse.json({ error: "Falta el campo 'archivo'" }, { status: 400 });
  }
  if (archivo.size > TAMANO_MAXIMO_BYTES) {
    return NextResponse.json({ error: "El archivo excede el tamaño máximo (5MB)" }, { status: 400 });
  }

  let tipoFinal = archivo.type;
  let buffer = Buffer.from(await archivo.arrayBuffer());

  if (esHeic(archivo)) {
    try {
      const convertido = await heicConvert({ buffer, format: "JPEG", quality: 0.85 });
      buffer = Buffer.from(convertido);
      tipoFinal = "image/jpeg";
    } catch {
      return NextResponse.json(
        { error: "No se pudo procesar la imagen HEIC. Intenta con otro formato (JPEG o PNG)." },
        { status: 400 },
      );
    }
  } else if (!TIPOS_PERMITIDOS.includes(tipoFinal)) {
    return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
  }

  const nombreArchivo = `${randomUUID()}.${EXTENSION_POR_TIPO[tipoFinal]}`;
  const url = await guardarArchivo(nombreArchivo, buffer, tipoFinal);

  return NextResponse.json({ url }, { status: 201 });
}
