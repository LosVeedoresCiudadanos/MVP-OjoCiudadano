import { prisma } from "@/lib/prisma";

export async function resetDb() {
  await prisma.historialEstado.deleteMany();
  await prisma.denuncia.deleteMany();
  await prisma.usuario.deleteMany();
}

export async function crearUsuario(overrides: Partial<{ nombre: string; email: string; rol: string }> = {}) {
  return prisma.usuario.create({
    data: {
      nombre: overrides.nombre ?? "Usuario de prueba",
      email: overrides.email ?? `usuario-${Date.now()}-${Math.random()}@example.com`,
      password: "hash-no-relevante-en-tests",
      rol: overrides.rol ?? "ciudadano",
    },
  });
}
