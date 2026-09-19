import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/authz";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const denuncias = await prisma.denuncia.findMany({
    where: { usuarioId: Number(session.user.id) },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    denuncias.map((d) => ({
      id: d.id,
      codigoSeguimiento: d.codigoSeguimiento,
      categoria: d.categoria,
      estado: d.estado,
      fecha_creacion: d.createdAt,
    })),
  );
}
