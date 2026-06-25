import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth";
import { CajaClient } from "./caja-client";
import type { MovimientoCaja, Garantia, ServicioConRelaciones } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CajaPage() {
  const supabase = await createClient();
  const usuario = await getUsuarioActual();

  const [movRes, garRes, srvRes] = await Promise.all([
    supabase.from("caja_movimientos").select("*").order("fecha", { ascending: true }),
    supabase.from("garantias").select("*").order("vencimiento", { ascending: true }),
    supabase
      .from("servicios")
      .select(
        "*, establecimientos(nombre, tarifa_hora_cliente), asignaciones(*, trabajadores(nombre), cargos(nombre))"
      )
      .neq("estado", "Cancelado")
      .order("fecha", { ascending: false }),
  ]);

  return (
    <CajaClient
      movimientos={(movRes.data as MovimientoCaja[]) ?? []}
      garantias={(garRes.data as Garantia[]) ?? []}
      servicios={(srvRes.data as ServicioConRelaciones[]) ?? []}
      rol={usuario?.rol ?? "encargado"}
    />
  );
}
