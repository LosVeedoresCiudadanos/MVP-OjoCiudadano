import type { Mock } from "vitest";
import type { Session } from "next-auth";
import { auth } from "@/auth";

const mockedAuth = auth as unknown as Mock<() => Promise<Session | null>>;

export function mockSesion(usuario: { id: number; rol: string; nombre?: string; email?: string }) {
  mockedAuth.mockResolvedValue({
    user: {
      id: String(usuario.id),
      rol: usuario.rol,
      name: usuario.nombre ?? "Usuario de prueba",
      email: usuario.email ?? "test@example.com",
    },
    expires: new Date(Date.now() + 3600_000).toISOString(),
  });
}

export function mockSinSesion() {
  mockedAuth.mockResolvedValue(null);
}
