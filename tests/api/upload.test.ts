import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { readdir, rm } from "node:fs/promises";
import path from "node:path";
import { POST } from "@/app/api/upload/route";
import { resetDb, crearUsuario } from "../helpers/db";
import { mockSesion, mockSinSesion } from "../helpers/session";

const uploadsDir = path.join(process.cwd(), "public", "uploads");

async function limpiarArchivosDePrueba() {
  const archivos = await readdir(uploadsDir).catch(() => [] as string[]);
  await Promise.all(
    archivos
      .filter((nombre) => nombre !== ".gitkeep")
      .map((nombre) => rm(path.join(uploadsDir, nombre))),
  );
}

describe("POST /api/upload", () => {
  beforeEach(async () => {
    await resetDb();
    await limpiarArchivosDePrueba();
  });

  afterAll(async () => {
    await limpiarArchivosDePrueba();
  });

  it("rechaza si no hay sesión", async () => {
    mockSinSesion();
    const formData = new FormData();
    formData.set("archivo", new File(["contenido"], "foto.png", { type: "image/png" }));

    const response = await POST(new Request("http://localhost/api/upload", { method: "POST", body: formData }));
    expect(response.status).toBe(401);
  });

  it("sube una imagen válida y devuelve su URL", async () => {
    const usuario = await crearUsuario();
    mockSesion({ id: usuario.id, rol: "ciudadano" });

    const formData = new FormData();
    formData.set("archivo", new File(["contenido"], "foto.png", { type: "image/png" }));

    const response = await POST(new Request("http://localhost/api/upload", { method: "POST", body: formData }));
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.url).toMatch(/^\/uploads\/.+\.png$/);
  });

  it("rechaza un tipo de archivo no permitido", async () => {
    const usuario = await crearUsuario();
    mockSesion({ id: usuario.id, rol: "ciudadano" });

    const formData = new FormData();
    formData.set("archivo", new File(["contenido"], "documento.pdf", { type: "application/pdf" }));

    const response = await POST(new Request("http://localhost/api/upload", { method: "POST", body: formData }));
    expect(response.status).toBe(400);
  });
});
