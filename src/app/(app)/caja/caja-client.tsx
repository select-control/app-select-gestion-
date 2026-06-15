"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Pencil,
  Trash2,
  Plus,
  Wallet,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Banknote,
  CreditCard,
  Check,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Card } from "@/components/ui/card";
import { formatoEuros } from "@/lib/utils";
import {
  totalesServicio,
  type Rol,
  type MovimientoCaja,
  type Garantia,
  type ServicioConRelaciones,
} from "@/lib/types";
import {
  crearMovimiento,
  actualizarMovimiento,
  borrarMovimiento,
  crearGarantia,
  actualizarGarantia,
  borrarGarantia,
  marcarCobrado,
  desmarcarCobrado,
  type ResultadoAccion,
} from "./actions";

const estadoInicial: ResultadoAccion = { ok: false };

function fechaBonita(f: string | null) {
  if (!f) return "—";
  try {
    return format(new Date(f + "T00:00:00"), "d MMM yyyy", { locale: es });
  } catch {
    return f;
  }
}

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando..." : "Guardar"}
    </Button>
  );
}

type Cobro = {
  servicio: ServicioConRelaciones;
  cliente: string;
  importe: number;
};

type FiltroCobro = "pendientes" | "cobrados" | "todos";

export function CajaClient({
  movimientos,
  garantias,
  servicios,
  rol,
}: {
  movimientos: MovimientoCaja[];
  garantias: Garantia[];
  servicios: ServicioConRelaciones[];
  rol: Rol;
}) {
  const [modalMov, setModalMov] = useState(false);
  const [editMov, setEditMov] = useState<MovimientoCaja | null>(null);
  const [modalGar, setModalGar] = useState(false);
  const [editGar, setEditGar] = useState<Garantia | null>(null);
  const [cobroSel, setCobroSel] = useState<Cobro | null>(null);
  const [filtro, setFiltro] = useState<FiltroCobro>("pendientes");

  const accionMov = editMov ? actualizarMovimiento : crearMovimiento;
  const [estadoMov, formMov] = useFormState(accionMov, estadoInicial);
  const accionGar = editGar ? actualizarGarantia : crearGarantia;
  const [estadoGar, formGar] = useFormState(accionGar, estadoInicial);
  const [estadoCobro, formCobro] = useFormState(marcarCobrado, estadoInicial);

  useEffect(() => { if (estadoMov.ok) setModalMov(false); }, [estadoMov]);
  useEffect(() => { if (estadoGar.ok) setModalGar(false); }, [estadoGar]);
  useEffect(() => { if (estadoCobro.ok) setCobroSel(null); }, [estadoCobro]);

  // Cada servicio (con importe a facturar > 0) es un cobro a un cliente.
  const cobros: Cobro[] = useMemo(
    () =>
      servicios
        .map((s) => ({
          servicio: s,
          cliente: s.establecimientos?.nombre || "—",
          importe: totalesServicio(s, s.asignaciones ?? []).facturacion,
        }))
        .filter((c) => c.importe > 0),
    [servicios]
  );

  // Totales diferenciados por forma de cobro.
  const cobradoEfectivo = cobros
    .filter((c) => c.servicio.cobrado && c.servicio.forma_cobro === "efectivo")
    .reduce((a, c) => a + c.importe, 0);
  const cobradoTransfer = cobros
    .filter((c) => c.servicio.cobrado && c.servicio.forma_cobro === "transferencia")
    .reduce((a, c) => a + c.importe, 0);
  const totalCobrado = cobradoEfectivo + cobradoTransfer;
  const pendiente = cobros
    .filter((c) => !c.servicio.cobrado)
    .reduce((a, c) => a + c.importe, 0);

  const totalGarantias = garantias.reduce((a, g) => a + (g.importe || 0), 0);

  // Movimientos manuales con saldo acumulado (para la tabla).
  let acum = 0;
  const filasMov = movimientos.map((m) => {
    acum += (m.ingreso || 0) - (m.gasto || 0);
    return { ...m, saldo: acum };
  });

  const hoy = format(new Date(), "yyyy-MM-dd");

  const cobrosFiltrados = cobros.filter((c) =>
    filtro === "todos" ? true : filtro === "cobrados" ? c.servicio.cobrado : !c.servicio.cobrado
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Caja</h1>
        <p className="text-sm text-slate-500">
          Lo cobrado y lo pendiente de cobro, diferenciando efectivo y transferencia.
        </p>
      </div>

      {/* Tarjetas resumen */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md">
            <Wallet className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Total cobrado</p>
            <p className="text-2xl font-bold text-slate-900">{formatoEuros(totalCobrado)}</p>
            <p className="text-[11px] text-slate-400">efectivo + transferencia</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-md">
            <Banknote className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Cobrado en efectivo</p>
            <p className="text-2xl font-bold text-slate-900">{formatoEuros(cobradoEfectivo)}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-600 text-white shadow-md">
            <CreditCard className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Cobrado por transferencia</p>
            <p className="text-2xl font-bold text-slate-900">{formatoEuros(cobradoTransfer)}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
            <Clock className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Pendiente de cobro</p>
            <p className="text-2xl font-bold text-amber-600">{formatoEuros(pendiente)}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-md">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Total garantías</p>
            <p className="text-2xl font-bold text-slate-900">{formatoEuros(totalGarantias)}</p>
          </div>
        </Card>
      </div>

      {/* Cobros */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Cobros</h2>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-sm">
            {([
              ["pendientes", "Pendientes"],
              ["cobrados", "Cobrados"],
              ["todos", "Todos"],
            ] as [FiltroCobro, string][]).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFiltro(val)}
                className={`rounded-md px-3 py-1 font-medium ${
                  filtro === val ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left text-slate-500">
              <tr>
                <th className="px-3 py-3 font-medium">Fecha servicio</th>
                <th className="px-3 py-3 font-medium">Cliente</th>
                <th className="px-3 py-3 text-right font-medium">Importe</th>
                <th className="px-3 py-3 font-medium">Estado</th>
                <th className="px-3 py-3 font-medium">Forma</th>
                <th className="px-3 py-3 font-medium">Fecha cobro</th>
                <th className="px-3 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {cobrosFiltrados.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No hay cobros en esta vista.</td></tr>
              )}
              {cobrosFiltrados.map((c) => {
                const s = c.servicio;
                return (
                  <tr key={s.id} className="text-slate-800 hover:bg-slate-50">
                    <td className="whitespace-nowrap px-3 py-3 text-slate-500">{fechaBonita(s.fecha)}</td>
                    <td className="px-3 py-3 font-medium">{c.cliente}</td>
                    <td className="px-3 py-3 text-right font-medium">{formatoEuros(c.importe)}</td>
                    <td className="px-3 py-3">
                      {s.cobrado ? (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Cobrado</span>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Pendiente</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {s.cobrado && s.forma_cobro ? (
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          {s.forma_cobro === "efectivo" ? <Banknote className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                          {s.forma_cobro === "efectivo" ? "Efectivo" : "Transferencia"}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-500">{fechaBonita(s.fecha_cobro)}</td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        {s.cobrado ? (
                          <>
                            <Button variant="ghost" size="sm" title="Editar cobro" onClick={() => setCobroSel(c)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Marcar como pendiente"
                              onClick={async () => {
                                if (confirm("¿Marcar este cobro como pendiente otra vez?")) {
                                  const r = await desmarcarCobrado(s.id);
                                  if (!r.ok) alert(r.error);
                                }
                              }}
                            >
                              <RotateCcw className="h-4 w-4 text-slate-500" />
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" onClick={() => setCobroSel(c)}>
                            <Check className="h-4 w-4" /> Cobrar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movimientos manuales */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Otros movimientos</h2>
            <p className="text-xs text-slate-500">Ingresos y gastos sueltos que no vienen de un servicio.</p>
          </div>
          <Button onClick={() => { setEditMov(null); setModalMov(true); }}>
            <Plus className="h-4 w-4" /> Nuevo movimiento
          </Button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left text-slate-500">
              <tr>
                <th className="px-3 py-3 font-medium">Fecha</th>
                <th className="px-3 py-3 font-medium">Concepto</th>
                <th className="px-3 py-3 text-right font-medium">Ingreso</th>
                <th className="px-3 py-3 text-right font-medium">Gasto</th>
                <th className="px-3 py-3 text-right font-medium">Saldo</th>
                <th className="px-3 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filasMov.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No hay movimientos todavia.</td></tr>
              )}
              {filasMov.map((m) => (
                <tr key={m.id} className="text-slate-800 hover:bg-slate-50">
                  <td className="whitespace-nowrap px-3 py-3 text-slate-500">{fechaBonita(m.fecha)}</td>
                  <td className="px-3 py-3">{m.concepto || "—"}</td>
                  <td className="px-3 py-3 text-right text-emerald-600">{m.ingreso ? formatoEuros(m.ingreso) : "—"}</td>
                  <td className="px-3 py-3 text-right text-red-600">{m.gasto ? formatoEuros(m.gasto) : "—"}</td>
                  <td className={`px-3 py-3 text-right font-medium ${m.saldo >= 0 ? "text-slate-900" : "text-red-600"}`}>{formatoEuros(m.saldo)}</td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setEditMov(m); setModalMov(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={async () => { if (confirm("¿Borrar movimiento?")) { const r = await borrarMovimiento(m.id); if (!r.ok) alert(r.error); } }}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Garantías */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Garantías</h2>
          <Button onClick={() => { setEditGar(null); setModalGar(true); }}>
            <Plus className="h-4 w-4" /> Nueva garantía
          </Button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left text-slate-500">
              <tr>
                <th className="px-3 py-3 font-medium">Nombre</th>
                <th className="px-3 py-3 text-right font-medium">Importe</th>
                <th className="px-3 py-3 font-medium">Fecha</th>
                <th className="px-3 py-3 font-medium">Vencimiento</th>
                <th className="px-3 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {garantias.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No hay garantías todavia.</td></tr>
              )}
              {garantias.map((g) => {
                const vencida = g.vencimiento && g.vencimiento < hoy;
                return (
                  <tr key={g.id} className="text-slate-800 hover:bg-slate-50">
                    <td className="px-3 py-3 font-medium">{g.nombre || "—"}</td>
                    <td className="px-3 py-3 text-right">{formatoEuros(g.importe)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-500">{fechaBonita(g.fecha_garantia)}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className={vencida ? "inline-flex items-center gap-1 font-medium text-red-600" : "text-slate-500"}>
                        {vencida && <AlertTriangle className="h-3 w-3" />}
                        {fechaBonita(g.vencimiento)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditGar(g); setModalGar(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={async () => { if (confirm("¿Borrar garantía?")) { const r = await borrarGarantia(g.id); if (!r.ok) alert(r.error); } }}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal cobro */}
      <Modal open={!!cobroSel} onClose={() => setCobroSel(null)} title="Registrar cobro">
        {cobroSel && (
          <form action={formCobro} className="space-y-4">
            <input type="hidden" name="id" value={cobroSel.servicio.id} />
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <p className="font-medium text-slate-900">{cobroSel.cliente}</p>
              <p className="text-slate-500">
                Servicio del {fechaBonita(cobroSel.servicio.fecha)} · {formatoEuros(cobroSel.importe)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="forma_cobro">Forma de cobro</Label>
                <Select id="forma_cobro" name="forma_cobro" defaultValue={cobroSel.servicio.forma_cobro ?? "transferencia"}>
                  <option value="transferencia">Transferencia</option>
                  <option value="efectivo">Efectivo</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="fecha_cobro">Fecha de cobro</Label>
                <Input id="fecha_cobro" name="fecha_cobro" type="date" defaultValue={cobroSel.servicio.fecha_cobro ?? hoy} />
              </div>
            </div>
            {estadoCobro.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{estadoCobro.error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setCobroSel(null)}>Cancelar</Button>
              <BotonGuardar />
            </div>
          </form>
        )}
      </Modal>

      {/* Modal movimiento */}
      <Modal open={modalMov} onClose={() => setModalMov(false)} title={editMov ? "Editar movimiento" : "Nuevo movimiento"}>
        <form action={formMov} className="space-y-4">
          {editMov && <input type="hidden" name="id" value={editMov.id} />}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fecha">Fecha</Label>
              <Input id="fecha" name="fecha" type="date" required defaultValue={editMov?.fecha} />
            </div>
            <div>
              <Label htmlFor="concepto">Concepto</Label>
              <Input id="concepto" name="concepto" defaultValue={editMov?.concepto ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ingreso">Ingreso (€)</Label>
              <Input id="ingreso" name="ingreso" type="number" step="0.01" min="0" defaultValue={editMov?.ingreso ?? 0} />
            </div>
            <div>
              <Label htmlFor="gasto">Gasto (€)</Label>
              <Input id="gasto" name="gasto" type="number" step="0.01" min="0" defaultValue={editMov?.gasto ?? 0} />
            </div>
          </div>
          {estadoMov.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{estadoMov.error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalMov(false)}>Cancelar</Button>
            <BotonGuardar />
          </div>
        </form>
      </Modal>

      {/* Modal garantía */}
      <Modal open={modalGar} onClose={() => setModalGar(false)} title={editGar ? "Editar garantía" : "Nueva garantía"}>
        <form action={formGar} className="space-y-4">
          {editGar && <input type="hidden" name="id" value={editGar.id} />}
          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" name="nombre" defaultValue={editGar?.nombre ?? ""} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="importe">Importe (€)</Label>
              <Input id="importe" name="importe" type="number" step="0.01" min="0" defaultValue={editGar?.importe ?? 0} />
            </div>
            <div>
              <Label htmlFor="fecha_garantia">Fecha</Label>
              <Input id="fecha_garantia" name="fecha_garantia" type="date" defaultValue={editGar?.fecha_garantia ?? ""} />
            </div>
            <div>
              <Label htmlFor="vencimiento">Vencimiento</Label>
              <Input id="vencimiento" name="vencimiento" type="date" defaultValue={editGar?.vencimiento ?? ""} />
            </div>
          </div>
          {estadoGar.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{estadoGar.error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalGar(false)}>Cancelar</Button>
            <BotonGuardar />
          </div>
        </form>
      </Modal>
    </div>
  );
}
