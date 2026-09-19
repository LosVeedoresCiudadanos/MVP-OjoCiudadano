"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CATEGORIAS_DENUNCIA } from "@/lib/categorias";

export default function NuevaDenunciaPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [categoria, setCategoria] = useState<string>(CATEGORIAS_DENUNCIA[0]);
  const [descripcion, setDescripcion] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [archivos, setArchivos] = useState<FileList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  if (status === "loading") {
    return null;
  }

  if (status === "unauthenticated") {
    return (
      <div className="mx-auto max-w-sm px-4 py-10">
        <h1 className="mb-4 text-xl font-semibold">Inicia sesión para continuar</h1>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
          Necesitas una cuenta para crear una denuncia y poder darle seguimiento.
        </p>
        <a href="/login" className="underline">
          Ir a iniciar sesión
        </a>
      </div>
    );
  }

  if (session?.user?.rol === "admin") {
    return (
      <div className="mx-auto max-w-sm px-4 py-10">
        <h1 className="mb-4 text-xl font-semibold">No disponible para administradores</h1>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
          Los administradores revisan y responden denuncias, no las crean.
        </p>
        <a href="/admin" className="text-primary hover:underline">
          Ir al panel de administración
        </a>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const urlsEvidencia: string[] = [];
      if (archivos) {
        for (const archivo of Array.from(archivos)) {
          const formData = new FormData();
          formData.set("archivo", archivo);
          const respuestaUpload = await fetch("/api/upload", { method: "POST", body: formData });
          if (!respuestaUpload.ok) {
            const data = await respuestaUpload.json().catch(() => ({}));
            throw new Error(data.error ?? "No se pudo subir la evidencia");
          }
          const { url } = await respuestaUpload.json();
          urlsEvidencia.push(url);
        }
      }

      const respuesta = await fetch("/api/denuncias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoria,
          descripcion,
          ubicacion: ubicacion || undefined,
          evidencia: urlsEvidencia,
        }),
      });

      if (!respuesta.ok) {
        const data = await respuesta.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo crear la denuncia");
      }

      const { codigoSeguimiento } = await respuesta.json();
      router.push(`/denuncias/${codigoSeguimiento}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-6 text-xl font-semibold">Nueva denuncia</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Categoría
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-900"
          >
            {CATEGORIAS_DENUNCIA.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Descripción
          <textarea
            required
            rows={5}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Ubicación (opcional)
          <input
            type="text"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Evidencia (opcional, fotos)
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setArchivos(e.target.files)}
            className="text-sm"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={cargando}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {cargando ? "Enviando..." : "Enviar denuncia"}
        </button>
      </form>
    </div>
  );
}
