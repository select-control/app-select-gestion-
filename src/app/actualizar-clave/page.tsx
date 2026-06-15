"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";

export default function ActualizarClavePage() {
  const router = useRouter();
  const [listo, setListo] = useState(false);
  const [comprobando, setComprobando] = useState(true);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [ok, setOk] = useState(false);

  // Al abrir el enlace del correo, establecer la sesion de recuperacion.
  useEffect(() => {
    const supabase = createClient();
    async function prep() {
      let sesion = false;
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) sesion = true;
      }
      if (!sesion) {
        const { data } = await supabase.auth.getSession();
        sesion = !!data.session;
      }
      setListo(sesion);
      if (!sesion) {
        setError(
          "El enlace no es valido o ha caducado. Pide uno nuevo desde la pantalla de inicio de sesion."
        );
      }
      setComprobando(false);
    }
    prep();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== password2) {
      setError("Las dos contrasenas no coinciden.");
      return;
    }
    setCargando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError("No se pudo cambiar la contrasena. Intentalo de nuevo.");
      setCargando(false);
      return;
    }
    await supabase.auth.signOut();
    setOk(true);
    setTimeout(() => {
      router.push("/login");
      router.refresh();
    }, 2500);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-12%] h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-brand/15 blur-[130px]" />
        <div className="absolute bottom-[-15%] right-[4%] h-[380px] w-[380px] rounded-full bg-brand/10 blur-[130px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        <div className="mb-8 flex justify-center">
          <Logo height={80} />
        </div>

        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/70">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-slate-900">Nueva contrasena</h1>
            <p className="text-sm text-slate-500">Escribe tu nueva contrasena de acceso</p>
          </div>

          {comprobando && <p className="text-sm text-slate-500">Comprobando el enlace...</p>}

          {ok && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Contrasena cambiada. Te llevamos a iniciar sesion...
            </p>
          )}

          {!comprobando && !ok && listo && (
            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Nueva contrasena
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimo 6 caracteres"
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>
              <div>
                <label htmlFor="password2" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Repite la contrasena
                </label>
                <input
                  id="password2"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="h-11 w-full rounded-lg bg-gradient-to-b from-brand-light to-brand text-sm font-semibold text-black shadow-brand transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
              >
                {cargando ? "Guardando..." : "Guardar contrasena"}
              </button>
            </form>
          )}

          {!comprobando && !listo && (
            <>
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}
              <button
                onClick={() => router.push("/login")}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Volver a iniciar sesion
              </button>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          SELECT Control · Seguridad privada
        </p>
      </div>
    </div>
  );
}
