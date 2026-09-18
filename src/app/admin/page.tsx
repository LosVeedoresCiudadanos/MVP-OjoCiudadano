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
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-xl font-semibold">Panel de administración</h1>
      <AdminDenunciasPanel />
    </div>
  );
}
