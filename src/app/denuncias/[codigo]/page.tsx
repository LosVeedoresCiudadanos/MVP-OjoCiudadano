import Link from "next/link";
import { getDenunciaPorCodigo } from "@/lib/denuncias";
import { EstadoBadge } from "@/components/EstadoBadge";

function formatearFecha(fecha: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(fecha);
}

export default async function DetalleDenunciaPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const denuncia = await getDenunciaPorCodigo(codigo);

  if (!denuncia) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <h1 className="mb-2 text-xl font-semibold">Denuncia no encontrada</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          No existe ninguna denuncia con el código <code>{codigo}</code>. Verifica que lo hayas
          copiado bien.
        </p>
        <Link href="/" className="mt-4 inline-block text-primary hover:underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <p className="mb-1 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Código de seguimiento
      </p>
      <h1 className="mb-4 font-mono text-lg" data-testid="codigo-seguimiento">
        {codigo}
      </h1>

      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm text-slate-600 dark:text-slate-300">Estado actual:</span>
        <EstadoBadge estado={denuncia.estado} />
      </div>

      <dl className="mb-8 grid grid-cols-1 gap-3 text-sm">
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Categoría</dt>
          <dd>{denuncia.categoria}</dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Descripción</dt>
          <dd className="whitespace-pre-wrap">{denuncia.descripcion}</dd>
        </div>
        {denuncia.ubicacion && (
          <div>
            <dt className="text-slate-500 dark:text-slate-400">Ubicación</dt>
            <dd>{denuncia.ubicacion}</dd>
          </div>
        )}
        {denuncia.evidencia.length > 0 && (
          <div>
            <dt className="mb-2 text-slate-500 dark:text-slate-400">Evidencia</dt>
            <dd className="flex flex-wrap gap-2">
              {denuncia.evidencia.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url}
                  src={url}
                  alt="Evidencia de la denuncia"
                  className="h-24 w-24 rounded object-cover"
                />
              ))}
            </dd>
          </div>
        )}
      </dl>

      <h2 className="mb-3 text-sm font-semibold">Historial</h2>
      <ol className="flex flex-col gap-3 border-l border-slate-200 pl-4 dark:border-slate-800">
        {denuncia.historial.map((evento, index) => (
          <li key={index} className="text-sm">
            <div className="flex items-center gap-2">
              <EstadoBadge estado={evento.estado} />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {formatearFecha(evento.fecha)}
              </span>
            </div>
            {evento.comentario && (
              <p className="mt-1 text-slate-700 dark:text-slate-200">{evento.comentario}</p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
