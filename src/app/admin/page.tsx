import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminDenunciasPanel } from "@/components/AdminDenunciasPanel";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.rol !== "admin") {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Panel de administración
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Revisa las denuncias ciudadanas y actualiza su estado.
        </p>
      </div>
      <AdminDenunciasPanel />
    </div>
  );
}
