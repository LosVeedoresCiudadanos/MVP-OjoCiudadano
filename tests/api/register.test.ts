import { beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/register/route";
import { resetDb } from "../helpers/db";

function registerRequest(body: unknown) {
  return new Request("http://localhost/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/register", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("crea un usuario con datos válidos", async () => {
    const response = await POST(
      registerRequest({
        nombre: "Ana Pérez",
        email: "ana@example.com",
        password: "supersecreta",
      }),
    );

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toMatchObject({ email: "ana@example.com" });
    expect(data.id).toBeTypeOf("number");
  });

  it("rechaza un email duplicado", async () => {
    await POST(
      registerRequest({
        nombre: "Ana Pérez",
        email: "ana@example.com",
        password: "supersecreta",
      }),
    );

    const response = await POST(
      registerRequest({
        nombre: "Otra Persona",
        email: "ana@example.com",
        password: "otraclave1",
      }),
    );

    expect(response.status).toBe(409);
  });

  it("rechaza un email con formato inválido", async () => {
    const response = await POST(
      registerRequest({
        nombre: "Ana Pérez",
        email: "no-es-un-email",
        password: "supersecreta",
      }),
    );

    expect(response.status).toBe(400);
  });

  it("rechaza una contraseña demasiado corta", async () => {
    const response = await POST(
      registerRequest({
        nombre: "Ana Pérez",
        email: "ana2@example.com",
        password: "corta",
      }),
    );

    expect(response.status).toBe(400);
  });

  it("rechaza un nombre vacío", async () => {
    const response = await POST(
      registerRequest({
        nombre: "   ",
        email: "ana3@example.com",
        password: "supersecreta",
      }),
    );

    expect(response.status).toBe(400);
  });
});
