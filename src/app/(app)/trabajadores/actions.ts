"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ResultadoAccion = { ok: boolean; error?: string };

function leerFormulario(formData: FormData) {
  return {
    nombre: String(formData.get("nombre") || "").trim(),
    iban: String(formData.get("iban") || "").trim().toUpperCase().replace(/\s+/g, "") || null,
    telefono: String(formData.get("telefono") || "").trim() || null,
    cargo_id: String(formData.get("cargo_id") || "").trim() || null,
    activo: formData.get("activo") === "on" || formData.get("activo") === "true",
  };
}

export async function crearTrabajador(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const supabase = createClient();
  const datos = leerFormulario(formData);

  if (!datos.nombre) {
    return { ok: false, error: "El nombre es obligatorio." };
  }

  const { error } = await supabase.from("trabajadores").insert(datos);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/trabajadores");
  return { ok: true };
}

export async function actualizarTrabajador(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  const datos = leerFormulario(formData);

  if (!id) return { ok: false, error: "Falta el identificador." };

  const { error } = await supabase.from("trabajadores").update(datos).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/trabajadores");
  return { ok: true };
}

export async function borrarTrabajador(id: string): Promise<ResultadoAccion> {
  const supabase = createClient();
  const { error } = await supabase.from("trabajadores").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return {
        ok: false,
        error:
          "No se puede borrar: este trabajador tiene asignaciones registradas. Marcalo como inactivo en su lugar.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/trabajadores");
  return { ok: true };
}
