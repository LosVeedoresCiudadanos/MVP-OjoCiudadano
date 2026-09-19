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

## Despliegue (Vercel + Turso)

SQLite como archivo local no funciona en Vercel (las funciones son "serverless", sin disco persistente), así que producción usa [Turso](https://turso.tech) — una base de datos hospedada, compatible con SQLite. El código detecta automáticamente si debe usar Turso: basta con que existan las variables `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` (ver `src/lib/prisma.ts` y `prisma.config.ts`). Sin esas variables, todo sigue funcionando exactamente igual contra el archivo local (`prisma/dev.db`).

### Configurar la base de datos de producción (una sola vez)

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

1. Conecta el repo de GitHub en [vercel.com](https://vercel.com) ("Import Project").
2. En la configuración del proyecto → Environment Variables, agrega:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `AUTH_SECRET` (un valor random, `openssl rand -base64 32`)
3. Deploy. Cada push a `main` despliega automáticamente.

Si al probar el login en producción aparece un error de "UntrustedHost" de Auth.js, agrega también la variable `AUTH_TRUST_HOST=true` en Vercel (en teoría Auth.js detecta Vercel automáticamente, pero por si acaso).

## Correo (simulado)

Las notificaciones de cambio de estado no se envían por correo real todavía — se loguean en consola y quedan en `mail-outbox/outbox.log` (no se versiona). Ver [`src/lib/mailer.ts`](./src/lib/mailer.ts).
