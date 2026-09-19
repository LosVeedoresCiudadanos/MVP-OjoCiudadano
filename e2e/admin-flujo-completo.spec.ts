import { test, expect } from "@playwright/test";
import { URL_DETALLE_DENUNCIA, emailUnico, loginExitoso, registrarCiudadano } from "./helpers";

const ADMIN = { email: "admin@ojociudadano.test", password: "admin1234" };

test("el admin revisa una denuncia, la cambia de estado dos veces, y el ciudadano ve el historial", async ({
  page,
  context,
}) => {
  const descripcion = `Semáforo dañado hace semanas ${Date.now()}`;

  // El ciudadano crea la denuncia
  const email = emailUnico("ciudadano-admin-flujo");
  await registrarCiudadano(page, { nombre: "Ciudadano Denunciante", email, password: "claveSegura123" });
  await loginExitoso(page, { email, password: "claveSegura123" });

  await page.goto("/denuncias/nueva");
  await page.getByLabel("Categoría").selectOption("Sospecha de irregularidad/corrupción");
  await page.getByLabel("Descripción").fill(descripcion);
  await page.getByRole("button", { name: "Enviar denuncia" }).click();
  await page.waitForURL(URL_DETALLE_DENUNCIA);
  const codigo = page.url().split("/").pop()!;

  await page.getByRole("button", { name: "Cerrar sesión" }).click();

  // El admin entra al panel (home redirige directo a /admin)
  await loginExitoso(page, ADMIN);
  await expect(page).toHaveURL(/\/admin$/);

  await page.getByLabel("Categoría").selectOption("Sospecha de irregularidad/corrupción");

  // La API ordena por más reciente primero, así que la que acabamos de crear
  // es siempre la primera coincidencia (robusto aunque se acumulen denuncias
  // de corridas previas de esta prueba sin resetear la BD).
  const filaDenuncia = page.locator("li", { hasText: "Sospecha de irregularidad/corrupción" }).first();
  await filaDenuncia.getByRole("button").click();

  await filaDenuncia.getByLabel("Nuevo estado").selectOption("En revisión");
  await filaDenuncia.getByLabel("Comentario (opcional)").fill("Se asignó un investigador al caso.");
  await filaDenuncia.getByRole("button", { name: "Actualizar estado" }).click();

  await expect(filaDenuncia.getByText("En revisión")).toBeVisible();

  // Segundo cambio: En revisión -> Respondido
  await filaDenuncia.getByRole("button").click();
  await filaDenuncia.getByLabel("Nuevo estado").selectOption("Respondido");
  await filaDenuncia
    .getByLabel("Comentario (opcional)")
    .fill("Se encontró irregularidad y se remitió a control interno.");
  await filaDenuncia.getByRole("button", { name: "Actualizar estado" }).click();

  await expect(filaDenuncia.getByText("Respondido")).toBeVisible();

  // El ciudadano (sesión aparte, sin cookies de admin) ve el historial completo
  const paginaCiudadano = await context.browser()!.newContext().then((c) => c.newPage());
  await paginaCiudadano.goto(`/denuncias/${codigo}`);
  await expect(paginaCiudadano.getByText("Se asignó un investigador al caso.")).toBeVisible();
  await expect(
    paginaCiudadano.getByText("Se encontró irregularidad y se remitió a control interno."),
  ).toBeVisible();
  await expect(paginaCiudadano.getByTestId("codigo-seguimiento")).toBeVisible();
  await paginaCiudadano.close();
});

test("un ciudadano no puede entrar al panel de administración", async ({ page }) => {
  const email = emailUnico("ciudadano-sin-permiso");
  await registrarCiudadano(page, { nombre: "Sin Permiso", email, password: "claveSegura123" });
  await loginExitoso(page, { email, password: "claveSegura123" });

  await page.goto("/admin");
  await expect(page).not.toHaveURL(/\/admin$/);
});
