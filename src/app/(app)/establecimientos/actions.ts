"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ResultadoAccion = { ok: boolean; error?: string };

function leerFormulario(formData: FormData) {
  // Tarifas por cargo: campos "tc_<cargoId>" = precio/hora que se cobra al cliente.
  const tarifas_cliente: Record<string, number> = {};
  formData.forEach((v, k) => {
    if (k.startsWith("tc_")) {
      const n = Number(v) || 0;
      if (n > 0) tarifas_cliente[k.slice(3)] = n;
    }
  });
  return {
    nombre: String(formData.get("nombre") || "").trim(),
    razon_social: String(formData.get("razon_social") || "").trim() || null,
    cif: String(formData.get("cif") || "").trim().toUpperCase() || null,
    direccion: String(formData.get("direccion") || "").trim() || null,
    delegacion: String(formData.get("delegacion") || "").trim() || null,
    email: String(formData.get("email") || "").trim().toLowerCase() || null,
    tarifa_hora_cliente: Number(formData.get("tarifa_hora_cliente") || 0),
    tarifas_cliente,
    activo: formData.get("activo") === "on" || formData.get("activo") === "true",
    observaciones: String(formData.get("observaciones") || "").trim() || null,
  };
}

export async function crearEstablecimiento(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const supabase = await createClient();
  const datos = leerFormulario(formData);

  if (!datos.nombre) {
    return { ok: false, error: "El nombre es obligatorio." };
  }

  const { error } = await supabase.from("establecimientos").insert(datos);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/establecimientos");
  return { ok: true };
}

export async function actualizarEstablecimiento(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const datos = leerFormulario(formData);

  if (!id) return { ok: false, error: "Falta el identificador." };

  const { error } = await supabase
    .from("establecimientos")
    .update(datos)
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/establecimientos");
  return { ok: true };
}

export async function borrarEstablecimiento(id: string): Promise<ResultadoAccion> {
  const supabase = await createClient();
  const { error } = await supabase.from("establecimientos").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return {
        ok: false,
        error:
          "No se puede borrar: este establecimiento tiene servicios registrados. Marcalo como inactivo en su lugar.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/establecimientos");
  return { ok: true };
}
