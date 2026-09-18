"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="border-b border-black/10 dark:border-white/15">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">
          Buzón de Reportes Ciudadanos
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {status === "authenticated" ? (
            <>
              <span data-testid="usuario-sesion">{session.user?.name}</span>
              {session.user?.rol === "admin" && (
                <Link href="/admin" className="underline">
                  Admin
                </Link>
              )}
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="underline"
              >
                Cerrar sesión
              </button>
            </>
          ) : status === "loading" ? null : (
            <>
              <Link href="/login" className="underline">
                Iniciar sesión
              </Link>
              <Link href="/registro" className="underline">
                Registrarse
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
