import type { FullConfig } from "@playwright/test";

// Next.js en modo dev compila cada ruta la primera vez que se visita
// (Turbopack "on-demand"). Sin esto, la primera prueba que corre puede
// pisarse con esa demora (ej. el login se dispara antes de que la ruta de
// login/CSRF haya terminado de compilar) y fallar por una carrera que no
// tiene nada que ver con la lógica de la app. Precompilamos las rutas
// clave antes de correr cualquier prueba real.
export default async function globalSetup(config: FullConfig) {
  const baseURL = (config.projects[0]?.use?.baseURL as string) ?? "http://localhost:3100";
  const rutas = [
    "/",
    "/login",
    "/registro",
    "/denuncias/nueva",
    "/admin",
    "/mis-denuncias",
    "/denuncias/codigo-inexistente",
    "/api/auth/csrf",
    "/api/register",
    "/api/denuncias",
    "/api/denuncias/1",
    "/api/denuncias/1/estado",
    "/api/upload",
  ];

  for (const ruta of rutas) {
    try {
      await fetch(`${baseURL}${ruta}`);
    } catch {
      // No importa si la respuesta es un error (ej. redirect a login) — el
      // objetivo es solo forzar la compilación, no validar el resultado.
    }
  }
}
