import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth";
import { EstablecimientosClient } from "./establecimientos-client";
import type { Establecimiento, Cargo } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EstablecimientosPage() {
  const supabase = createClient();
  const usuario = await getUsuarioActual();

  const [estRes, cargosRes] = await Promise.all([
    supabase.from("establecimientos").select("*").order("nombre", { ascending: true }),
    supabase.from("cargos").select("*").order("orden", { ascending: true }),
  ]);

  return (
    <EstablecimientosClient
      establecimientos={(estRes.data as Establecimiento[]) ?? []}
      cargos={(cargosRes.data as Cargo[]) ?? []}
      rol={usuario?.rol ?? "encargado"}
    />
  );
}
