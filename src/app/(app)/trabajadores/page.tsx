import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth";
import { TrabajadoresClient } from "./trabajadores-client";
import type { TrabajadorConCargo, Cargo } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TrabajadoresPage() {
  const supabase = await createClient();
  const usuario = await getUsuarioActual();

  const [trabajadoresRes, cargosRes] = await Promise.all([
    supabase
      .from("trabajadores")
      .select("*, cargos(nombre, tarifa_hora, unidad)")
      .order("nombre", { ascending: true }),
    supabase.from("cargos").select("*").order("orden"),
  ]);

  return (
    <TrabajadoresClient
      trabajadores={(trabajadoresRes.data as TrabajadorConCargo[]) ?? []}
      cargos={(cargosRes.data as Cargo[]) ?? []}
      rol={usuario?.rol ?? "encargado"}
    />
  );
}
