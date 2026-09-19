import { beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/denuncias/route";
import { GET } from "@/app/api/denuncias/mias/route";
import { resetDb, crearUsuario } from "../helpers/db";
import { mockSesion, mockSinSesion } from "../helpers/session";

async function crearDenuncia(descripcion: string) {
  return POST(
    new Request("http://localhost/api/denuncias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoria: "Otro", descripcion }),
    }),
  );
}

describe("GET /api/denuncias/mias", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("rechaza si no hay sesión", async () => {
    mockSinSesion();
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("devuelve solo las denuncias del usuario en sesión", async () => {
    const usuario1 = await crearUsuario();
    const usuario2 = await crearUsuario();

    mockSesion({ id: usuario1.id, rol: "ciudadano" });
    await crearDenuncia("Denuncia de usuario 1");

    mockSesion({ id: usuario2.id, rol: "ciudadano" });
    await crearDenuncia("Denuncia de usuario 2 (a)");
    await crearDenuncia("Denuncia de usuario 2 (b)");

    mockSesion({ id: usuario1.id, rol: "ciudadano" });
    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(1);
    expect(data[0].categoria).toBe("Otro");
    expect(data[0].codigoSeguimiento).toBeTypeOf("string");
  });

  it("devuelve una lista vacía si el usuario no tiene denuncias", async () => {
    const usuario = await crearUsuario();
    mockSesion({ id: usuario.id, rol: "ciudadano" });

    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });
});
