import { test, expect } from "@playwright/test";
import { emailUnico, login, loginExitoso, registrarCiudadano } from "./helpers";

test("login con credenciales inválidas muestra un error y no entra", async ({ page }) => {
  await login(page, { email: "no-existe@example.com", password: "loquesea123" });

  // getByRole("alert") también matchea el route-announcer interno de
  // Next.js, así que localizamos por el texto exacto del mensaje.
  await expect(page.getByText("Email o contraseña incorrectos")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("registrarse con un email ya usado muestra un error", async ({ page }) => {
  const email = emailUnico("email-duplicado");
  const datos = { nombre: "Primera Cuenta", email, password: "claveSegura123" };

  await registrarCiudadano(page, datos);
  await expect(page).toHaveURL(/\/login$/);

  await registrarCiudadano(page, { ...datos, nombre: "Segunda Cuenta" });
  await expect(page.getByText("Ese email ya está registrado")).toBeVisible();
});

test("un visitante anónimo que intenta entrar a /admin termina en login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login$/);
});

test("un visitante anónimo no puede crear una denuncia directamente", async ({ page }) => {
  await page.goto("/denuncias/nueva");
  await expect(page.getByRole("heading", { name: "Inicia sesión para continuar" })).toBeVisible();
});

test("un admin no puede crear una denuncia", async ({ page }) => {
  await loginExitoso(page, { email: "admin@ojociudadano.test", password: "admin1234" });
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/denuncias/nueva");
  await expect(
    page.getByRole("heading", { name: "No disponible para administradores" }),
  ).toBeVisible();
});
