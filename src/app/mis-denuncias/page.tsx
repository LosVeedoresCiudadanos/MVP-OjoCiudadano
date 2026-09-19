import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EstadoBadge } from "@/components/EstadoBadge";

function formatearFecha(fecha: Date) {
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(fecha);
}

export default async function MisDenunciasPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.rol === "admin") {
    redirect("/admin");
  }

  const denuncias = await prisma.denuncia.findMany({
    where: { usuarioId: Number(session.user.id) },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-6 text-xl font-semibold">Mis denuncias</h1>

      {denuncias.length === 0 ? (
        <div className="text-sm text-slate-600 dark:text-slate-300">
          <p className="mb-3">Todavía no has creado ninguna denuncia.</p>
          <Link href="/denuncias/nueva" className="text-primary hover:underline">
            Crear tu primera denuncia
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {denuncias.map((denuncia) => (
            <li key={denuncia.id}>
              <Link
                href={`/denuncias/${denuncia.codigoSeguimiento}`}
                className="flex items-center justify-between rounded border border-slate-200 p-3 text-sm hover:border-primary dark:border-slate-800"
              >
                <span>
                  <span className="block font-medium">{denuncia.categoria}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {formatearFecha(denuncia.createdAt)} · {denuncia.codigoSeguimiento}
                  </span>
                </span>
                <EstadoBadge estado={denuncia.estado} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
