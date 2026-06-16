"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ResultadoAccion = { ok: boolean; error?: string };

function leerFormulario(formData: FormData) {
  return {
    numero: String(formData.get("numero") || "").trim() || null,
    establecimiento_id: String(formData.get("establecimiento_id") || "") || null,
    fecha_inicio: String(formData.get("fecha_inicio") || "").trim() || null,
    fecha_fin: String(formData.get("fecha_fin") || "").trim() || null,
    firmado: formData.get("firmado") === "on" || formData.get("firmado") === "true",
    notas: String(formData.get("notas") || "").trim() || null,
  };
}

export async function crearContrato(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const supabase = createClient();
  const datos = leerFormulario(formData);
  const { error } = await supabase.from("contratos").insert(datos);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/contratos");
  return { ok: true };
}

export async function actualizarContrato(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  if (!id) return { ok: false, error: "Falta el identificador." };
  const { error } = await supabase.from("contratos").update(leerFormulario(formData)).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/contratos");
  return { ok: true };
}

export async function borrarContrato(id: string): Promise<ResultadoAccion> {
  const supabase = createClient();
  const { error } = await supabase.from("contratos").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/contratos");
  return { ok: true };
}
