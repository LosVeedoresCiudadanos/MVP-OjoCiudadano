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
        <p className="text-sm text-black/70 dark:text-white/70">
          No existe ninguna denuncia con el código <code>{codigo}</code>. Verifica que lo hayas
          copiado bien.
        </p>
        <Link href="/" className="mt-4 inline-block underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <p className="mb-1 text-xs uppercase tracking-wide text-black/60 dark:text-white/60">
        Código de seguimiento
      </p>
      <h1 className="mb-4 font-mono text-lg" data-testid="codigo-seguimiento">
        {codigo}
      </h1>

      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm text-black/70 dark:text-white/70">Estado actual:</span>
        <EstadoBadge estado={denuncia.estado} />
      </div>

      <dl className="mb-8 grid grid-cols-1 gap-3 text-sm">
        <div>
          <dt className="text-black/60 dark:text-white/60">Categoría</dt>
          <dd>{denuncia.categoria}</dd>
        </div>
        <div>
          <dt className="text-black/60 dark:text-white/60">Descripción</dt>
          <dd className="whitespace-pre-wrap">{denuncia.descripcion}</dd>
        </div>
        {denuncia.ubicacion && (
          <div>
            <dt className="text-black/60 dark:text-white/60">Ubicación</dt>
            <dd>{denuncia.ubicacion}</dd>
          </div>
        )}
        {denuncia.evidencia.length > 0 && (
          <div>
            <dt className="mb-2 text-black/60 dark:text-white/60">Evidencia</dt>
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
      <ol className="flex flex-col gap-3 border-l border-black/10 pl-4 dark:border-white/15">
        {denuncia.historial.map((evento, index) => (
          <li key={index} className="text-sm">
            <div className="flex items-center gap-2">
              <EstadoBadge estado={evento.estado} />
              <span className="text-xs text-black/60 dark:text-white/60">
                {formatearFecha(evento.fecha)}
              </span>
            </div>
            {evento.comentario && (
              <p className="mt-1 text-black/80 dark:text-white/80">{evento.comentario}</p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
