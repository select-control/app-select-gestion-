import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { getUsuarioActual } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await getUsuarioActual();

  if (!usuario) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      <Sidebar
        rol={usuario.rol}
        nombre={usuario.perfil?.nombre ?? null}
        email={usuario.email}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="animate-fade-in px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
