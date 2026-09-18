const ESTILOS: Record<string, string> = {
  Recibido: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "En revisión": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  Respondido: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
        ESTILOS[estado] ?? "bg-gray-100 text-gray-800"
      }`}
    >
      {estado}
    </span>
  );
}
