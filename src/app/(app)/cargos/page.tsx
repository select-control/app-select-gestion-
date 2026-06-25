import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth";
import { CargosClient } from "./cargos-client";
import type { Cargo } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CargosPage() {
  const supabase = await createClient();
  const usuario = await getUsuarioActual();

  const { data } = await supabase
    .from("cargos")
    .select("*")
    .order("orden", { ascending: true });

  return (
    <CargosClient
      cargos={(data as Cargo[]) ?? []}
      rol={usuario?.rol ?? "encargado"}
    />
  );
}
