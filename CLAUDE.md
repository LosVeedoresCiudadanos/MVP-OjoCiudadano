# Buzón de Reportes Ciudadanos — Contexto del Proyecto

## Qué es
Plataforma de reportes ciudadanos con seguimiento visible de estado. Un ciudadano reporta un problema relacionado con el uso de recursos públicos (obra abandonada, mala calidad, sospecha de irregularidades) y puede consultar el estado de su reporte — a diferencia de un buzón de sugerencias tradicional, el objetivo es que el ciudadano sienta impacto de su participación individual y pueda ejercer veeduría social.

Es el Proyecto Inicial (Design Thinking + Scrum) del curso Introducción a la Ingeniería de Sistemas y Computación, Universidad de los Andes.

**Entrega: 25 de septiembre de 2026.**

## Stack técnico
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend:** rutas de API de Next.js
- **Base de datos:** SQLite vía Prisma ORM — versión **fijada a Prisma 6.x** (`prisma@6.19.3` / `@prisma/client@6.19.3`). Prisma 7 cambia de arquitectura (ya no acepta `url` en el bloque `datasource`, requiere `prisma.config.ts` + driver adapter) y no es compatible con el `schema.prisma` de este proyecto sin una migración manual.
- **Node.js:** usar una versión LTS (22 o 24) vía nvm — no usar Node 25, es una versión "Current" ya sin soporte

## Variables de entorno
- `.env` — BD de desarrollo (`prisma/dev.db`)
- `.env.test` — BD separada para pruebas de integración/e2e (`prisma/test.db`), se resetea antes de cada corrida
- `.env.example` — plantilla committeada, sin secretos reales

Nota: las rutas `file:...` de `DATABASE_URL` son relativas a la carpeta `prisma/`, no a la raíz del proyecto (comportamiento de Prisma).

## Flujo de trabajo con git
Todo cambio se hace en una rama nueva (nunca directo sobre `main`). Solo se hace merge a `main` cuando el trabajo de esa rama está probado y confirmado.

## División de trabajo
- Backend (esquema, rutas de API): Nicolas
- Frontend: construido con ayuda de Claude, contra el contrato de API definido abajo

## Flujo de estado de una denuncia
`Recibido` → `En revisión` → `Respondido`

## Autenticación
Los ciudadanos deben crear cuenta e iniciar sesión — no hay flujo anónimo. Toda denuncia queda asociada a un usuario (`usuarioId` es obligatorio en `Denuncia`).

- Librería: Auth.js v5 (`next-auth@beta`), proveedor Credentials, sesiones JWT (no se usa el adapter de Prisma — las sesiones JWT no se persisten en base de datos, así que no hacen falta las tablas `Account`/`Session` que pide el adapter)
- Contraseñas: hasheadas con `bcryptjs` antes de guardarlas en `Usuario.password`

## Contrato de API

```
POST   /api/denuncias
  body:  { categoria, descripcion, ubicacion, evidencia: [urls] }
  resp:  { id, codigoSeguimiento, estado: "Recibido" }

GET    /api/denuncias/:codigo
  resp:  { id, categoria, descripcion, estado, historial: [{estado, fecha}] }

GET    /api/denuncias            (admin, filtros ?estado=&categoria=)
  resp:  [ { id, categoria, estado, fecha_creacion }, ... ]

PATCH  /api/denuncias/:id/estado (admin)
  body:  { estado: "En revisión" | "Respondido", comentario? }

POST   /api/register
  body:  { nombre, email, password }
  resp:  { id, email }   (el login lo maneja Auth.js en /api/auth/*, no esta ruta)
```

Si el backend cambia la forma de estos datos, actualiza este archivo para que el frontend no se desincronice.

## Esquema de base de datos (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Usuario {
  id        Int        @id @default(autoincrement())
  nombre    String
  email     String     @unique
  password  String
  rol       String     @default("ciudadano") // "ciudadano" | "admin"
  denuncias Denuncia[]
  createdAt DateTime   @default(now())
}

model Denuncia {
  id                Int               @id @default(autoincrement())
  codigoSeguimiento String            @unique @default(cuid())
  categoria         String
  descripcion       String
  ubicacion         String?
  evidencia         Json?
  estado            String            @default("Recibido")
  usuarioId         Int
  usuario           Usuario           @relation(fields: [usuarioId], references: [id])
  historial         HistorialEstado[]
  createdAt         DateTime          @default(now())
}

model HistorialEstado {
  id         Int      @id @default(autoincrement())
  estado     String
  comentario String?
  fecha      DateTime @default(now())
  denunciaId Int
  denuncia   Denuncia @relation(fields: [denunciaId], references: [id])
}
```

## Comandos comunes
- `npm run dev` — levantar el servidor de desarrollo
- `npx prisma migrate dev --name <nombre>` — aplicar cambios al esquema
- `npx prisma studio` — ver/editar los datos con una interfaz visual
- `npm run seed` — crea/actualiza el usuario admin de desarrollo (`admin@ojociudadano.test` / `admin1234`)

## Estado actual de la configuración
- [x] Node cambiado a versión LTS (22 o 24) vía nvm
- [x] Next.js inicializado (`create-next-app`, TypeScript + Tailwind + App Router)
- [x] Prisma instalado e inicializado con SQLite
- [x] Migración inicial aplicada (`prisma migrate dev --name init`)
- [ ] Auth.js configurado (Credentials + JWT, sin adapter)
- [ ] Pantallas de registro e inicio de sesión construidas
