import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth";
import { EstablecimientosClient } from "./establecimientos-client";
import type { Establecimiento } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EstablecimientosPage() {
  const supabase = createClient();
  const usuario = await getUsuarioActual();

  const { data } = await supabase
    .from("establecimientos")
    .select("*")
    .order("nombre", { ascending: true });

  return (
    <EstablecimientosClient
      establecimientos={(data as Establecimiento[]) ?? []}
      rol={usuario?.rol ?? "encargado"}
    />
  );
}
