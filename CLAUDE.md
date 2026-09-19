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

GET    /api/denuncias/mias       (ciudadano autenticado, no admin)
  resp:  [ { id, codigoSeguimiento, categoria, estado, fecha_creacion }, ... ]
  Nota: no estaba en el contrato original; se agregó porque el ciudadano no
  tenía forma de ver sus propias denuncias sin guardar el código a mano.

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
- `npm test` — corre las pruebas de integración/unitarias (Vitest)
- `npm run test:e2e` — corre las pruebas end-to-end (Playwright); resetea y siembra `prisma/test.db` automáticamente antes
- `npm run db:test:reset` — resetea la base de datos de pruebas (`prisma/test.db`)
- `npm run db:test:seed` — siembra el admin en la base de datos de pruebas

## Estado actual de la configuración
- [x] Node cambiado a versión LTS (22 o 24) vía nvm
- [x] Next.js inicializado (`create-next-app`, TypeScript + Tailwind + App Router)
- [x] Prisma instalado e inicializado con SQLite
- [x] Migración inicial aplicada (`prisma migrate dev --name init`)
- [x] Auth.js configurado (Credentials + JWT, sin adapter)
- [x] Pantallas de registro e inicio de sesión construidas
- [x] API de denuncias implementada (crear, consultar por código, listar admin, cambiar estado, subir evidencia)
- [x] Pantallas de ciudadano (nueva denuncia, seguimiento por código) y panel admin construidas
- [x] Infraestructura de pruebas automatizadas (Vitest + Playwright, BD de test separada y reseteada automáticamente)
- [x] Suites e2e de los flujos críticos completos (Playwright): flujo ciudadano, flujo admin, casos de error

## Notas de implementación de la API de denuncias
- Next.js App Router no permite nombres de segmento dinámico distintos en la misma posición de ruta. Por eso `GET /api/denuncias/:codigo` vive en la carpeta `src/app/api/denuncias/[id]/route.ts` (mismo nombre de carpeta que `[id]/estado`), aunque el valor que recibe es el `codigoSeguimiento`, no el id numérico.
- Transiciones de estado válidas: `Recibido → En revisión → Respondido` (una a la vez, no se puede saltar ni retroceder). `PATCH /api/denuncias/:id/estado` responde 400 si la transición no es válida.
- `GET /api/denuncias/:codigo` es público (sin sesión) — funciona como un número de seguimiento tipo paquetería.
- `POST /api/denuncias` y `POST /api/upload` requieren sesión (cualquier rol). `GET /api/denuncias` y `PATCH .../estado` requieren rol admin.
