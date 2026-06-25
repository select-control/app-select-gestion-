import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresca la sesion de Supabase en cada peticion y protege las rutas.
 * Si el usuario no ha iniciado sesion y no esta en /login, se le redirige.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ruta = request.nextUrl.pathname;
  const esLogin = ruta.startsWith("/login");
  const esActualizar = ruta.startsWith("/actualizar-clave");
  const esVerificar = ruta.startsWith("/verificar-2fa");
  // Rutas publicas (accesibles sin sesion iniciada): login y fijar nueva contrasena.
  const esPublica = esLogin || esActualizar;

  const redirigir = (pathname: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    return NextResponse.redirect(url);
  };

  // Sin sesion y no esta en una ruta publica -> al login
  if (!user && !esPublica) {
    return redirigir("/login");
  }

  if (user) {
    // ¿Tiene el usuario un 2FA activado que aun no ha verificado en esta sesion?
    // currentLevel aal1 + nextLevel aal2 = hay factor pero falta meter el codigo.
    let falta2FA = false;
    try {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      falta2FA = aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2";
    } catch {
      // Si no se puede comprobar, no bloqueamos (evita dejar fuera al usuario).
      falta2FA = false;
    }

    if (falta2FA) {
      // Obligar a verificar antes de entrar a ninguna pantalla de la app.
      if (!esVerificar && !esActualizar) {
        return redirigir("/verificar-2fa");
      }
    } else {
      // Sesion completa (aal2 o sin 2FA): no tiene sentido quedarse en login/verificar.
      if (esLogin || esVerificar) {
        return redirigir("/dashboard");
      }
    }
  }

  return supabaseResponse;
}
