"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil, Trash2, Plus, Users, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { formatoEuros, formatoHoras, calcularHoras } from "@/lib/utils";
import {
  totalesServicio,
  totalesAsignacion,
  type Rol,
  type ServicioConRelaciones,
  type Establecimiento,
  type TrabajadorConCargo,
  type Cargo,
  type EstadoServicio,
} from "@/lib/types";
import {
  crearServicio,
  actualizarServicio,
  borrarServicio,
  crearAsignacion,
  borrarAsignacion,
  type ResultadoAccion,
} from "./actions";

const estadoInicial: ResultadoAccion = { ok: false };

const COLOR_ESTADO: Record<EstadoServicio, string> = {
  Pendiente: "bg-amber-100 text-amber-700",
  Realizado: "bg-emerald-100 text-emerald-700",
  Cancelado: "bg-slate-100 text-slate-500",
};

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando..." : "Guardar"}
    </Button>
  );
}

function fechaBonita(f: string) {
  try {
    return format(new Date(f + "T00:00:00"), "d MMM yyyy", { locale: es });
  } catch {
    return f;
  }
}

/** Casilla de métrica dentro de la tarjeta de servicio. */
function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="bg-white px-2 py-2">
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-sm font-semibold ${color ?? "text-slate-800"}`}>{value}</p>
    </div>
  );
}

export function ServiciosClient({
  servicios,
  establecimientos,
  trabajadores,
  cargos,
  rol,
}: {
  servicios: ServicioConRelaciones[];
  establecimientos: Establecimiento[];
  trabajadores: TrabajadorConCargo[];
  cargos: Cargo[];
  rol: Rol;
}) {
  // Todos los roles ven/editan lo economico; solo /usuarios y /actividad son admin-only.
  const esAdmin = true;
  const [modalServicio, setModalServicio] = useState(false);
  const [editando, setEditando] = useState<ServicioConRelaciones | null>(null);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [estIdForm, setEstIdForm] = useState("");

  // Filtros (independientes): por cliente y por rango de fechas.
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");

  const serviciosFiltrados = servicios.filter((s) => {
    if (filtroCliente && s.establecimiento_id !== filtroCliente) return false;
    if (filtroDesde && s.fecha < filtroDesde) return false;
    if (filtroHasta && s.fecha > filtroHasta) return false;
    return true;
  });
  const hayFiltro = !!(filtroCliente || filtroDesde || filtroHasta);

  const accion = editando ? actualizarServicio : crearServicio;
  const [estado, formAction] = useFormState(accion, estadoInicial);

  const tarifaEstElegido =
    establecimientos.find((e) => e.id === estIdForm)?.tarifa_hora_cliente ?? 0;

  useEffect(() => {
    if (!estado.ok) return;
    setModalServicio(false);
    // Al CREAR un servicio (no al editar), abrimos directo su panel de trabajadores,
    // para asignar operarios del tiron sin tener que volver a pinchar.
    if (!editando && estado.id) {
      setDetalleId(estado.id);
    }
  }, [estado]); // eslint-disable-line react-hooks/exhaustive-deps

  function abrirNuevo() {
    setEditando(null);
    setEstIdForm("");
    setModalServicio(true);
  }
  function abrirEditar(s: ServicioConRelaciones) {
    setEditando(s);
    setEstIdForm(s.establecimiento_id);
    setModalServicio(true);
  }

  async function onBorrar(s: ServicioConRelaciones) {
    if (!confirm(`¿Borrar el servicio de ${s.establecimientos?.nombre || ""} del ${fechaBonita(s.fecha)}? Se borraran tambien sus asignaciones.`)) return;
    const res = await borrarServicio(s.id);
    if (!res.ok) alert(res.error);
  }

  const detalle = servicios.find((s) => s.id === detalleId) || null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Servicios</h1>
          <p className="text-sm text-slate-500">
            {hayFiltro
              ? `${serviciosFiltrados.length} de ${servicios.length}`
              : `${servicios.length} en total`}
          </p>
        </div>
        <Button onClick={abrirNuevo}>
          <Plus className="h-4 w-4" /> Nuevo servicio
        </Button>
      </div>

      {/* Filtros: por cliente y por fecha, independientes */}
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <div className="min-w-[200px] flex-1">
          <Label htmlFor="f_cliente">Cliente</Label>
          <Select id="f_cliente" value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)}>
            <option value="">Todos los clientes</option>
            {establecimientos.map((e) => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="f_desde">Desde</Label>
          <Input id="f_desde" type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="f_hasta">Hasta</Label>
          <Input id="f_hasta" type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} />
        </div>
        {hayFiltro && (
          <Button
            variant="secondary"
            onClick={() => { setFiltroCliente(""); setFiltroDesde(""); setFiltroHasta(""); }}
          >
            Limpiar
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-xs xl:text-sm">
          <thead className="bg-slate-100 text-left text-slate-500">
            <tr className="whitespace-nowrap">
              <th className="px-2.5 py-2.5 font-medium">Fecha</th>
              <th className="px-2.5 py-2.5 font-medium">Cliente</th>
              <th className="px-2.5 py-2.5 font-medium">Horario</th>
              <th className="px-2.5 py-2.5 font-medium">Operarios</th>
              <th className="px-2.5 py-2.5 font-medium">Estado</th>
              {esAdmin && <th className="px-2.5 py-2.5 font-medium">Precio especial</th>}
              <th className="px-2.5 py-2.5 font-medium">Horas fact.</th>
              {esAdmin && <th className="px-2.5 py-2.5 font-medium">Facturación</th>}
              {esAdmin && <th className="px-2.5 py-2.5 font-medium">Coste total</th>}
              {esAdmin && <th className="px-2.5 py-2.5 font-medium">Beneficio bruto</th>}
              {esAdmin && <th className="px-2.5 py-2.5 font-medium">Margen</th>}
              <th className="px-2.5 py-2.5 font-medium">Cobro</th>
              <th className="px-2.5 py-2.5 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {serviciosFiltrados.length === 0 && (
              <tr>
                <td colSpan={esAdmin ? 13 : 8} className="px-4 py-10 text-center text-slate-400">
                  {hayFiltro
                    ? "Ningún servicio coincide con los filtros."
                    : "No hay servicios todavia. Crea el primero con “Nuevo servicio”."}
                </td>
              </tr>
            )}
            {serviciosFiltrados.map((s) => {
              const asignados = s.asignaciones?.length ?? 0;
              const faltan = s.puestos_necesarios - asignados;
              const t = totalesServicio(s.asignaciones ?? []);
              return (
                <tr
                  key={s.id}
                  className="cursor-pointer text-slate-800 hover:bg-slate-50"
                  onClick={() => setDetalleId(s.id)}
                >
                  <td className="whitespace-nowrap px-2.5 py-2.5">{fechaBonita(s.fecha)}</td>
                  <td className="px-2.5 py-2.5 font-medium">{s.establecimientos?.nombre || "—"}</td>
                  <td className="whitespace-nowrap px-2.5 py-2.5 text-slate-500">
                    {s.hora_inicio?.slice(0, 5)}–{s.hora_fin?.slice(0, 5)}
                  </td>
                  <td className="px-2.5 py-2.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        faltan > 0 ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {faltan > 0 && <AlertTriangle className="h-3 w-3" />}
                      {asignados}/{s.puestos_necesarios}
                    </span>
                  </td>
                  <td className="px-2.5 py-2.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${COLOR_ESTADO[s.estado]}`}>
                      {s.estado}
                    </span>
                  </td>
                  {esAdmin && <td className="px-2.5 py-2.5 text-slate-600">{s.precio_especial && s.precio_especial > 0 ? formatoEuros(s.precio_especial) : "por cargo"}</td>}
                  <td className="px-2.5 py-2.5 text-slate-600">{formatoHoras(t.horas)}</td>
                  {esAdmin && <td className="px-2.5 py-2.5">{formatoEuros(t.facturacion)}</td>}
                  {esAdmin && <td className="px-2.5 py-2.5 text-slate-600">{formatoEuros(t.coste)}</td>}
                  {esAdmin && (
                    <td className={`px-2.5 py-2.5 font-medium ${t.beneficio >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {formatoEuros(t.beneficio)}
                    </td>
                  )}
                  {esAdmin && <td className="px-2.5 py-2.5 text-slate-600">{(t.margen * 100).toFixed(0)}%</td>}
                  <td className="px-2.5 py-2.5">
                    {s.cobrado ? (
                      <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        Cobrado{s.forma_cobro ? ` · ${s.forma_cobro === "efectivo" ? "Efectivo" : "Transfer."}` : ""}
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-2.5 py-2.5" onClick={(ev) => ev.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setDetalleId(s.id)} title="Asignar trabajadores">
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => abrirEditar(s)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onBorrar(s)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ---- Modal: crear / editar servicio ---- */}
      <Modal
        open={modalServicio}
        onClose={() => setModalServicio(false)}
        title={editando ? "Editar servicio" : "Nuevo servicio"}
        wide
      >
        <form action={formAction} className="space-y-4">
          {editando && <input type="hidden" name="id" value={editando.id} />}

          <div>
            <Label htmlFor="establecimiento_id">Cliente</Label>
            <Select
              id="establecimiento_id"
              name="establecimiento_id"
              required
              defaultValue={editando?.establecimiento_id ?? ""}
              onChange={(ev) => setEstIdForm(ev.target.value)}
            >
              <option value="">— Selecciona —</option>
              {establecimientos.map((e) => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="fecha">Fecha</Label>
              <Input id="fecha" name="fecha" type="date" required defaultValue={editando?.fecha} />
            </div>
            <div>
              <Label htmlFor="hora_inicio">Inicio</Label>
              <Input id="hora_inicio" name="hora_inicio" type="time" required defaultValue={editando?.hora_inicio?.slice(0, 5)} />
            </div>
            <div>
              <Label htmlFor="hora_fin">Fin</Label>
              <Input id="hora_fin" name="hora_fin" type="time" required defaultValue={editando?.hora_fin?.slice(0, 5)} />
            </div>
          </div>

          <div>
            <Label>Operarios necesarios (por cargo)</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {cargos.map((c) => (
                <div key={c.id}>
                  <span className="mb-1 block text-xs font-medium text-slate-500">{c.nombre}</span>
                  <Input
                    name={`pc_${c.id}`}
                    type="number"
                    min="0"
                    defaultValue={editando?.puestos_por_cargo?.[c.id] ?? 0}
                  />
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Indica cuántos operarios hacen falta de cada cargo. Si creas un cargo
              nuevo en la sección Cargos, aparece aquí automáticamente.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {esAdmin ? (
              <div>
                <Label htmlFor="precio_especial">
                  Precio especial €/h{" "}
                  <span className="font-normal text-slate-400">
                    (vacio = estandar{tarifaEstElegido ? ` ${formatoEuros(tarifaEstElegido)}` : ""})
                  </span>
                </Label>
                <Input
                  id="precio_especial"
                  name="precio_especial"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={tarifaEstElegido ? String(tarifaEstElegido) : "estandar"}
                  defaultValue={editando?.precio_especial ?? ""}
                />
              </div>
            ) : (
              <input type="hidden" name="precio_especial" value={editando?.precio_especial ?? ""} />
            )}
            <div>
              <Label htmlFor="estado">Estado servicio</Label>
              <Select id="estado" name="estado" defaultValue={editando?.estado ?? "Pendiente"}>
                <option value="Pendiente">Pendiente</option>
                <option value="Realizado">Realizado</option>
                <option value="Cancelado">Cancelado</option>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea id="observaciones" name="observaciones" defaultValue={editando?.observaciones ?? ""} />
          </div>

          {estado.error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{estado.error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalServicio(false)}>Cancelar</Button>
            <BotonGuardar />
          </div>
        </form>
      </Modal>

      {detalle && (
        <DetalleAsignaciones
          servicio={detalle}
          trabajadores={trabajadores}
          cargos={cargos}
          esAdmin={esAdmin}
          onClose={() => setDetalleId(null)}
        />
      )}
    </div>
  );
}

// ============================================================================
function DetalleAsignaciones({
  servicio,
  trabajadores,
  cargos,
  esAdmin,
  onClose,
}: {
  servicio: ServicioConRelaciones;
  trabajadores: TrabajadorConCargo[];
  cargos: Cargo[];
  esAdmin: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const asignados = servicio.asignaciones?.length ?? 0;
  const [trabajadorId, setTrabajadorId] = useState("");
  const [cargoId, setCargoId] = useState("");
  const [hueco, setHueco] = useState(String(asignados + 1));
  const [horaInicio, setHoraInicio] = useState(servicio.hora_inicio?.slice(0, 5) || "");
  const [horaFin, setHoraFin] = useState(servicio.hora_fin?.slice(0, 5) || "");
  const [horasExtra, setHorasExtra] = useState("0");
  const [precioHoraExtra, setPrecioHoraExtra] = useState("0");

  function onElegirTrabajador(id: string) {
    setTrabajadorId(id);
    const t = trabajadores.find((x) => x.id === id);
    if (t?.cargo_id) setCargoId(t.cargo_id);
  }

  const cargoSel = cargos.find((c) => c.id === cargoId);
  const horasPrevia = horaInicio && horaFin ? calcularHoras(horaInicio, horaFin) : 0;
  const costePrevio =
    horasPrevia * (cargoSel?.tarifa_hora ?? 0) +
    (Number(horasExtra) || 0) * (Number(precioHoraExtra) || 0);
  function anadir() {
    setError(null);
    startTransition(async () => {
      const res = await crearAsignacion({
        servicio_id: servicio.id,
        trabajador_id: trabajadorId || null,
        cargo_id: cargoId || null,
        hueco: Number(hueco) || 1,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        horas_extra: Number(horasExtra) || 0,
        precio_hora_extra: Number(precioHoraExtra) || 0,
        extras: 0,
      });
      if (!res.ok) setError(res.error || "No se pudo anadir.");
      else {
        setTrabajadorId(""); setCargoId("");
        setHorasExtra("0"); setPrecioHoraExtra("0");
        setHueco(String(asignados + 2));
        router.refresh();
      }
    });
  }

  function quitar(id: string) {
    startTransition(async () => {
      const res = await borrarAsignacion(id);
      if (!res.ok) alert(res.error);
      else router.refresh();
    });
  }

  const totales = totalesServicio(servicio.asignaciones ?? []);
  const faltan = servicio.puestos_necesarios - asignados;

  return (
    <Modal
      open
      onClose={onClose}
      wide
      title={`Asignaciones · ${servicio.establecimientos?.nombre || ""} · ${fechaBonita(servicio.fecha)}`}
    >
      <div className="space-y-5">
        {faltan > 0 && (
          <p className="flex items-center gap-2 rounded-md bg-orange-50 px-3 py-2 text-sm text-orange-700">
            <AlertTriangle className="h-4 w-4" />
            Faltan {faltan} puesto(s) por cubrir de {servicio.puestos_necesarios}.
          </p>
        )}

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Hueco</th>
                <th className="px-3 py-2 font-medium">Trabajador</th>
                <th className="px-3 py-2 font-medium">Cargo</th>
                <th className="px-3 py-2 font-medium">Horario</th>
                <th className="px-3 py-2 font-medium">Horas</th>
                {esAdmin && <th className="px-3 py-2 font-medium">Coste</th>}
                {esAdmin && <th className="px-3 py-2 font-medium">Facturación</th>}
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {asignados === 0 && (
                <tr>
                  <td colSpan={esAdmin ? 8 : 6} className="px-3 py-6 text-center text-slate-400">
                    Sin asignaciones. Anade trabajadores abajo.
                  </td>
                </tr>
              )}
              {servicio.asignaciones
                ?.slice()
                .sort((a, b) => a.hueco - b.hueco)
                .map((a) => {
                  const ta = totalesAsignacion(a);
                  return (
                    <tr key={a.id} className="text-slate-800">
                      <td className="px-3 py-2">{a.hueco}</td>
                      <td className="px-3 py-2">{a.trabajadores?.nombre || "Sin asignar"}</td>
                      <td className="px-3 py-2 text-slate-500">{a.cargos?.nombre || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-500">
                        {a.hora_inicio?.slice(0, 5)}–{a.hora_fin?.slice(0, 5)}
                      </td>
                      <td className="px-3 py-2">
                        {formatoHoras((a.horas || 0) + (a.horas_extra || 0))}
                        {a.horas_extra > 0 && (
                          <span className="ml-1 text-[11px] text-amber-600">
                            (+{a.horas_extra}h extra {esAdmin ? `a ${formatoEuros(a.precio_hora_extra)}/h` : ""})
                          </span>
                        )}
                      </td>
                      {esAdmin && <td className="px-3 py-2">{formatoEuros(ta.coste)}</td>}
                      {esAdmin && <td className="px-3 py-2">{formatoEuros(ta.facturacion)}</td>}
                      <td className="px-3 py-2 text-right">
                        <Button variant="ghost" size="sm" onClick={() => quitar(a.id)} disabled={pending}>
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
            {esAdmin && asignados > 0 && (
              <tfoot className="bg-slate-50 font-medium text-slate-700">
                <tr>
                  <td className="px-3 py-2" colSpan={4}>Totales · margen {(totales.margen * 100).toFixed(0)}%</td>
                  <td className="px-3 py-2">{formatoHoras(totales.horas)}</td>
                  <td className="px-3 py-2">{formatoEuros(totales.coste)}</td>
                  <td className="px-3 py-2">{formatoEuros(totales.facturacion)}</td>
                  <td className="px-3 py-2"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 text-sm font-medium text-slate-700">Anadir trabajador a un puesto</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
            <div>
              <Label htmlFor="a_hueco">Hueco</Label>
              <Input id="a_hueco" type="number" min="1" value={hueco} onChange={(e) => setHueco(e.target.value)} />
            </div>
            <div className="col-span-2 sm:col-span-2">
              <Label htmlFor="a_trab">Trabajador</Label>
              <Select id="a_trab" value={trabajadorId} onChange={(e) => onElegirTrabajador(e.target.value)}>
                <option value="">— Selecciona —</option>
                {trabajadores.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="a_cargo">Cargo</Label>
              <Select id="a_cargo" value={cargoId} onChange={(e) => setCargoId(e.target.value)}>
                <option value="">— Cargo —</option>
                {cargos.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="button" onClick={anadir} disabled={pending} className="w-full">
                <Plus className="h-4 w-4" /> Anadir
              </Button>
            </div>
            <div>
              <Label htmlFor="a_ini">Inicio</Label>
              <Input id="a_ini" type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="a_fin">Fin</Label>
              <Input id="a_fin" type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="a_hextra">Horas extra</Label>
              <Input id="a_hextra" type="number" step="0.5" min="0" value={horasExtra} onChange={(e) => setHorasExtra(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="a_pextra">€/h extra</Label>
              <Input id="a_pextra" type="number" step="0.01" min="0" value={precioHoraExtra} onChange={(e) => setPrecioHoraExtra(e.target.value)} />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            {formatoHoras(horasPrevia + (Number(horasExtra) || 0))} en total
            {Number(horasExtra) > 0 ? ` (${formatoHoras(Number(horasExtra))} extra)` : ""}
            {esAdmin && cargoSel ? ` · coste estimado ${formatoEuros(costePrevio)}` : ""}
          </p>
          {error && <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </Modal>
  );
}
