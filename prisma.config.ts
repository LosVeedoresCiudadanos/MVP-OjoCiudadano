// Tener un prisma.config.ts desactiva la auto-carga de .env que hacía el
// CLI de Prisma; la restauramos explícitamente para no romper el flujo
// local (npx prisma migrate dev, npx prisma studio, etc.).
import "dotenv/config";
import { defineConfig } from "prisma/config";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

// Solo se usa el adaptador de Turso cuando existen las variables TURSO_*
// (por ejemplo al correr `prisma migrate deploy` contra producción). En
// desarrollo local, sin esas variables, el CLI sigue usando el archivo
// SQLite normal definido en el datasource de schema.prisma, sin cambios.
const usaTurso = Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);

export default defineConfig(
  usaTurso
    ? {
        schema: "prisma/schema.prisma",
        migrations: { seed: "tsx prisma/seed.ts" },
        experimental: { adapter: true },
        engine: "js",
        adapter: async () =>
          new PrismaLibSQL({
            url: process.env.TURSO_DATABASE_URL!,
            authToken: process.env.TURSO_AUTH_TOKEN!,
          }),
      }
    : {
        schema: "prisma/schema.prisma",
        migrations: { seed: "tsx prisma/seed.ts" },
      },
);
