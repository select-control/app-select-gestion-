"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calcularHoras } from "@/lib/utils";

export type ResultadoAccion = { ok: boolean; error?: string; id?: string };

function revalidar() {
  revalidatePath("/servicios");
  revalidatePath("/dashboard");
  revalidatePath("/informes");
  revalidatePath("/caja");
}

// ----------------------------------------------------------------------------
// SERVICIOS
// ----------------------------------------------------------------------------

function leerServicio(formData: FormData) {
  const especialRaw = String(formData.get("precio_especial") || "").trim();
  // Vigilantes por cargo: campos del formulario "pc_<cargoId>" = nº necesarios.
  const puestos_por_cargo: Record<string, number> = {};
  formData.forEach((v, k) => {
    if (k.startsWith("pc_")) {
      const n = Math.max(0, Math.floor(Number(v) || 0));
      if (n > 0) puestos_por_cargo[k.slice(3)] = n;
    }
  });
  const total = Object.values(puestos_por_cargo).reduce((a, b) => a + b, 0);
  return {
    establecimiento_id: String(formData.get("establecimiento_id") || ""),
    fecha: String(formData.get("fecha") || ""),
    hora_inicio: String(formData.get("hora_inicio") || ""),
    hora_fin: String(formData.get("hora_fin") || ""),
    puestos_por_cargo,
    puestos_necesarios: total,
    precio_especial: especialRaw ? Number(especialRaw) : null,
    observaciones: String(formData.get("observaciones") || "").trim() || null,
    estado: String(formData.get("estado") || "Pendiente"),
  };
}

function validarServicio(d: ReturnType<typeof leerServicio>): string | null {
  if (!d.establecimiento_id) return "Selecciona un establecimiento.";
  if (!d.fecha) return "Indica la fecha.";
  if (!d.hora_inicio || !d.hora_fin) return "Indica hora de inicio y fin.";
  return null;
}

/** Lee del establecimiento su tarifa estandar y su delegacion. */
async function datosEstablecimiento(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string
): Promise<{ tarifa: number; delegacion: string | null }> {
  const { data } = await supabase
    .from("establecimientos")
    .select("tarifa_hora_cliente, delegacion")
    .eq("id", id)
    .single();
  return {
    tarifa: Number(data?.tarifa_hora_cliente) || 0,
    delegacion: data?.delegacion ?? null,
  };
}

export async function crearServicio(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const supabase = await createClient();
  const datos = leerServicio(formData);
  const err = validarServicio(datos);
  if (err) return { ok: false, error: err };

  const est = await datosEstablecimiento(supabase, datos.establecimiento_id);
  const { data, error } = await supabase
    .from("servicios")
    .insert({
      ...datos,
      precio_hora_cliente: est.tarifa,
      delegacion: est.delegacion,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  revalidar();
  // Devolvemos el id del nuevo servicio para abrir su panel de trabajadores al vuelo.
  return { ok: true, id: data?.id as string | undefined };
}

export async function actualizarServicio(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const datos = leerServicio(formData);

  if (!id) return { ok: false, error: "Falta el identificador." };
  const err = validarServicio(datos);
  if (err) return { ok: false, error: err };

  const est = await datosEstablecimiento(supabase, datos.establecimiento_id);
  const { error } = await supabase
    .from("servicios")
    .update({ ...datos, precio_hora_cliente: est.tarifa, delegacion: est.delegacion })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  // El precio o el cliente pueden haber cambiado: re-fija el precio de cada asignacion.
  await repreciarServicio(supabase, id);

  revalidar();
  return { ok: true };
}

export async function borrarServicio(id: string): Promise<ResultadoAccion> {
  const supabase = await createClient();
  const { error } = await supabase.from("servicios").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidar();
  return { ok: true };
}

// ----------------------------------------------------------------------------
// ASIGNACIONES
// ----------------------------------------------------------------------------

async function resolverCosteHora(
  supabase: Awaited<ReturnType<typeof createClient>>,
  cargo_id: string | null
): Promise<number> {
  if (!cargo_id) return 0;
  const { data } = await supabase
    .from("cargos")
    .select("tarifa_hora")
    .eq("id", cargo_id)
    .single();
  return Number(data?.tarifa_hora) || 0;
}

/**
 * Precio/hora que se cobra al cliente por un puesto, segun su cargo.
 * Prioridad: precio especial del servicio > tarifa del cliente para ese cargo > tarifa general.
 */
async function resolverPrecioCliente(
  supabase: Awaited<ReturnType<typeof createClient>>,
  servicio_id: string,
  cargo_id: string | null
): Promise<number> {
  const { data: s } = await supabase
    .from("servicios")
    .select("precio_especial, establecimiento_id")
    .eq("id", servicio_id)
    .single();
  if (!s) return 0;
  if (s.precio_especial && Number(s.precio_especial) > 0) return Number(s.precio_especial);
  const { data: e } = await supabase
    .from("establecimientos")
    .select("tarifa_hora_cliente, tarifas_cliente")
    .eq("id", s.establecimiento_id)
    .single();
  if (!e) return 0;
  const tarifas = (e.tarifas_cliente as Record<string, number> | null) || {};
  const porCargo = cargo_id ? tarifas[cargo_id] : undefined;
  if (porCargo != null && Number(porCargo) > 0) return Number(porCargo);
  return Number(e.tarifa_hora_cliente) || 0;
}

/** Re-fija el precio de cliente de todas las asignaciones de un servicio (al editar precio/cliente). */
async function repreciarServicio(
  supabase: Awaited<ReturnType<typeof createClient>>,
  servicio_id: string
): Promise<void> {
  const { data: asigs } = await supabase
    .from("asignaciones")
    .select("id, cargo_id")
    .eq("servicio_id", servicio_id);
  for (const a of asigs ?? []) {
    const precio = await resolverPrecioCliente(supabase, servicio_id, a.cargo_id);
    await supabase.from("asignaciones").update({ precio_hora_cliente: precio }).eq("id", a.id);
  }
}

export async function crearAsignacion(payload: {
  servicio_id: string;
  trabajador_id: string | null;
  cargo_id: string | null;
  hueco: number;
  hora_inicio: string;
  hora_fin: string;
  horas_extra: number;
  precio_hora_extra: number;
  extras: number;
}): Promise<ResultadoAccion> {
  const supabase = await createClient();
  if (!payload.servicio_id) return { ok: false, error: "Falta el servicio." };
  if (!payload.hora_inicio || !payload.hora_fin)
    return { ok: false, error: "Indica hora de inicio y fin." };

  const coste_hora = await resolverCosteHora(supabase, payload.cargo_id);
  const precio_hora_cliente = await resolverPrecioCliente(
    supabase,
    payload.servicio_id,
    payload.cargo_id
  );

  const { error } = await supabase.from("asignaciones").insert({
    servicio_id: payload.servicio_id,
    trabajador_id: payload.trabajador_id,
    cargo_id: payload.cargo_id,
    hueco: payload.hueco || 1,
    hora_inicio: payload.hora_inicio,
    hora_fin: payload.hora_fin,
    horas: calcularHoras(payload.hora_inicio, payload.hora_fin),
    horas_extra: payload.horas_extra || 0,
    precio_hora_extra: payload.precio_hora_extra || 0,
    coste_hora,
    precio_hora_cliente,
    extras: payload.extras || 0,
  });
  if (error) return { ok: false, error: error.message };

  revalidar();
  return { ok: true };
}

export async function borrarAsignacion(id: string): Promise<ResultadoAccion> {
  const supabase = await createClient();
  const { error } = await supabase.from("asignaciones").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidar();
  return { ok: true };
}
