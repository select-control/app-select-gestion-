import { startOfMonth, endOfMonth, format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth";
import { InformesClient } from "./informes-client";
import type { ServicioConRelaciones } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function InformesPage() {
  const supabase = await createClient();
  const usuario = await getUsuarioActual();

  const ahora = new Date();
  const desde = format(startOfMonth(ahora), "yyyy-MM-dd");
  const hasta = format(endOfMonth(ahora), "yyyy-MM-dd");

  const { data } = await supabase
    .from("servicios")
    .select(
      "*, establecimientos(nombre, tarifa_hora_cliente), asignaciones(*, trabajadores(nombre, iban), cargos(nombre))"
    )
    .order("fecha", { ascending: false });

  return (
    <InformesClient
      servicios={(data as ServicioConRelaciones[]) ?? []}
      rol={usuario?.rol ?? "encargado"}
      desdeInicial={desde}
      hastaInicial={hasta}
    />
  );
}
