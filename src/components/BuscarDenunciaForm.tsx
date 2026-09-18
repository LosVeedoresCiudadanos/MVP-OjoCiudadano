"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BuscarDenunciaForm() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (codigo.trim()) {
      router.push(`/denuncias/${codigo.trim()}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm gap-2">
      <input
        type="text"
        required
        placeholder="Código de seguimiento"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
        className="flex-1 rounded border border-black/20 px-3 py-2 text-sm dark:border-white/20"
      />
      <button
        type="submit"
        className="rounded border border-black/20 px-4 py-2 text-sm dark:border-white/20"
      >
        Consultar
      </button>
    </form>
  );
}
