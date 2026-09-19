import type { Page } from "@playwright/test";

export function emailUnico(prefijo: string) {
  return `${prefijo}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@example.com`;
}

export async function registrarCiudadano(
  page: Page,
  { nombre, email, password }: { nombre: string; email: string; password: string },
) {
  await page.goto("/registro");
  await page.getByLabel("Nombre").fill(nombre);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
}

export async function login(page: Page, { email, password }: { email: string; password: string }) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
}

// Para los casos donde el login debe funcionar: espera a que la sesión quede
// establecida (sale de /login) antes de seguir. El test de credenciales
// inválidas usa login() directo porque justamente espera quedarse ahí.
export async function loginExitoso(page: Page, creds: { email: string; password: string }) {
  await login(page, creds);
  await page.waitForURL((url) => !url.pathname.endsWith("/login"));
}

// Regex para el código de seguimiento en /denuncias/:codigo — excluye
// "nueva" explícitamente porque /denuncias/nueva también hace match con
// [a-z0-9]+ (todo minúsculas) y produce falsos positivos.
export const URL_DETALLE_DENUNCIA = /\/denuncias\/(?!nueva)[a-z0-9]+$/;
