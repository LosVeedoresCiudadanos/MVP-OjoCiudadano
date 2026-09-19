import path from "node:path";
import { test, expect } from "@playwright/test";
import { URL_DETALLE_DENUNCIA, emailUnico, loginExitoso, registrarCiudadano } from "./helpers";

test("un ciudadano se registra, crea una denuncia con evidencia, y la ve en sus denuncias", async ({
  page,
}) => {
  const email = emailUnico("ciudadano-e2e");
  const password = "claveSegura123";
  const descripcion = `Bache enorme en la calle principal ${Date.now()}`;

  // Registro
  await registrarCiudadano(page, { nombre: "Ciudadano E2E", email, password });
  await expect(page).toHaveURL(/\/login$/);

  // Login
  await loginExitoso(page, { email, password });
  await expect(page.getByTestId("usuario-sesion")).toHaveText("Ciudadano E2E");

  // El header de un ciudadano tiene "Nueva denuncia" y "Mis denuncias", nunca "Admin"
  await expect(page.getByRole("link", { name: "Nueva denuncia" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Mis denuncias" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Admin", exact: true })).toHaveCount(0);

  // Crear denuncia con evidencia
  await page.getByRole("link", { name: "Nueva denuncia" }).click();
  await expect(page).toHaveURL(/\/denuncias\/nueva$/);

  await page.getByLabel("Categoría").selectOption("Espacio público en mal estado");
  await page.getByLabel("Descripción").fill(descripcion);
  await page.getByLabel("Ubicación (opcional)").fill("Calle 10 # 20-30");
  await page
    .getByLabel("Evidencia (opcional, fotos)")
    .setInputFiles(path.join(__dirname, "fixtures", "evidencia.png"));

  await page.getByRole("button", { name: "Enviar denuncia" }).click();

  // Redirige a la página de seguimiento con el código real
  await page.waitForURL(URL_DETALLE_DENUNCIA);
  const codigo = page.url().split("/").pop()!;
  await expect(page.getByTestId("codigo-seguimiento")).toHaveText(codigo);
  // "Recibido" aparece dos veces (badge de estado actual + historial), por
  // eso .first() en vez de asumir que hay un único match.
  await expect(page.getByText("Recibido").first()).toBeVisible();
  await expect(page.getByText("Espacio público en mal estado")).toBeVisible();
  await expect(page.getByText(descripcion)).toBeVisible();
  await expect(page.getByAltText("Evidencia de la denuncia")).toBeVisible();

  // Aparece en "Mis denuncias"
  await page.getByRole("link", { name: "Mis denuncias" }).click();
  await expect(page).toHaveURL(/\/mis-denuncias$/);
  await expect(page.getByText(codigo)).toBeVisible();

  // Y en el dashboard de home, con las estadísticas actualizadas
  await page.goto("/");
  await expect(page.getByText("Espacio público en mal estado").first()).toBeVisible();
});

test("consultar una denuncia por código no requiere sesión", async ({ page, context }) => {
  const email = emailUnico("ciudadano-e2e-publico");
  const password = "claveSegura123";
  const descripcion = `Fuga de agua sin reparar ${Date.now()}`;

  await registrarCiudadano(page, { nombre: "Otro Ciudadano", email, password });
  await loginExitoso(page, { email, password });

  await page.goto("/denuncias/nueva");
  await page.getByLabel("Descripción").fill(descripcion);
  await page.getByRole("button", { name: "Enviar denuncia" }).click();
  await page.waitForURL(URL_DETALLE_DENUNCIA);
  const codigo = page.url().split("/").pop()!;

  // Nueva pestaña sin cookies de sesión (visitante anónimo)
  const paginaAnonima = await context.browser()!.newContext().then((c) => c.newPage());
  await paginaAnonima.goto(`/denuncias/${codigo}`);
  await expect(paginaAnonima.getByText(descripcion)).toBeVisible();
  await paginaAnonima.close();
});
