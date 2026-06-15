import { createClient } from "@/lib/supabase/server";
import type { Rol, UsuarioApp } from "@/lib/types";

/**
 * Devuelve el usuario de auth y su fila en usuarios_app (con el rol).
 * Si no existe fila en usuarios_app, se asume rol "encargado" por seguridad.
 */
export async function getUsuarioActual(): Promise<{
  email: string | null;
  perfil: UsuarioApp | null;
  rol: Rol;
} | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: perfil } = await supabase
    .from("usuarios_app")
    .select("id, nombre, rol")
    .eq("id", user.id)
    .single();

  const rol: Rol = perfil?.rol === "admin" ? "admin" : "encargado";

  return {
    email: user.email ?? null,
    perfil: perfil ?? null,
    rol,
  };
}
