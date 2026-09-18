import Link from "next/link";
import { BuscarDenunciaForm } from "@/components/BuscarDenunciaForm";

export default function Home() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 px-4 py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">
        Buzón de Reportes Ciudadanos
      </h1>
      <p className="max-w-md text-black/70 dark:text-white/70">
        Reporta un problema relacionado con el uso de recursos públicos y dale seguimiento a tu
        denuncia con un código único.
      </p>

      <Link
        href="/denuncias/nueva"
        className="rounded bg-black px-6 py-3 text-sm font-medium text-white dark:bg-white dark:text-black"
      >
        Crear una denuncia
      </Link>

      <div className="flex w-full flex-col items-center gap-3 border-t border-black/10 pt-8 dark:border-white/15">
        <p className="text-sm text-black/70 dark:text-white/70">
          ¿Ya tienes un código de seguimiento?
        </p>
        <BuscarDenunciaForm />
      </div>
    </div>
  );
}
