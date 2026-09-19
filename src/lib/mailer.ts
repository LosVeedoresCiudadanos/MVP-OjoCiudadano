import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

type CorreoParams = {
  to: string;
  subject: string;
  body: string;
};

const OUTBOX_DIR = path.join(process.cwd(), "mail-outbox");
const OUTBOX_FILE = path.join(OUTBOX_DIR, "outbox.log");

// Simulador de envío de correo para desarrollo: no hay proveedor real
// configurado todavía (ver CLAUDE.md). Loguea en consola y deja un registro
// en mail-outbox/outbox.log para poder inspeccionar qué se "habría enviado".
// Cambiar la implementación interna aquí (ej. por Resend o SMTP) no debería
// requerir tocar quién la llama.
export async function enviarCorreo({ to, subject, body }: CorreoParams) {
  const timestamp = new Date().toISOString();
  const entrada = `\n--- ${timestamp} ---\nPara: ${to}\nAsunto: ${subject}\n\n${body}\n`;

  console.log(`[correo simulado] "${subject}" -> ${to}`);

  await mkdir(OUTBOX_DIR, { recursive: true });
  await appendFile(OUTBOX_FILE, entrada, "utf-8");
}
