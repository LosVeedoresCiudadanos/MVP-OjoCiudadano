import { test, expect } from "@playwright/test";

// Prueba de humo de la Fase 5: valida que toda la infraestructura e2e
// funciona (reset + seed de la BD de pruebas, servidor levantado en el
// puerto dedicado, navegador automatizado). Los escenarios completos
// (registro, login, crear denuncia, panel admin) van en la Fase 6.

test("la home carga y muestra el hero para un visitante anónimo", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "¿Qué quieres reportar hoy?" })).toBeVisible();
  await expect(page.getByRole("link", { name: "+ Crear una denuncia" })).toBeVisible();
});

test("el admin sembrado por el seed puede iniciar sesión", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@ojociudadano.test");
  await page.getByLabel("Contraseña").fill("admin1234");
  await page.getByRole("button", { name: "Ingresar" }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Panel de administración" })).toBeVisible();
});
