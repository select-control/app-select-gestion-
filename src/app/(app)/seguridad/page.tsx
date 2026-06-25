"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, Loader2, Smartphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Estado = "cargando" | "activo" | "inactivo" | "enrolando";

/**
 * Pagina de Seguridad: activar / desactivar la verificacion en dos pasos (2FA).
 * Cada usuario gestiona SU propio autenticador (Google Authenticator, Authy...).
 */
export default function SeguridadPage() {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [error, setError] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secreto, setSecreto] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [trabajando, setTrabajando] = useState(false);

  const cargarEstado = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      setError("No se pudo comprobar el estado de seguridad.");
      setEstado("inactivo");
      return;
    }
    const verificado = data?.totp?.find((f) => f.status === "verified");
    setEstado(verificado ? "activo" : "inactivo");
  }, []);

  useEffect(() => {
    cargarEstado();
  }, [cargarEstado]);

  // Limpia factores a medio enrolar (sin verificar) para poder empezar limpio.
  async function limpiarNoVerificados() {
    const supabase = createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    const pendientes = (data?.all ?? []).filter((f) => f.status !== "verified");
    for (const f of pendientes) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
  }

  async function empezarActivacion() {
    setError(null);
    setTrabajando(true);
    const supabase = createClient();
    await limpiarNoVerificados();
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Autenticador",
    });
    setTrabajando(false);
    if (error || !data) {
      setError("No se pudo iniciar la activacion. Intentalo de nuevo.");
      return;
    }
    setFactorId(data.id);
    setQr(data.totp.qr_code);
    setSecreto(data.totp.secret);
    setEstado("enrolando");
  }

  async function confirmarActivacion(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    setTrabajando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: codigo.trim(),
    });
    setTrabajando(false);
    if (error) {
      setError("Codigo incorrecto o caducado. Mira la app e intentalo de nuevo.");
      setCodigo("");
      return;
    }
    setQr(null);
    setSecreto(null);
    setFactorId(null);
    setCodigo("");
    await cargarEstado();
  }

  async function desactivar() {
    setError(null);
    setTrabajando(true);
    const supabase = createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    for (const f of data?.all ?? []) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    setTrabajando(false);
    await cargarEstado();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Seguridad</h1>
        <p className="text-sm text-slate-500">
          Verificacion en dos pasos (2FA) para proteger tu acceso.
        </p>
      </div>

      {estado === "cargando" && (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-6 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Comprobando estado...
        </div>
      )}

      {estado === "activo" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
            <div className="flex-1">
              <p className="font-semibold text-emerald-800">Verificacion en dos pasos ACTIVADA</p>
              <p className="mt-1 text-sm text-emerald-700">
                Al iniciar sesion se te pedira el codigo de tu app de autenticacion. Tu cuenta esta protegida.
              </p>
              <button
                onClick={desactivar}
                disabled={trabajando}
                className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                {trabajando ? "Desactivando..." : "Desactivar 2FA"}
              </button>
            </div>
          </div>
        </div>
      )}

      {estado === "inactivo" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />
            <div className="flex-1">
              <p className="font-semibold text-amber-800">Verificacion en dos pasos DESACTIVADA</p>
              <p className="mt-1 text-sm text-amber-700">
                Recomendado: anade una segunda capa de seguridad con una app gratuita
                (Google Authenticator, Microsoft Authenticator o Authy).
              </p>
              <button
                onClick={empezarActivacion}
                disabled={trabajando}
                className="mt-4 rounded-lg bg-gradient-to-b from-brand-light to-brand px-4 py-2 text-sm font-semibold text-black shadow-brand transition-all hover:brightness-105 disabled:opacity-50"
              >
                {trabajando ? "Preparando..." : "Activar 2FA"}
              </button>
            </div>
          </div>
        </div>
      )}

      {estado === "enrolando" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <ol className="space-y-5">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-bold text-brand-dark">1</span>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Smartphone className="h-4 w-4 text-slate-400" />
                Instala en tu movil <b>Google Authenticator</b> (o Authy / Microsoft Authenticator).
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-bold text-brand-dark">2</span>
              <div className="text-sm text-slate-700">
                <p>Abre la app, pulsa <b>+</b> y escanea este codigo QR:</p>
                {qr && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qr}
                    alt="Codigo QR para la app de autenticacion"
                    className="mt-3 h-44 w-44 rounded-lg border border-slate-200 bg-white p-2"
                  />
                )}
                {secreto && (
                  <p className="mt-2 text-xs text-slate-500">
                    Si no puedes escanear, introduce esta clave a mano:
                    <br />
                    <code className="mt-1 inline-block rounded bg-slate-100 px-2 py-1 font-mono text-[11px] tracking-wider text-slate-700">
                      {secreto}
                    </code>
                  </p>
                )}
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-bold text-brand-dark">3</span>
              <form onSubmit={confirmarActivacion} className="flex-1">
                <label className="text-sm text-slate-700">
                  Escribe el codigo de 6 digitos que muestra la app:
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoFocus
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="h-11 w-36 rounded-lg border border-slate-300 bg-white px-3 text-center text-lg tracking-[0.3em] text-slate-900 placeholder:text-slate-300 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                  <button
                    type="submit"
                    disabled={trabajando || codigo.length !== 6}
                    className="h-11 rounded-lg bg-gradient-to-b from-brand-light to-brand px-5 text-sm font-semibold text-black shadow-brand transition-all hover:brightness-105 disabled:opacity-50"
                  >
                    {trabajando ? "Activando..." : "Confirmar"}
                  </button>
                </div>
              </form>
            </li>
          </ol>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
