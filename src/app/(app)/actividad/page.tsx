import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { ActividadClient, type RegistroFila } from "./actividad-client";

export const dynamic = "force-dynamic";

export default async function ActividadPage() {
  const usuario = await getUsuarioActual();

  // Solo el administrador (CEO) puede ver el panel de control.
  if (!usuario || usuario.rol !== "admin") {
    redirect("/dashboard");
  }

  const admin = createAdminClient();
  if (!admin) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold text-slate-900">Panel de control</h1>
        <Card className="space-y-2">
          <p className="font-medium text-amber-600">Falta configurar la clave de servicio</p>
          <p className="text-sm text-slate-500">
            Para ver el registro de actividad necesitas la variable{" "}
            <code className="rounded bg-slate-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> en el servidor.
          </p>
        </Card>
      </div>
    );
  }

  const { data } = await admin
    .from("registro_actividad")
    .select("id, creado_en, usuario_nombre, accion, entidad, entidad_id, datos")
    .order("creado_en", { ascending: false })
    .limit(1000);

  const registros: RegistroFila[] = (data ?? []).map((r) => ({
    id: r.id as string,
    creado_en: r.creado_en as string,
    usuario: (r.usuario_nombre as string | null) ?? "—",
    accion: r.accion as string,
    entidad: r.entidad as string,
    entidad_id: (r.entidad_id as string | null) ?? null,
    datos: (r.datos as Record<string, unknown> | null) ?? null,
  }));

  return <ActividadClient registros={registros} />;
}
