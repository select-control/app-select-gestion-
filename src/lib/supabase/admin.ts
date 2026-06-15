import { createClient as createAdminBase } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con privilegios de administrador.
 * USA LA SERVICE ROLE KEY: solo debe usarse en el servidor, NUNCA en el navegador.
 * Sirve para crear/borrar usuarios de acceso (logins).
 *
 * Devuelve null si no se ha configurado la clave de servicio.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;

  return createAdminBase(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
