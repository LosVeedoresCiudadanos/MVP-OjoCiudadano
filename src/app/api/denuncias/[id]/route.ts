import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// El segmento se llama [id] por restricción de Next.js (no puede coexistir con
// [id]/estado si tuviera otro nombre), pero el valor que recibe es el
// codigoSeguimiento (GET /api/denuncias/:codigo del contrato de API).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: codigo } = await params;

  const denuncia = await prisma.denuncia.findUnique({
    where: { codigoSeguimiento: codigo },
    include: { historial: { orderBy: { fecha: "asc" } } },
  });

  if (!denuncia) {
    return NextResponse.json({ error: "Denuncia no encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    id: denuncia.id,
    categoria: denuncia.categoria,
    descripcion: denuncia.descripcion,
    estado: denuncia.estado,
    historial: denuncia.historial.map((h) => ({ estado: h.estado, fecha: h.fecha })),
  });
}
