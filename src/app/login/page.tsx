"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";

type Modo = "login" | "recuperar";

export default function LoginPage() {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email o contrasena incorrectos.");
      setCargando(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function onRecuperar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAviso(null);
    if (!email) {
      setError("Escribe tu email primero.");
      return;
    }
    setCargando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/actualizar-clave`,
    });
    setCargando(false);
    if (error) {
      setError("No se pudo enviar el correo. Intentalo de nuevo en unos minutos.");
      return;
    }
    setAviso(
      "Te hemos enviado un correo con un enlace para cambiar la contrasena. Revisa tu bandeja (y la carpeta de spam) y abre el enlace en este mismo navegador."
    );
  }

  function cambiarModo(m: Modo) {
    setModo(m);
    setError(null);
    setAviso(null);
    setPassword("");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4">
      {/* Resplandores verdes de marca sobre blanco */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-12%] h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-brand/15 blur-[130px]" />
        <div className="absolute bottom-[-15%] right-[4%] h-[380px] w-[380px] rounded-full bg-brand/10 blur-[130px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        <div className="mb-8 flex justify-center">
          <Logo height={80} />
        </div>

        <form
          onSubmit={modo === "login" ? onLogin : onRecuperar}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/70"
        >
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-slate-900">
              {modo === "login" ? "Iniciar sesion" : "Recuperar contrasena"}
            </h1>
            <p className="text-sm text-slate-500">
              {modo === "login"
                ? "Acceso para personal autorizado"
                : "Te enviaremos un enlace a tu email"}
            </p>
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@selectcontrol.es"
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>

          {modo === "login" && (
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Contrasena
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          {aviso && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {aviso}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="h-11 w-full rounded-lg bg-gradient-to-b from-brand-light to-brand text-sm font-semibold text-black shadow-brand transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
          >
            {cargando
              ? modo === "login"
                ? "Entrando..."
                : "Enviando..."
              : modo === "login"
              ? "Entrar"
              : "Enviar enlace"}
          </button>

          <div className="text-center">
            {modo === "login" ? (
              <button
                type="button"
                onClick={() => cambiarModo("recuperar")}
                className="text-sm text-slate-500 underline-offset-2 hover:text-brand hover:underline"
              >
                ¿Olvidaste la contrasena?
              </button>
            ) : (
              <button
                type="button"
                onClick={() => cambiarModo("login")}
                className="text-sm text-slate-500 underline-offset-2 hover:text-brand hover:underline"
              >
                Volver a iniciar sesion
              </button>
            )}
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          SELECT Control · Seguridad privada
        </p>
      </div>
    </div>
  );
}
