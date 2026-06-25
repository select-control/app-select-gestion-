import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth";
import { ContratosClient } from "./contratos-client";
import type { ContratoConRelaciones, Establecimiento } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ContratosPage() {
  const supabase = await createClient();
  const usuario = await getUsuarioActual();

  const [contratosRes, establecimientosRes] = await Promise.all([
    supabase
      .from("contratos")
      .select("*, establecimientos(nombre)")
      .order("created_at", { ascending: false }),
    supabase.from("establecimientos").select("*").eq("activo", true).order("nombre"),
  ]);

  return (
    <ContratosClient
      contratos={(contratosRes.data as ContratoConRelaciones[]) ?? []}
      establecimientos={(establecimientosRes.data as Establecimiento[]) ?? []}
      rol={usuario?.rol ?? "encargado"}
    />
  );
}
