"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Download, Users, Building2, Banknote, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { formatoEuros, formatoHoras } from "@/lib/utils";
import {
  totalesAsignacion,
  type Rol,
  type ServicioConRelaciones,
} from "@/lib/types";

function fechaBonita(f: string) {
  try {
    return format(new Date(f + "T00:00:00"), "d MMM", { locale: es });
  } catch {
    return f;
  }
}

interface DesgloseEst {
  id: string;
  nombre: string;
  horas: number;
  importe: number;
}

export function InformesClient({
  servicios,
  rol,
  desdeInicial,
  hastaInicial,
}: {
  servicios: ServicioConRelaciones[];
  rol: Rol;
  desdeInicial: string;
  hastaInicial: string;
}) {
  const [desde, setDesde] = useState(desdeInicial);
  const [hasta, setHasta] = useState(hastaInicial);
  const [tab, setTab] = useState<"pagar" | "cobrar">("pagar");

  const filt = useMemo(
    () =>
      servicios.filter((s) => {
        if (desde && s.fecha < desde) return false;
        if (hasta && s.fecha > hasta) return false;
        return true;
      }),
    [servicios, desde, hasta]
  );

  // ── PAGAR A TRABAJADORES: por trabajador → horas y € por establecimiento ──
  const pagar = useMemo(() => {
    const m = new Map<
      string,
      {
        nombre: string;
        iban: string | null;
        horas: number;
        pago: number;
        est: Map<string, DesgloseEst>;
      }
    >();
    for (const s of filt) {
      const estId = s.establecimiento_id;
      const estNombre = s.establecimientos?.nombre || "—";
      for (const a of s.asignaciones ?? []) {
        const tid = a.trabajador_id || "sin";
        const nombre = a.trabajadores?.nombre || "Sin asignar";
        const iban = (a.trabajadores as { iban?: string | null } | null)?.iban ?? null;
        const horas = (a.horas || 0) + (a.horas_extra || 0);
        const pago = totalesAsignacion(a).coste;
        let w = m.get(tid);
        if (!w) {
          w = { nombre, iban, horas: 0, pago: 0, est: new Map() };
          m.set(tid, w);
        }
        w.horas += horas;
        w.pago += pago;
        let e = w.est.get(estId);
        if (!e) {
          e = { id: estId, nombre: estNombre, horas: 0, importe: 0 };
          w.est.set(estId, e);
        }
        e.horas += horas;
        e.importe += pago;
      }
    }
    return Array.from(m.values())
      .map((w) => ({ ...w, est: Array.from(w.est.values()).sort((a, b) => b.horas - a.horas) }))
      .sort((a, b) => b.pago - a.pago);
  }, [filt]);
  const totalPagar = pagar.reduce((a, w) => a + w.pago, 0);
  const totalHorasPagar = pagar.reduce((a, w) => a + w.horas, 0);

  // ── COBRAR A CLIENTES: por establecimiento → horas y € según nº personas ──
  const cobrar = useMemo(() => {
    const m = new Map<
      string,
      {
        nombre: string;
        horas: number;
        cobro: number;
        servicios: { fecha: string; personas: number; horas: number; cobro: number }[];
      }
    >();
    for (const s of filt) {
      const estId = s.establecimiento_id;
      const estNombre = s.establecimientos?.nombre || "—";
      let svcHoras = 0;
      let svcCobro = 0;
      const personas = s.asignaciones?.length ?? 0;
      for (const a of s.asignaciones ?? []) {
        svcHoras += (a.horas || 0) + (a.horas_extra || 0);
        svcCobro += totalesAsignacion(a).facturacion;
      }
      let e = m.get(estId);
      if (!e) {
        e = { nombre: estNombre, horas: 0, cobro: 0, servicios: [] };
        m.set(estId, e);
      }
      e.horas += svcHoras;
      e.cobro += svcCobro;
      e.servicios.push({ fecha: s.fecha, personas, horas: svcHoras, cobro: svcCobro });
    }
    return Array.from(m.values())
      .map((e) => ({ ...e, servicios: e.servicios.sort((a, b) => a.fecha.localeCompare(b.fecha)) }))
      .sort((a, b) => b.cobro - a.cobro);
  }, [filt]);
  const totalCobrar = cobrar.reduce((a, e) => a + e.cobro, 0);
  const totalHorasCobrar = cobrar.reduce((a, e) => a + e.horas, 0);

  function exportar() {
    const wb = XLSX.utils.book_new();
    if (tab === "pagar") {
      const rows = pagar.flatMap((w) =>
        w.est.map((e) => ({
          Trabajador: w.nombre,
          IBAN: w.iban || "",
          Cliente: e.nombre,
          Horas: e.horas,
          "A pagar (€)": Number(e.importe.toFixed(2)),
        }))
      );
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Pagar trabajadores");
    } else {
      const rows = cobrar.flatMap((e) =>
        e.servicios.map((sv) => ({
          Cliente: e.nombre,
          Fecha: sv.fecha,
          Personas: sv.personas,
          Horas: sv.horas,
          "A cobrar (€)": Number(sv.cobro.toFixed(2)),
        }))
      );
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Cobrar clientes");
    }
    XLSX.writeFile(wb, `${tab}_${desde}_a_${hasta}.xlsx`);
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pagos y cobros</h1>
          <p className="text-sm text-slate-500">Horas y dinero por trabajador y por cliente</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="desde">Desde</Label>
            <Input id="desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="hasta">Hasta</Label>
            <Input id="hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
          <Button variant="secondary" onClick={exportar}>
            <Download className="h-4 w-4" /> Excel
          </Button>
        </div>
      </div>

      {/* Selector de vista */}
      <div className="mb-5 inline-flex rounded-xl border border-slate-200 bg-white p-1">
        <button
          onClick={() => setTab("pagar")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            tab === "pagar" ? "bg-brand text-black" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <HandCoins className="h-4 w-4" /> Pagar a trabajadores
        </button>
        <button
          onClick={() => setTab("cobrar")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            tab === "cobrar" ? "bg-brand text-black" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Banknote className="h-4 w-4" /> Cobrar a clientes
        </button>
      </div>

      {/* ===================== PAGAR A TRABAJADORES ===================== */}
      {tab === "pagar" && (
        <div>
          <Card className="mb-4 flex flex-wrap items-center justify-between gap-4 border-brand/30 bg-brand/5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-light to-brand-dark text-white shadow-md">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total a pagar a trabajadores</p>
                <p className="text-3xl font-bold text-slate-900">{formatoEuros(totalPagar)}</p>
              </div>
            </div>
            <div className="text-right text-sm text-slate-500">
              <p>{pagar.length} trabajadores</p>
              <p>{formatoHoras(totalHorasPagar)} en total</p>
            </div>
          </Card>

          {pagar.length === 0 && (
            <Card className="text-center text-slate-400">Sin horas en este periodo.</Card>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {pagar.map((w) => (
              <Card key={w.nombre} className="overflow-hidden p-0">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{w.nombre}</p>
                    {w.iban && <p className="truncate font-mono text-[11px] text-slate-400">{w.iban}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xl font-bold text-brand-dark">{formatoEuros(w.pago)}</p>
                    <p className="text-xs text-slate-500">{formatoHoras(w.horas)}</p>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {w.est.map((e) => (
                      <tr key={e.id}>
                        <td className="px-4 py-2 text-slate-700">{e.nombre}</td>
                        <td className="px-4 py-2 text-right text-slate-500">{formatoHoras(e.horas)}</td>
                        <td className="px-4 py-2 text-right font-medium text-slate-800">{formatoEuros(e.importe)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ===================== COBRAR A CLIENTES ===================== */}
      {tab === "cobrar" && (
        <div>
          <Card className="mb-4 flex flex-wrap items-center justify-between gap-4 border-emerald-200 bg-emerald-50/50">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total a cobrar a clientes</p>
                <p className="text-3xl font-bold text-slate-900">{formatoEuros(totalCobrar)}</p>
              </div>
            </div>
            <div className="text-right text-sm text-slate-500">
              <p>{cobrar.length} clientes</p>
              <p>{formatoHoras(totalHorasCobrar)} en total</p>
            </div>
          </Card>

          {cobrar.length === 0 && (
            <Card className="text-center text-slate-400">Sin horas en este periodo.</Card>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {cobrar.map((e) => (
              <Card key={e.nombre} className="overflow-hidden p-0">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{e.nombre}</p>
                    <p className="text-xs text-slate-500">{e.servicios.length} servicios · {formatoHoras(e.horas)}</p>
                  </div>
                  <p className="shrink-0 text-xl font-bold text-emerald-600">{formatoEuros(e.cobro)}</p>
                </div>
                <table className="w-full text-sm">
                  <thead className="text-left text-[11px] uppercase text-slate-400">
                    <tr>
                      <th className="px-4 py-1.5 font-medium">Fecha</th>
                      <th className="px-4 py-1.5 font-medium">Personas</th>
                      <th className="px-4 py-1.5 text-right font-medium">Horas</th>
                      <th className="px-4 py-1.5 text-right font-medium">A cobrar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {e.servicios.map((sv, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 text-slate-700">{fechaBonita(sv.fecha)}</td>
                        <td className="px-4 py-2 text-slate-600">{sv.personas}</td>
                        <td className="px-4 py-2 text-right text-slate-500">{formatoHoras(sv.horas)}</td>
                        <td className="px-4 py-2 text-right font-medium text-slate-800">{formatoEuros(sv.cobro)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            ))}
          </div>
        </div>
      )}

      
    </div>
  );
}
