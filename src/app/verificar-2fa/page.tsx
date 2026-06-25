"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";

/**
 * Pantalla de verificacion en dos pasos (2FA).
 * Aparece despues de la contrasena cuando el usuario tiene un
 * autenticador activado. Pide el codigo de 6 digitos y eleva la
 * sesion a AAL2. El middleware redirige aqui automaticamente.
 */
export default function Verificar2FAPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [preparando, setPreparando] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.mfa.listFactors().then(({ data, error }) => {
      if (error || !data?.totp?.length) {
        // Sin factor activo: no hay nada que verificar -> al panel.
        router.replace("/dashboard");
        return;
      }
      setFactorId(data.totp[0].id);
      setPreparando(false);
    });
  }, [router]);

  async function onVerificar(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    setCargando(true);

    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: codigo.trim(),
    });

    if (error) {
      setError("Codigo incorrecto o caducado. Mira tu app de autenticacion e intentalo de nuevo.");
      setCodigo("");
      setCargando(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function salir() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
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

        <form
          onSubmit={onVerificar}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/70"
        >
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-slate-900">Verificacion en dos pasos</h1>
            <p className="text-sm text-slate-500">
              Abre tu app de autenticacion (Google Authenticator, Authy...) y escribe el codigo de 6 digitos.
            </p>
          </div>

          <div>
            <label htmlFor="codigo" className="mb-1.5 block text-sm font-medium text-slate-700">
              Codigo de verificacion
            </label>
            <input
              id="codigo"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              required
              autoFocus
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              disabled={preparando}
              className="h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-center text-2xl tracking-[0.4em] text-slate-900 placeholder:text-slate-300 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={cargando || preparando || codigo.length !== 6}
            className="h-11 w-full rounded-lg bg-gradient-to-b from-brand-light to-brand text-sm font-semibold text-black shadow-brand transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
          >
            {cargando ? "Verificando..." : "Verificar y entrar"}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={salir}
              className="text-sm text-slate-500 underline-offset-2 hover:text-brand hover:underline"
            >
              Cancelar y cerrar sesion
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
