import { beforeEach, describe, expect, it } from "vitest";
import { GET, POST } from "@/app/api/denuncias/route";
import { resetDb, crearUsuario } from "../helpers/db";
import { mockSesion, mockSinSesion } from "../helpers/session";

function req(body: unknown) {
  return new Request("http://localhost/api/denuncias", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function reqGet(query = "") {
  return new Request(`http://localhost/api/denuncias${query}`);
}

describe("POST /api/denuncias", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("rechaza si no hay sesión", async () => {
    mockSinSesion();
    const response = await POST(
      req({ categoria: "Otro", descripcion: "algo", ubicacion: "aquí" }),
    );
    expect(response.status).toBe(401);
  });

  it("crea una denuncia asociada al usuario autenticado", async () => {
    const usuario = await crearUsuario();
    mockSesion({ id: usuario.id, rol: "ciudadano" });

    const response = await POST(
      req({
        categoria: "Obra pública abandonada",
        descripcion: "Obra detenida hace 6 meses",
        ubicacion: "Calle 1 # 2-3",
        evidencia: ["/uploads/foto1.jpg"],
      }),
    );

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toMatchObject({ estado: "Recibido" });
    expect(data.codigoSeguimiento).toBeTypeOf("string");
  });

  it("rechaza si el usuario autenticado es admin", async () => {
    const admin = await crearUsuario({ rol: "admin" });
    mockSesion({ id: admin.id, rol: "admin" });

    const response = await POST(
      req({ categoria: "Otro", descripcion: "Un admin no debería poder crear esto" }),
    );
    expect(response.status).toBe(403);
  });

  it("rechaza una categoría inválida", async () => {
    const usuario = await crearUsuario();
    mockSesion({ id: usuario.id, rol: "ciudadano" });

    const response = await POST(
      req({ categoria: "No existe", descripcion: "algo" }),
    );
    expect(response.status).toBe(400);
  });

  it("rechaza una descripción vacía", async () => {
    const usuario = await crearUsuario();
    mockSesion({ id: usuario.id, rol: "ciudadano" });

    const response = await POST(
      req({ categoria: "Otro", descripcion: "   " }),
    );
    expect(response.status).toBe(400);
  });
});

describe("GET /api/denuncias", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("rechaza si no es admin", async () => {
    const usuario = await crearUsuario();
    mockSesion({ id: usuario.id, rol: "ciudadano" });

    const response = await GET(reqGet());
    expect(response.status).toBe(403);
  });

  it("lista denuncias para un admin, con filtros", async () => {
    const ciudadano = await crearUsuario();
    mockSesion({ id: ciudadano.id, rol: "ciudadano" });
    await POST(req({ categoria: "Otro", descripcion: "Denuncia A" }));
    await POST(
      req({ categoria: "Obra pública abandonada", descripcion: "Denuncia B" }),
    );

    const admin = await crearUsuario({ rol: "admin" });
    mockSesion({ id: admin.id, rol: "admin" });

    const respuestaTodas = await GET(reqGet());
    expect(respuestaTodas.status).toBe(200);
    const todas = await respuestaTodas.json();
    expect(todas).toHaveLength(2);

    const respuestaFiltrada = await GET(reqGet("?categoria=Otro"));
    const filtradas = await respuestaFiltrada.json();
    expect(filtradas).toHaveLength(1);
    expect(filtradas[0].categoria).toBe("Otro");
  });

  it("incluye descripción, ubicación y evidencia para que el admin pueda revisarlas", async () => {
    const ciudadano = await crearUsuario();
    mockSesion({ id: ciudadano.id, rol: "ciudadano" });
    await POST(
      req({
        categoria: "Otro",
        descripcion: "Bache profundo",
        ubicacion: "Calle 5 # 10-20",
        evidencia: ["/uploads/foto1.jpg", "https://blob.vercel-storage.com/foto2.jpg"],
      }),
    );

    const admin = await crearUsuario({ rol: "admin" });
    mockSesion({ id: admin.id, rol: "admin" });

    const respuesta = await GET(reqGet());
    const [denuncia] = await respuesta.json();
    expect(denuncia.descripcion).toBe("Bache profundo");
    expect(denuncia.ubicacion).toBe("Calle 5 # 10-20");
    expect(denuncia.evidencia).toEqual([
      "/uploads/foto1.jpg",
      "https://blob.vercel-storage.com/foto2.jpg",
    ]);
  });
});
