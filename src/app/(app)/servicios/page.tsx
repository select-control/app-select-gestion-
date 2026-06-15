import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth";
import { ServiciosClient } from "./servicios-client";
import type {
  ServicioConRelaciones,
  Establecimiento,
  TrabajadorConCargo,
  Cargo,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ServiciosPage() {
  const supabase = createClient();
  const usuario = await getUsuarioActual();

  const [serviciosRes, establecimientosRes, trabajadoresRes, cargosRes] =
    await Promise.all([
      supabase
        .from("servicios")
        .select(
          "*, establecimientos(nombre, tarifa_hora_cliente), asignaciones(*, trabajadores(nombre), cargos(nombre))"
        )
        .order("fecha", { ascending: false }),
      supabase
        .from("establecimientos")
        .select("*")
        .eq("activo", true)
        .order("nombre"),
      supabase
        .from("trabajadores")
        .select("*, cargos(nombre, tarifa_hora)")
        .eq("activo", true)
        .order("nombre"),
      supabase.from("cargos").select("*").order("orden"),
    ]);

  return (
    <ServiciosClient
      servicios={(serviciosRes.data as ServicioConRelaciones[]) ?? []}
      establecimientos={(establecimientosRes.data as Establecimiento[]) ?? []}
      trabajadores={(trabajadoresRes.data as TrabajadorConCargo[]) ?? []}
      cargos={(cargosRes.data as Cargo[]) ?? []}
      rol={usuario?.rol ?? "encargado"}
    />
  );
}
