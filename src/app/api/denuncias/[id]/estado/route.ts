import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { esTransicionValida } from "@/lib/estados";
import { enviarCorreo } from "@/lib/mailer";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const denunciaId = Number(id);
  if (!Number.isInteger(denunciaId)) {
    return NextResponse.json({ error: "Id inválido" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { estado, comentario } = (body ?? {}) as Record<string, unknown>;
  if (typeof estado !== "string") {
    return NextResponse.json({ error: "El estado es obligatorio" }, { status: 400 });
  }
  if (comentario !== undefined && comentario !== null && typeof comentario !== "string") {
    return NextResponse.json({ error: "Comentario inválido" }, { status: 400 });
  }

  const denuncia = await prisma.denuncia.findUnique({
    where: { id: denunciaId },
    include: { usuario: { select: { nombre: true, email: true } } },
  });
  if (!denuncia) {
    return NextResponse.json({ error: "Denuncia no encontrada" }, { status: 404 });
  }

  if (!esTransicionValida(denuncia.estado, estado)) {
    return NextResponse.json(
      { error: `No se puede pasar de "${denuncia.estado}" a "${estado}"` },
      { status: 400 },
    );
  }

  const actualizada = await prisma.denuncia.update({
    where: { id: denunciaId },
    data: {
      estado,
      historial: {
        create: {
          estado,
          comentario: typeof comentario === "string" ? comentario : null,
        },
      },
    },
  });

  await enviarCorreo({
    to: denuncia.usuario.email,
    subject: `Tu denuncia ${denuncia.codigoSeguimiento} cambió de estado: ${estado}`,
    body: [
      `Hola ${denuncia.usuario.nombre},`,
      "",
      `Tu denuncia sobre "${denuncia.categoria}" ahora está en estado: ${estado}.`,
      typeof comentario === "string" && comentario ? `\nComentario: ${comentario}` : "",
      "",
      `Puedes ver el detalle completo en: /denuncias/${denuncia.codigoSeguimiento}`,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  return NextResponse.json({ id: actualizada.id, estado: actualizada.estado });
}
