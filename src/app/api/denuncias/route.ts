import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession } from "@/lib/authz";
import { CATEGORIAS_DENUNCIA } from "@/lib/categorias";
import { ESTADOS_DENUNCIA } from "@/lib/estados";

export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  if (session.user.rol === "admin") {
    return NextResponse.json(
      { error: "Los administradores no pueden crear denuncias" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { categoria, descripcion, ubicacion, evidencia } = (body ?? {}) as Record<string, unknown>;

  if (typeof categoria !== "string" || !CATEGORIAS_DENUNCIA.includes(categoria as (typeof CATEGORIAS_DENUNCIA)[number])) {
    return NextResponse.json({ error: "Categoría inválida" }, { status: 400 });
  }
  if (typeof descripcion !== "string" || descripcion.trim().length === 0) {
    return NextResponse.json({ error: "La descripción es obligatoria" }, { status: 400 });
  }
  if (ubicacion !== undefined && ubicacion !== null && typeof ubicacion !== "string") {
    return NextResponse.json({ error: "Ubicación inválida" }, { status: 400 });
  }
  if (
    evidencia !== undefined &&
    (!Array.isArray(evidencia) || !evidencia.every((url) => typeof url === "string"))
  ) {
    return NextResponse.json({ error: "Evidencia inválida, debe ser un arreglo de URLs" }, { status: 400 });
  }

  const denuncia = await prisma.denuncia.create({
    data: {
      categoria,
      descripcion: descripcion.trim(),
      ubicacion: typeof ubicacion === "string" ? ubicacion : null,
      evidencia: evidencia ?? undefined,
      usuarioId: Number(session.user.id),
      historial: {
        create: { estado: "Recibido" },
      },
    },
  });

  return NextResponse.json(
    { id: denuncia.id, codigoSeguimiento: denuncia.codigoSeguimiento, estado: denuncia.estado },
    { status: 201 },
  );
}

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const estado = searchParams.get("estado");
  const categoria = searchParams.get("categoria");

  if (estado && !ESTADOS_DENUNCIA.includes(estado as (typeof ESTADOS_DENUNCIA)[number])) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const denuncias = await prisma.denuncia.findMany({
    where: {
      ...(estado ? { estado } : {}),
      ...(categoria ? { categoria } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    denuncias.map((d) => ({
      id: d.id,
      categoria: d.categoria,
      estado: d.estado,
      fecha_creacion: d.createdAt,
    })),
  );
}
