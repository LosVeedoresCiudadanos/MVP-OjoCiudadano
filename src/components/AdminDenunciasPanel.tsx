"use client";

import { useEffect, useState } from "react";
import { CATEGORIAS_DENUNCIA } from "@/lib/categorias";
import { ESTADOS_DENUNCIA, siguientesEstadosPosibles } from "@/lib/estados";
import { EstadoBadge } from "@/components/EstadoBadge";
import { CARD_CLASS } from "@/lib/ui";

type DenunciaResumen = {
  id: number;
  categoria: string;
  descripcion: string;
  ubicacion: string | null;
  evidencia: string[];
  estado: string;
  fecha_creacion: string;
};

export function AdminDenunciasPanel() {
  const [denuncias, setDenuncias] = useState<DenunciaResumen[]>([]);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filaAbierta, setFilaAbierta] = useState<number | null>(null);

  async function cargarDenuncias() {
    setCargando(true);
    setError(null);
    const params = new URLSearchParams();
    if (filtroEstado) params.set("estado", filtroEstado);
    if (filtroCategoria) params.set("categoria", filtroCategoria);

    const respuesta = await fetch(`/api/denuncias?${params.toString()}`);
    if (!respuesta.ok) {
      setError("No se pudieron cargar las denuncias");
      setCargando(false);
      return;
    }
    setDenuncias(await respuesta.json());
    setCargando(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga de datos al cambiar filtros, es async y no causa loop
    cargarDenuncias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado, filtroCategoria]);

  return (
    <div className="flex flex-col gap-6">
      <div className={`${CARD_CLASS} flex flex-wrap gap-4 p-4 text-sm`}>
        <label className="flex flex-col gap-1">
          Estado
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">Todos</option>
            {ESTADOS_DENUNCIA.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Categoría
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">Todas</option>
            {CATEGORIAS_DENUNCIA.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {cargando ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
      ) : denuncias.length === 0 ? (
        <div className={`${CARD_CLASS} p-6 text-sm text-slate-600 dark:text-slate-300`}>
          No hay denuncias que coincidan con los filtros.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {denuncias.map((denuncia) => (
            <li key={denuncia.id} className={`${CARD_CLASS} p-4`}>
              <button
                type="button"
                onClick={() => setFilaAbierta(filaAbierta === denuncia.id ? null : denuncia.id)}
                className="flex w-full items-center justify-between text-left text-sm"
              >
                <span>
                  #{denuncia.id} · {denuncia.categoria}
                </span>
                <EstadoBadge estado={denuncia.estado} />
              </button>
              {filaAbierta === denuncia.id && (
                <>
                  <DetalleDenuncia denuncia={denuncia} />
                  <CambiarEstadoForm
                    denuncia={denuncia}
                    onActualizado={() => {
                      setFilaAbierta(null);
                      cargarDenuncias();
                    }}
                  />
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DetalleDenuncia({ denuncia }: { denuncia: DenunciaResumen }) {
  return (
    <div className="mt-3 border-t border-slate-200 pt-3 text-sm dark:border-slate-700">
      <p className="whitespace-pre-wrap">{denuncia.descripcion}</p>
      {denuncia.ubicacion && (
        <p className="mt-2 text-slate-500 dark:text-slate-400">Ubicación: {denuncia.ubicacion}</p>
      )}
      {denuncia.evidencia.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {denuncia.evidencia.map((url) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="Evidencia de la denuncia"
                className="h-24 w-24 rounded object-cover hover:opacity-80"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function CambiarEstadoForm({
  denuncia,
  onActualizado,
}: {
  denuncia: DenunciaResumen;
  onActualizado: () => void;
}) {
  const opciones = siguientesEstadosPosibles(denuncia.estado);
  const [nuevoEstado, setNuevoEstado] = useState<string>(opciones[0] ?? "");
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setEnviando(true);

    const respuesta = await fetch(`/api/denuncias/${denuncia.id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado, comentario: comentario || undefined }),
    });

    setEnviando(false);

    if (!respuesta.ok) {
      const data = await respuesta.json().catch(() => ({}));
      setError(data.error ?? "No se pudo actualizar el estado");
      return;
    }

    onActualizado();
  }

  return (
    <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
      {opciones.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Esta denuncia ya está en su estado final.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 text-sm">
          <label className="flex flex-col gap-1">
            Nuevo estado
            <select
              value={nuevoEstado}
              onChange={(e) => setNuevoEstado(e.target.value)}
              className="rounded border border-slate-300 px-2 py-1 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-900"
            >
              {opciones.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            Comentario (opcional)
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={2}
              className="rounded border border-slate-300 px-2 py-1 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
          {error && <p className="text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={enviando}
            className="self-start rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            {enviando ? "Guardando..." : "Actualizar estado"}
          </button>
        </form>
      )}
    </div>
  );
}
