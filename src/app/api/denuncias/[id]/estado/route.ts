import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { esTransicionValida } from "@/lib/estados";

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

  const denuncia = await prisma.denuncia.findUnique({ where: { id: denunciaId } });
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

  return NextResponse.json({ id: actualizada.id, estado: actualizada.estado });
}
