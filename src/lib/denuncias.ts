import { prisma } from "@/lib/prisma";

export async function getDenunciaPorCodigo(codigo: string) {
  const denuncia = await prisma.denuncia.findUnique({
    where: { codigoSeguimiento: codigo },
    include: { historial: { orderBy: { fecha: "asc" } } },
  });

  if (!denuncia) {
    return null;
  }

  return {
    id: denuncia.id,
    categoria: denuncia.categoria,
    descripcion: denuncia.descripcion,
    ubicacion: denuncia.ubicacion,
    evidencia: (denuncia.evidencia as string[] | null) ?? [],
    estado: denuncia.estado,
    historial: denuncia.historial.map((h) => ({
      estado: h.estado,
      fecha: h.fecha,
      comentario: h.comentario,
    })),
  };
}
