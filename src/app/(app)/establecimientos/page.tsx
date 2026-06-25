import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth";
import { EstablecimientosClient } from "./establecimientos-client";
import type { Establecimiento, Cargo, ContratoConRelaciones } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EstablecimientosPage() {
  const supabase = await createClient();
  const usuario = await getUsuarioActual();

  const [estRes, cargosRes, contratosRes] = await Promise.all([
    supabase.from("establecimientos").select("*").order("nombre", { ascending: true }),
    supabase.from("cargos").select("*").order("orden", { ascending: true }),
    supabase
      .from("contratos")
      .select("*, establecimientos(nombre)")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <EstablecimientosClient
      establecimientos={(estRes.data as Establecimiento[]) ?? []}
      cargos={(cargosRes.data as Cargo[]) ?? []}
      contratos={(contratosRes.data as ContratoConRelaciones[]) ?? []}
      rol={usuario?.rol ?? "encargado"}
    />
  );
}
