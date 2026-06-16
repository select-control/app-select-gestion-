"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DocumentoContrato } from "@/lib/types";

export type ResultadoAccion = { ok: boolean; error?: string; id?: string };

const BUCKET = "contratos";

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
  const { data, error } = await supabase.from("contratos").insert(datos).select("id").single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/contratos");
  revalidatePath("/establecimientos");
  return { ok: true, id: data?.id as string | undefined };
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

// ---- Documentos adjuntos (almacenamiento privado) ----
export async function subirDocumentoContrato(
  formData: FormData
): Promise<ResultadoAccion> {
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "Almacenamiento no configurado." };
  const contratoId = String(formData.get("id") || "");
  const archivo = formData.get("archivo") as File | null;
  if (!contratoId) return { ok: false, error: "Guarda el contrato antes de adjuntar." };
  if (!archivo || archivo.size === 0) return { ok: false, error: "Selecciona un archivo." };
  if (archivo.size > 15 * 1024 * 1024) return { ok: false, error: "El archivo supera los 15 MB." };

  const safe = archivo.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${contratoId}/${Date.now()}-${safe}`;
  const buf = new Uint8Array(await archivo.arrayBuffer());
  const up = await admin.storage
    .from(BUCKET)
    .upload(path, buf, { contentType: archivo.type || "application/octet-stream", upsert: false });
  if (up.error) return { ok: false, error: up.error.message };

  const { data: c } = await admin.from("contratos").select("documentos").eq("id", contratoId).single();
  const docs: DocumentoContrato[] = Array.isArray(c?.documentos) ? c!.documentos : [];
  docs.push({ path, nombre: archivo.name, tipo: archivo.type || null });
  const { error } = await admin.from("contratos").update({ documentos: docs }).eq("id", contratoId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/contratos");
  revalidatePath("/establecimientos");
  return { ok: true };
}

export async function borrarDocumentoContrato(
  contratoId: string,
  path: string
): Promise<ResultadoAccion> {
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "Almacenamiento no configurado." };
  await admin.storage.from(BUCKET).remove([path]);
  const { data: c } = await admin.from("contratos").select("documentos").eq("id", contratoId).single();
  const docs: DocumentoContrato[] = (Array.isArray(c?.documentos) ? c!.documentos : []).filter(
    (d: DocumentoContrato) => d.path !== path
  );
  const { error } = await admin.from("contratos").update({ documentos: docs }).eq("id", contratoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/contratos");
  revalidatePath("/establecimientos");
  return { ok: true };
}

/** Devuelve una URL firmada (1 hora) para ver/descargar un documento privado. */
export async function urlDocumentoContrato(
  path: string
): Promise<{ url?: string; error?: string }> {
  const admin = createAdminClient();
  if (!admin) return { error: "Almacenamiento no configurado." };
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error) return { error: error.message };
  return { url: data.signedUrl };
}
