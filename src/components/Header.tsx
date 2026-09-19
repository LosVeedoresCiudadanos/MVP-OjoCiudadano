"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold text-primary">
          Buzón de Reportes Ciudadanos
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {status === "authenticated" ? (
            <>
              {session.user?.rol !== "admin" && (
                <>
                  <Link href="/mis-denuncias" className="text-primary hover:underline">
                    Mis denuncias
                  </Link>
                  <Link href="/denuncias/nueva" className="text-primary hover:underline">
                    Nueva denuncia
                  </Link>
                </>
              )}
              <span data-testid="usuario-sesion" className="text-slate-600 dark:text-slate-300">
                {session.user?.name}
              </span>
              {session.user?.rol === "admin" && (
                <Link href="/admin" className="text-primary hover:underline">
                  Admin
                </Link>
              )}
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-slate-600 hover:underline dark:text-slate-300"
              >
                Cerrar sesión
              </button>
            </>
          ) : status === "loading" ? null : (
            <>
              <Link href="/login" className="text-primary hover:underline">
                Iniciar sesión
              </Link>
              <Link href="/registro" className="text-primary hover:underline">
                Registrarse
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
