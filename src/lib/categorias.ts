export const CATEGORIAS_DENUNCIA = [
  "Obra pública abandonada",
  "Mala calidad de obra/servicio",
  "Sospecha de irregularidad/corrupción",
  "Espacio público en mal estado",
  "Otro",
] as const;

export type CategoriaDenuncia = (typeof CATEGORIAS_DENUNCIA)[number];
