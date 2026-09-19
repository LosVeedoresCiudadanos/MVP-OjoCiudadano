import Link from "next/link";
import { auth } from "@/auth";
import { BuscarDenunciaForm } from "@/components/BuscarDenunciaForm";

export default async function Home() {
  const session = await auth();
  const esAdmin = session?.user?.rol === "admin";

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 px-4 py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">
        Buzón de Reportes Ciudadanos
      </h1>
      <p className="max-w-md text-slate-600 dark:text-slate-300">
        Reporta un problema relacionado con el uso de recursos públicos y dale seguimiento a tu
        denuncia con un código único.
      </p>

      {esAdmin ? (
        <Link
          href="/admin"
          className="rounded bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          Ir al panel de administración
        </Link>
      ) : (
        <Link
          href="/denuncias/nueva"
          className="rounded bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          Crear una denuncia
        </Link>
      )}

      <div className="flex w-full flex-col items-center gap-3 border-t border-slate-200 pt-8 dark:border-slate-800">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          ¿Ya tienes un código de seguimiento?
        </p>
        <BuscarDenunciaForm />
      </div>
    </div>
  );
}
