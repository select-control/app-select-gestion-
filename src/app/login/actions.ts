"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getUsuarioActual } from "@/lib/auth";

/**
 * Apunta en el registro de actividad que un usuario ha iniciado sesion.
 * Se llama desde la pagina de login tras un acceso correcto.
 * Usa la clave admin para escribir en una tabla que el usuario no puede tocar.
 */
export async function registrarConexion() {
  const usuario = await getUsuarioActual();
  if (!usuario) return;
  const admin = createAdminClient();
  if (!admin) return;
  await admin.from("registro_actividad").insert({
    usuario_id: usuario.perfil?.id ?? null,
    usuario_nombre: usuario.perfil?.nombre ?? usuario.email,
    accion: "login",
    entidad: "sesion",
    descripcion: "Inicio de sesion",
  });
}
