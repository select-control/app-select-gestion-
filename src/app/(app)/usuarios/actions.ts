"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUsuarioActual } from "@/lib/auth";

export type ResultadoAccion = { ok: boolean; error?: string };

/** Solo un admin puede ejecutar estas acciones. */
async function comprobarAdmin(): Promise<string | null> {
  const usuario = await getUsuarioActual();
  if (!usuario || usuario.rol !== "admin") {
    return "No tienes permisos para esta accion.";
  }
  return null;
}

export async function crearUsuario(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const noAdmin = await comprobarAdmin();
  if (noAdmin) return { ok: false, error: noAdmin };

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      error:
        "Falta la clave de servicio (SUPABASE_SERVICE_ROLE_KEY) en la configuracion. Mira la guia para anadirla.",
    };
  }

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const nombre = String(formData.get("nombre") || "").trim();
  const rol = String(formData.get("rol") || "encargado");

  if (!email || !password) {
    return { ok: false, error: "Email y contrasena son obligatorios." };
  }
  if (password.length < 6) {
    return { ok: false, error: "La contrasena debe tener al menos 6 caracteres." };
  }

  // 1) Crear el usuario de acceso (login)
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  // 2) Crear su perfil en usuarios_app con el rol
  const { error: errPerfil } = await admin.from("usuarios_app").insert({
    id: data.user.id,
    nombre: nombre || email,
    rol: rol === "admin" ? "admin" : "encargado",
  });

  if (errPerfil) {
    return { ok: false, error: errPerfil.message };
  }

  revalidatePath("/usuarios");
  return { ok: true };
}

export async function actualizarUsuario(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const noAdmin = await comprobarAdmin();
  if (noAdmin) return { ok: false, error: noAdmin };

  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, error: "Falta la clave de servicio en la configuracion." };
  }

  const id = String(formData.get("id") || "");
  const nombre = String(formData.get("nombre") || "").trim();
  const rol = String(formData.get("rol") || "encargado");

  if (!id) return { ok: false, error: "Falta el identificador." };

  const { error } = await admin
    .from("usuarios_app")
    .update({ nombre, rol: rol === "admin" ? "admin" : "encargado" })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/usuarios");
  return { ok: true };
}

export async function borrarUsuario(id: string): Promise<ResultadoAccion> {
  const noAdmin = await comprobarAdmin();
  if (noAdmin) return { ok: false, error: noAdmin };

  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, error: "Falta la clave de servicio en la configuracion." };
  }

  const propio = await getUsuarioActual();
  if (propio?.perfil?.id === id) {
    return { ok: false, error: "No puedes borrar tu propio usuario." };
  }

  // Borra el login; la fila de usuarios_app se borra en cascada (ver SQL)
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/usuarios");
  return { ok: true };
}
