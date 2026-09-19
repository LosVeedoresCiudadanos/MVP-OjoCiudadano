import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/denuncias/route";
import { PATCH } from "@/app/api/denuncias/[id]/estado/route";
import { enviarCorreo } from "@/lib/mailer";
import { resetDb, crearUsuario } from "../helpers/db";
import { mockSesion } from "../helpers/session";

const mockedEnviarCorreo = vi.mocked(enviarCorreo);

async function crearDenuncia(usuarioId: number) {
  mockSesion({ id: usuarioId, rol: "ciudadano" });
  const response = await POST(
    new Request("http://localhost/api/denuncias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoria: "Otro", descripcion: "Denuncia de prueba" }),
    }),
  );
  return response.json();
}

function patchReq(id: number, body: unknown) {
  return PATCH(
    new Request(`http://localhost/api/denuncias/${id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: String(id) }) },
  );
}

describe("PATCH /api/denuncias/:id/estado", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("rechaza si no es admin", async () => {
    const ciudadano = await crearUsuario();
    const { id } = await crearDenuncia(ciudadano.id);

    mockSesion({ id: ciudadano.id, rol: "ciudadano" });
    const response = await patchReq(id, { estado: "En revisión" });
    expect(response.status).toBe(403);
  });

  it("permite a un admin avanzar Recibido -> En revisión", async () => {
    const ciudadano = await crearUsuario({ email: "notificado@example.com" });
    const { id } = await crearDenuncia(ciudadano.id);

    const admin = await crearUsuario({ rol: "admin" });
    mockSesion({ id: admin.id, rol: "admin" });

    mockedEnviarCorreo.mockClear();
    const response = await patchReq(id, { estado: "En revisión", comentario: "Se está revisando" });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.estado).toBe("En revisión");

    expect(mockedEnviarCorreo).toHaveBeenCalledTimes(1);
    expect(mockedEnviarCorreo).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "notificado@example.com",
        subject: expect.stringContaining("En revisión"),
        body: expect.stringContaining("Se está revisando"),
      }),
    );
  });

  it("rechaza una transición inválida (Recibido -> Respondido)", async () => {
    const ciudadano = await crearUsuario();
    const { id } = await crearDenuncia(ciudadano.id);

    const admin = await crearUsuario({ rol: "admin" });
    mockSesion({ id: admin.id, rol: "admin" });

    mockedEnviarCorreo.mockClear();
    const response = await patchReq(id, { estado: "Respondido" });
    expect(response.status).toBe(400);
    expect(mockedEnviarCorreo).not.toHaveBeenCalled();
  });

  it("devuelve 404 si la denuncia no existe", async () => {
    const admin = await crearUsuario({ rol: "admin" });
    mockSesion({ id: admin.id, rol: "admin" });

    const response = await patchReq(999999, { estado: "En revisión" });
    expect(response.status).toBe(404);
  });
});
