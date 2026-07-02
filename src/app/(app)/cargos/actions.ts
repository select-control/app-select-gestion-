"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ResultadoAccion = { ok: boolean; error?: string };

const UNIDADES_VALIDAS = ["hora", "dia", "tarde", "noche"];

function leerFormulario(formData: FormData) {
  const unidad = String(formData.get("unidad") || "hora").trim();
  return {
    nombre: String(formData.get("nombre") || "").trim(),
    tarifa_hora: Number(formData.get("tarifa_hora") || 0),
    unidad: UNIDADES_VALIDAS.includes(unidad) ? unidad : "hora",
    orden: Number(formData.get("orden") || 0),
  };
}

export async function crearCargo(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const supabase = await createClient();
  const datos = leerFormulario(formData);

  if (!datos.nombre) return { ok: false, error: "El nombre del cargo es obligatorio." };

  const { error } = await supabase.from("cargos").insert(datos);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Ya existe un cargo con ese nombre." };
    return { ok: false, error: error.message };
  }

  revalidatePath("/cargos");
  return { ok: true };
}

export async function actualizarCargo(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const datos = leerFormulario(formData);

  if (!id) return { ok: false, error: "Falta el identificador." };

  const { error } = await supabase.from("cargos").update(datos).eq("id", id);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Ya existe un cargo con ese nombre." };
    return { ok: false, error: error.message };
  }

  revalidatePath("/cargos");
  return { ok: true };
}

export async function borrarCargo(id: string): Promise<ResultadoAccion> {
  const supabase = await createClient();
  const { error } = await supabase.from("cargos").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/cargos");
  return { ok: true };
}
