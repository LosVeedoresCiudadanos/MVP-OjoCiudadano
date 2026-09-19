# Buzón de Reportes Ciudadanos

Plataforma de reportes ciudadanos con seguimiento visible de estado. Ver [`CLAUDE.md`](./CLAUDE.md) para el contexto completo del proyecto, el contrato de API y el esquema de base de datos.

## Requisitos

- Node.js LTS (22 o 24) vía [nvm](https://github.com/nvm-sh/nvm) — el repo trae `.nvmrc`, así que basta con correr `nvm use`.

## Primeros pasos

```bash
nvm use
npm install
cp .env.example .env   # y ajusta AUTH_SECRET si quieres
npx prisma migrate dev # aplica el esquema a prisma/dev.db
npm run seed            # crea el usuario admin de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

**Cuentas de desarrollo:**
- Admin: `admin@ojociudadano.test` / `admin1234` (creada por `npm run seed`)
- Cualquier otra cuenta se crea normal desde `/registro`

## Pruebas automáticas

El proyecto usa una base de datos de pruebas separada (`prisma/test.db`, vía `.env.test`) para no tocar nunca `prisma/dev.db`.

### Pruebas de integración (Vitest)

Corren las rutas de API directamente (sin levantar un servidor ni un navegador), usando `prisma/test.db`.

```bash
npm test
```

### Pruebas end-to-end (Playwright)

Simulan un usuario real en un navegador, contra un servidor Next.js levantado en el puerto **3100** (distinto al 3000 de `npm run dev`, para no chocar si tienes el servidor de desarrollo corriendo al mismo tiempo).

```bash
npm run test:e2e
```

Este comando automáticamente, antes de correr las pruebas:
1. Resetea `prisma/test.db` (`npm run db:test:reset`)
2. Siembra el usuario admin en esa base (`npm run db:test:seed`)
3. Levanta el servidor y corre las pruebas de `e2e/`

Si quieres correr esos pasos por separado:

```bash
npm run db:test:reset   # borra y recrea prisma/test.db desde las migraciones
npm run db:test:seed    # crea el admin en prisma/test.db
npx playwright test     # corre las pruebas (requiere el servidor de prueba corriendo, ver playwright.config.ts)
```

### Otros comandos útiles

- `npm run lint` — ESLint
- `npm run build` — build de producción (incluye chequeo de TypeScript)
- `npx prisma studio` — interfaz visual para ver/editar `prisma/dev.db`

## Despliegue (Vercel + Turso + Vercel Blob)

**En producción: https://ojo-ciudadano-pi.vercel.app**

SQLite como archivo local no funciona en Vercel (las funciones son "serverless", con sistema de archivos de solo lectura y sin disco persistente). Esto afecta dos cosas, y ambas se resuelven igual: el código detecta automáticamente si hay que usar el servicio en la nube, sin cambiar nada más.

- **Base de datos** → [Turso](https://turso.tech) (SQLite hospedado). Se activa si existen `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` (ver `src/lib/prisma.ts` y `prisma.config.ts`). Sin esas variables, sigue usando el archivo local (`prisma/dev.db`).
- **Evidencia (fotos subidas)** → [Vercel Blob](https://vercel.com/docs/vercel-blob). Se activa si existe `BLOB_READ_WRITE_TOKEN` (ver `src/app/api/upload/route.ts`). Sin esa variable, sigue guardando en `public/uploads/` local.

### Configurar la base de datos de producción (cuando cambie el esquema)

Con las variables de tu base de Turso en el entorno:

```bash
export TURSO_DATABASE_URL="libsql://tu-base.turso.io"
export TURSO_AUTH_TOKEN="tu-token"
export AUTH_SECRET="$(openssl rand -base64 32)"  # o el que ya estés usando en Vercel

npm run db:prod:migrate   # aplica las migraciones a Turso
npm run db:prod:seed      # crea el usuario admin
```

Cada vez que cambies `prisma/schema.prisma` y crees una migración nueva (`npx prisma migrate dev`), hay que volver a correr `npm run db:prod:migrate` con esas mismas variables para aplicarla también en Turso.

### Vercel

El proyecto ya está creado y conectado al repo (`vercel git connect`) — cada push a `main` despliega solo. Si necesitas volver a montarlo desde cero (otra cuenta, otro repo):

1. **El repo debe ser público** en GitHub, o necesitas plan Pro de Vercel (el plan gratis "Hobby" no despliega repos privados de una organización).
2. Usa el [CLI de Vercel](https://vercel.com/docs/cli) en vez de la interfaz web — es más confiable para este flujo:
   ```bash
   npx vercel login
   npx vercel link --yes --project <nombre-en-minusculas>
   printf '%s' "$TURSO_DATABASE_URL" | npx vercel env add TURSO_DATABASE_URL production
   printf '%s' "$TURSO_AUTH_TOKEN" | npx vercel env add TURSO_AUTH_TOKEN production
   printf '%s' "$AUTH_SECRET" | npx vercel env add AUTH_SECRET production
   npx vercel blob create-store <nombre> --access public --yes   # conecta Vercel Blob (agrega BLOB_READ_WRITE_TOKEN solo)
   npx vercel --prod --yes
   ```
3. Verifica que **"Framework Preset"** haya quedado en **Next.js**, no "Other" (`npx vercel project inspect <proyecto>`) — si el proyecto se crea sin detectar el framework (por ejemplo con `vercel project add`), todas las rutas responden 404 aunque el build sea exitoso.

Si al probar el login en producción aparece un error de "UntrustedHost" de Auth.js, agrega también la variable `AUTH_TRUST_HOST=true` en Vercel (en teoría Auth.js detecta Vercel automáticamente, pero por si acaso).

## Correo (simulado)

Las notificaciones de cambio de estado no se envían por correo real todavía — se loguean en consola y quedan en `mail-outbox/outbox.log` (no se versiona). Ver [`src/lib/mailer.ts`](./src/lib/mailer.ts).
