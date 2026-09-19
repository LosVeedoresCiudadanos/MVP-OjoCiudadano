import { config } from "dotenv";
import path from "node:path";
import { vi } from "vitest";

config({ path: path.resolve(__dirname, "../.env.test"), override: true });

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/mailer", () => ({
  enviarCorreo: vi.fn().mockResolvedValue(undefined),
}));
