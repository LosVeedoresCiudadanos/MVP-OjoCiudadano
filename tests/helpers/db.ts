import { prisma } from "@/lib/prisma";

export async function resetDb() {
  await prisma.historialEstado.deleteMany();
  await prisma.denuncia.deleteMany();
  await prisma.usuario.deleteMany();
}
