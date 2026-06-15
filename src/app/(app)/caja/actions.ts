"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ResultadoAccion = { ok: boolean; error?: string };

// ---- Movimientos de caja ----
function leerMovimiento(formData: FormData) {
  return {
    fecha: String(formData.get("fecha") || ""),
    concepto: String(formData.get("concepto") || "").trim() || null,
    ingreso: Number(formData.get("ingreso") || 0),
    gasto: Number(formData.get("gasto") || 0),
  };
}

export async function crearMovimiento(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const supabase = createClient();
  const datos = leerMovimiento(formData);
  if (!datos.fecha) return { ok: false, error: "Indica la fecha." };
  const { error } = await supabase.from("caja_movimientos").insert(datos);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/caja");
  return { ok: true };
}

export async function actualizarMovimiento(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  if (!id) return { ok: false, error: "Falta el identificador." };
  const { error } = await supabase.from("caja_movimientos").update(leerMovimiento(formData)).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/caja");
  return { ok: true };
}

export async function borrarMovimiento(id: string): Promise<ResultadoAccion> {
  const supabase = createClient();
  const { error } = await supabase.from("caja_movimientos").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/caja");
  return { ok: true };
}

// ---- Garantías ----
function leerGarantia(formData: FormData) {
  return {
    nombre: String(formData.get("nombre") || "").trim() || null,
    importe: Number(formData.get("importe") || 0),
    fecha_garantia: String(formData.get("fecha_garantia") || "").trim() || null,
    vencimiento: String(formData.get("vencimiento") || "").trim() || null,
  };
}

export async function crearGarantia(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const supabase = createClient();
  const { error } = await supabase.from("garantias").insert(leerGarantia(formData));
  if (error) return { ok: false, error: error.message };
  revalidatePath("/caja");
  return { ok: true };
}

export async function actualizarGarantia(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  if (!id) return { ok: false, error: "Falta el identificador." };
  const { error } = await supabase.from("garantias").update(leerGarantia(formData)).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/caja");
  return { ok: true };
}

export async function borrarGarantia(id: string): Promise<ResultadoAccion> {
  const supabase = createClient();
  const { error } = await supabase.from("garantias").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/caja");
  return { ok: true };
}

// ---- Cobros (sobre servicios) ----
export async function marcarCobrado(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  const forma = String(formData.get("forma_cobro") || "");
  const fecha = String(formData.get("fecha_cobro") || "").trim() || null;
  if (!id) return { ok: false, error: "Falta el servicio." };
  if (forma !== "efectivo" && forma !== "transferencia")
    return { ok: false, error: "Indica si fue en efectivo o por transferencia." };
  const { error } = await supabase
    .from("servicios")
    .update({ cobrado: true, forma_cobro: forma, fecha_cobro: fecha })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/caja");
  revalidatePath("/servicios");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function desmarcarCobrado(id: string): Promise<ResultadoAccion> {
  const supabase = createClient();
  const { error } = await supabase
    .from("servicios")
    .update({ cobrado: false, forma_cobro: null, fecha_cobro: null })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/caja");
  revalidatePath("/servicios");
  revalidatePath("/dashboard");
  return { ok: true };
}
