import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BuscarDenunciaForm } from "@/components/BuscarDenunciaForm";
import { EstadoBadge } from "@/components/EstadoBadge";

const PASOS = [
  {
    numero: "01",
    titulo: "Reporta",
    descripcion: "Describe el problema y adjunta evidencia.",
  },
  {
    numero: "02",
    titulo: "Haz seguimiento",
    descripcion: "Recibe un código único para consultar tu denuncia.",
  },
  {
    numero: "03",
    titulo: "Conoce la respuesta",
    descripcion: "Consulta el estado y las actualizaciones.",
  },
];

const CARD =
  "rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:shadow-none";

function formatearFecha(fecha: Date) {
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(fecha);
}

export default async function Home() {
  const session = await auth();
  if (session?.user?.rol === "admin") {
    redirect("/admin");
  }

  const denuncias = session?.user
    ? await prisma.denuncia.findMany({
        where: { usuarioId: Number(session.user.id) },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const recibidas = denuncias.filter((d) => d.estado === "Recibido").length;
  const enRevision = denuncias.filter((d) => d.estado === "En revisión").length;
  const respondidas = denuncias.filter((d) => d.estado === "Respondido").length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      {/* Hero */}
      <section className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            ¿Qué quieres reportar hoy?
          </h1>
          <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">
            Ayúdanos a hacer seguimiento a problemas relacionados con obras, servicios y recursos
            públicos.
          </p>
        </div>
        <Link
          href="/denuncias/nueva"
          className="inline-block w-fit shrink-0 self-start rounded bg-primary px-5 py-2.5 text-sm font-medium whitespace-nowrap text-primary-foreground hover:bg-primary-hover"
        >
          + Crear una denuncia
        </Link>
      </section>

      {/* Cómo funciona */}
      <section className="mt-12 border-t border-slate-200 pt-10 dark:border-slate-800">
        <h2 className="mb-5 text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
          ¿Cómo funciona?
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PASOS.map((paso) => (
            <div key={paso.numero} className={`${CARD} p-5`}>
              <span className="text-xs font-semibold text-primary">{paso.numero}</span>
              <h3 className="mt-1 text-sm font-semibold">{paso.titulo}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{paso.descripcion}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tus denuncias (solo ciudadano logueado) */}
      {session?.user && (
        <section className="mt-12 border-t border-slate-200 pt-10 dark:border-slate-800">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
              Tus denuncias
            </h2>
            {denuncias.length > 0 && (
              <Link href="/mis-denuncias" className="text-sm text-primary hover:underline">
                Ver todas mis denuncias →
              </Link>
            )}
          </div>

          {denuncias.length === 0 ? (
            <div className={`${CARD} p-6 text-sm text-slate-600 dark:text-slate-300`}>
              <p className="mb-3">Todavía no has creado ninguna denuncia.</p>
              <Link href="/denuncias/nueva" className="text-primary hover:underline">
                Crear tu primera denuncia
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-3 gap-3">
                <div className={`${CARD} p-4 text-center`}>
                  <span className="block text-xl font-semibold">{recibidas}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Recibidas</span>
                </div>
                <div className={`${CARD} p-4 text-center`}>
                  <span className="block text-xl font-semibold">{enRevision}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">En revisión</span>
                </div>
                <div className={`${CARD} p-4 text-center`}>
                  <span className="block text-xl font-semibold">{respondidas}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Respondidas</span>
                </div>
              </div>

              <ul className="flex flex-col gap-3">
                {denuncias.slice(0, 4).map((denuncia) => (
                  <li key={denuncia.id}>
                    <Link
                      href={`/denuncias/${denuncia.codigoSeguimiento}`}
                      className={`${CARD} flex items-center justify-between p-4 text-sm hover:border-primary`}
                    >
                      <span>
                        <span className="block font-medium">{denuncia.categoria}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatearFecha(denuncia.createdAt)}
                        </span>
                      </span>
                      <EstadoBadge estado={denuncia.estado} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Consulta por código */}
      <section className="mt-12 border-t border-slate-200 pt-10 dark:border-slate-800">
        <div className={`${CARD} p-6`}>
          <p className="mb-3 text-sm font-medium">¿Ya tienes un código de seguimiento?</p>
          <BuscarDenunciaForm />
        </div>
      </section>
    </div>
  );
}
