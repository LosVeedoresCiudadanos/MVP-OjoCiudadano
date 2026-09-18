import { beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/denuncias/route";
import { GET } from "@/app/api/denuncias/[id]/route";
import { resetDb, crearUsuario } from "../helpers/db";
import { mockSesion } from "../helpers/session";

describe("GET /api/denuncias/:codigo", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("devuelve 404 si el código no existe", async () => {
    const response = await GET(new Request("http://localhost/api/denuncias/no-existe"), {
      params: Promise.resolve({ id: "no-existe" }),
    });
    expect(response.status).toBe(404);
  });

  it("devuelve la denuncia con su historial", async () => {
    const usuario = await crearUsuario();
    mockSesion({ id: usuario.id, rol: "ciudadano" });

    const creada = await POST(
      new Request("http://localhost/api/denuncias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoria: "Otro", descripcion: "Prueba de consulta" }),
      }),
    );
    const { codigoSeguimiento } = await creada.json();

    const response = await GET(new Request(`http://localhost/api/denuncias/${codigoSeguimiento}`), {
      params: Promise.resolve({ id: codigoSeguimiento }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.estado).toBe("Recibido");
    expect(data.historial).toHaveLength(1);
    expect(data.historial[0].estado).toBe("Recibido");
  });
});
