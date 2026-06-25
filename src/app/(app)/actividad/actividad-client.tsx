"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";

export type RegistroFila = {
  id: string;
  creado_en: string;
  usuario: string;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  datos: Record<string, unknown> | null;
};

const ENTIDAD: Record<string, string> = {
  servicios: "Servicio",
  asignaciones: "Asignación",
  contratos: "Contrato",
  trabajadores: "Trabajador",
  establecimientos: "Cliente",
  cargos: "Cargo",
  caja_movimientos: "Caja",
  garantias: "Garantía",
  usuarios_app: "Usuario",
  sesion: "Sesión",
};

const ACCION: Record<string, { txt: string; color: string }> = {
  crear: { txt: "Creó", color: "bg-emerald-100 text-emerald-700" },
  editar: { txt: "Editó", color: "bg-amber-100 text-amber-700" },
  eliminar: { txt: "Eliminó", color: "bg-red-100 text-red-700" },
  login: { txt: "Se conectó", color: "bg-slate-100 text-slate-600" },
};

/** Saca un texto representativo de la fila (nombre, número, fecha…). */
function resumenDatos(d: Record<string, unknown> | null): string {
  if (!d) return "";
  for (const k of ["nombre", "numero", "razon_social", "fecha", "concepto"]) {
    if (d[k]) return String(d[k]);
  }
  return "";
}

function fechaHora(iso: string): string {
  const f = new Date(iso);
  return f.toLocaleString("es-ES", {
    timeZone: "Europe/Madrid",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActividadClient({ registros }: { registros: RegistroFila[] }) {
  const [usuario, setUsuario] = useState("");
  const [accion, setAccion] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [verDatos, setVerDatos] = useState<RegistroFila | null>(null);

  const usuarios = useMemo(
    () => Array.from(new Set(registros.map((r) => r.usuario))).sort(),
    [registros]
  );

  const filtrados = useMemo(() => {
    return registros.filter((r) => {
      if (usuario && r.usuario !== usuario) return false;
      if (accion && r.accion !== accion) return false;
      const dia = r.creado_en.slice(0, 10);
      if (desde && dia < desde) return false;
      if (hasta && dia > hasta) return false;
      return true;
    });
  }, [registros, usuario, accion, desde, hasta]);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Panel de control</h1>
        <span className="text-sm text-slate-400">{filtrados.length} registros</span>
      </div>
      <p className="mb-5 text-sm text-slate-500">
        Quién se conecta y qué crea, edita o elimina cada usuario. Lo borrado queda con copia.
      </p>

      <Card className="mb-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Persona</label>
            <select
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm"
            >
              <option value="">Todas</option>
              {usuarios.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Acción</label>
            <select
              value={accion}
              onChange={(e) => setAccion(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm"
            >
              <option value="">Todas</option>
              <option value="login">Conexiones</option>
              <option value="crear">Creaciones</option>
              <option value="editar">Ediciones</option>
              <option value="eliminar">Eliminaciones</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Desde</label>
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Hasta</label>
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm" />
          </div>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 pr-3 font-medium">Fecha y hora</th>
              <th className="py-2 pr-3 font-medium">Persona</th>
              <th className="py-2 pr-3 font-medium">Acción</th>
              <th className="py-2 pr-3 font-medium">Qué</th>
              <th className="py-2 pr-3 font-medium">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-slate-400">Sin actividad con esos filtros.</td></tr>
            )}
            {filtrados.map((r) => {
              const a = ACCION[r.accion] ?? { txt: r.accion, color: "bg-slate-100 text-slate-600" };
              const resumen = resumenDatos(r.datos);
              return (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 pr-3 whitespace-nowrap text-slate-600">{fechaHora(r.creado_en)}</td>
                  <td className="py-2 pr-3 font-medium text-slate-800">{r.usuario}</td>
                  <td className="py-2 pr-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${a.color}`}>{a.txt}</span>
                  </td>
                  <td className="py-2 pr-3 text-slate-600">
                    {r.accion === "login" ? "—" : (ENTIDAD[r.entidad] ?? r.entidad)}
                    {resumen && <span className="text-slate-400"> · {resumen}</span>}
                  </td>
                  <td className="py-2 pr-3">
                    {r.accion === "eliminar" && r.datos ? (
                      <button onClick={() => setVerDatos(r)} className="text-xs font-medium text-brand-dark underline-offset-2 hover:underline">
                        ver lo eliminado
                      </button>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {verDatos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setVerDatos(null)}>
          <div className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-1 text-lg font-bold text-slate-900">Copia de lo eliminado</h2>
            <p className="mb-3 text-sm text-slate-500">
              {ENTIDAD[verDatos.entidad] ?? verDatos.entidad} eliminado por {verDatos.usuario} el {fechaHora(verDatos.creado_en)}
            </p>
            <pre className="overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
              {JSON.stringify(verDatos.datos, null, 2)}
            </pre>
            <button onClick={() => setVerDatos(null)} className="mt-4 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
