import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@ojociudadano.test";
const ADMIN_PASSWORD = "admin1234";

async function main() {
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = await prisma.usuario.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      nombre: "Administrador",
      email: ADMIN_EMAIL,
      password: hashedPassword,
      rol: "admin",
    },
  });

  console.log(`Usuario admin listo: ${admin.email} (id ${admin.id})`);
  console.log(`Contraseña de desarrollo: ${ADMIN_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
