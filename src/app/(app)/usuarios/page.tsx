import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { UsuariosClient, type UsuarioFila } from "./usuarios-client";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const usuario = await getUsuarioActual();

  // Solo admin
  if (!usuario || usuario.rol !== "admin") {
    redirect("/dashboard");
  }

  const admin = createAdminClient();

  if (!admin) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold text-slate-900">Usuarios</h1>
        <Card className="space-y-2">
          <p className="font-medium text-amber-600">
            Falta configurar la clave de servicio
          </p>
          <p className="text-sm text-slate-500">
            Para crear y gestionar accesos desde aqui necesitas anadir la variable{" "}
            <code className="rounded bg-slate-100 px-1 text-slate-800">
              SUPABASE_SERVICE_ROLE_KEY
            </code>{" "}
            en tu archivo <code className="rounded bg-slate-100 px-1">.env.local</code>.
            La encuentras en Supabase → Settings → API → &quot;service_role&quot;.
            Revisa la guia (README) para los pasos. Mientras tanto, puedes crear
            usuarios directamente en el panel de Supabase.
          </p>
        </Card>
      </div>
    );
  }

  // Lista de logins (auth) + perfiles (usuarios_app)
  const [{ data: authData }, { data: perfiles }] = await Promise.all([
    admin.auth.admin.listUsers(),
    admin.from("usuarios_app").select("id, nombre, rol"),
  ]);

  const perfilPorId = new Map(
    (perfiles ?? []).map((p) => [p.id, p as { id: string; nombre: string | null; rol: string }])
  );

  const usuarios: UsuarioFila[] = (authData?.users ?? []).map((u) => {
    const perfil = perfilPorId.get(u.id);
    return {
      id: u.id,
      email: u.email ?? "(sin email)",
      nombre: perfil?.nombre ?? u.email ?? "",
      rol: perfil?.rol === "admin" ? "admin" : "encargado",
    };
  });

  return <UsuariosClient usuarios={usuarios} miId={usuario.perfil?.id ?? null} />;
}
