export const ESTADOS_DENUNCIA = ["Recibido", "En revisión", "Respondido"] as const;
export type EstadoDenuncia = (typeof ESTADOS_DENUNCIA)[number];

const TRANSICIONES_VALIDAS: Record<EstadoDenuncia, EstadoDenuncia[]> = {
  Recibido: ["En revisión"],
  "En revisión": ["Respondido"],
  Respondido: [],
};

export function esTransicionValida(actual: string, siguiente: string): siguiente is EstadoDenuncia {
  if (!ESTADOS_DENUNCIA.includes(siguiente as EstadoDenuncia)) {
    return false;
  }
  const permitidos = TRANSICIONES_VALIDAS[actual as EstadoDenuncia];
  return permitidos?.includes(siguiente as EstadoDenuncia) ?? false;
}
