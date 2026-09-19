import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  // Servidor dedicado en un puerto distinto al de `npm run dev` (3000), para
  // que las pruebas e2e nunca compartan proceso ni base de datos con tu
  // servidor de desarrollo normal, aunque lo tengas corriendo al mismo tiempo.
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      DATABASE_URL: "file:./test.db",
      AUTH_SECRET: "test-secret-not-for-production",
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
