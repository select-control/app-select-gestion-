"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Pencil, Trash2, Plus, Search, FileText, FileDown, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/card";
import { formatoEuros } from "@/lib/utils";
import type { Rol, Establecimiento, Cargo, ContratoConRelaciones } from "@/lib/types";
import {
  crearEstablecimiento,
  actualizarEstablecimiento,
  borrarEstablecimiento,
  type ResultadoAccion,
} from "./actions";
import { urlDocumentoContrato } from "../contratos/actions";

const estadoInicial: ResultadoAccion = { ok: false };

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando..." : "Guardar"}
    </Button>
  );
}

export function EstablecimientosClient({
  establecimientos,
  cargos,
  contratos,
  rol,
}: {
  establecimientos: Establecimiento[];
  cargos: Cargo[];
  contratos: ContratoConRelaciones[];
  rol: Rol;
}) {
  // Todos los roles ven/editan lo economico; solo /usuarios y /actividad son admin-only.
  const esAdmin = true;
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Establecimiento | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos"); // todos | activos | inactivos
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());

  const accion = editando ? actualizarEstablecimiento : crearEstablecimiento;
  const [estado, formAction] = useFormState(accion, estadoInicial);

  useEffect(() => {
    if (estado.ok) setModalAbierto(false);
  }, [estado]);

  async function onBorrar(e: Establecimiento) {
    if (!confirm(`¿Borrar el establecimiento "${e.nombre}"?`)) return;
    const res = await borrarEstablecimiento(e.id);
    if (!res.ok) alert(res.error);
  }

  async function verDoc(path: string) {
    const res = await urlDocumentoContrato(path);
    if (res.url) window.open(res.url, "_blank", "noreferrer");
    else alert(res.error || "No se pudo abrir el documento.");
  }

  const filtrados = establecimientos.filter((e) => {
    const t = busqueda.toLowerCase().trim();
    if (
      t &&
      !(
        e.nombre.toLowerCase().includes(t) ||
        (e.razon_social || "").toLowerCase().includes(t) ||
        (e.delegacion || "").toLowerCase().includes(t)
      )
    )
      return false;

    // Filtro por estado
    if (filtroEstado === "activos" && !e.activo) return false;
    if (filtroEstado === "inactivos" && e.activo) return false;

    // Filtro por tarifa/hora del cliente
    const precio = e.tarifa_hora_cliente ?? 0;
    const min = parseFloat(precioMin);
    const max = parseFloat(precioMax);
    if (!isNaN(min) && precio < min) return false;
    if (!isNaN(max) && precio > max) return false;

    return true;
  });

  // --- Seleccion multiple ---
  const todosSeleccionados =
    filtrados.length > 0 && filtrados.every((e) => seleccionados.has(e.id));

  function toggleUno(id: string) {
    setSeleccionados((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }

  function toggleTodos() {
    setSeleccionados((prev) => {
      if (filtrados.length > 0 && filtrados.every((e) => prev.has(e.id))) {
        const s = new Set(prev);
        filtrados.forEach((e) => s.delete(e.id));
        return s;
      }
      const s = new Set(prev);
      filtrados.forEach((e) => s.add(e.id));
      return s;
    });
  }

  function generarPdfConjunto() {
    const ids = filtrados.filter((e) => seleccionados.has(e.id)).map((e) => e.id);
    if (ids.length === 0) return;
    window.open(`/comprobante/clientes-lote?ids=${ids.join(",")}`, "_blank", "noreferrer");
  }

  const numSeleccionados = filtrados.filter((e) => seleccionados.has(e.id)).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500">{establecimientos.length} en total</p>
        </div>
        <Button
          onClick={() => {
            setEditando(null);
            setModalAbierto(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nuevo cliente
        </Button>
      </div>

      {/* Buscador + filtros */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Buscar por nombre, razon social o delegacion..."
            value={busqueda}
            onChange={(ev) => setBusqueda(ev.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="filtroEstado" className="text-xs">Estado</Label>
          <Select
            id="filtroEstado"
            className="w-40"
            value={filtroEstado}
            onChange={(ev) => setFiltroEstado(ev.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </Select>
        </div>
        {esAdmin && (
          <div>
            <Label className="text-xs">Tarifa/hora (€)</Label>
            <div className="flex items-center gap-1">
              <Input
                className="w-24"
                type="number"
                step="0.01"
                min="0"
                placeholder="Desde"
                value={precioMin}
                onChange={(ev) => setPrecioMin(ev.target.value)}
              />
              <span className="text-slate-400">–</span>
              <Input
                className="w-24"
                type="number"
                step="0.01"
                min="0"
                placeholder="Hasta"
                value={precioMax}
                onChange={(ev) => setPrecioMax(ev.target.value)}
              />
            </div>
          </div>
        )}
        <Button
          variant="secondary"
          onClick={generarPdfConjunto}
          disabled={numSeleccionados === 0}
          title={numSeleccionados === 0 ? "Selecciona al menos un cliente" : "Generar un PDF con los seleccionados"}
        >
          <FileDown className="h-4 w-4" />
          Generar PDF {numSeleccionados > 0 ? `(${numSeleccionados})` : ""}
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  aria-label="Seleccionar todos"
                  className="h-4 w-4 cursor-pointer accent-brand"
                  checked={todosSeleccionados}
                  onChange={toggleTodos}
                />
              </th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Delegacion</th>
              <th className="px-4 py-3 font-medium">CIF</th>
              {esAdmin && <th className="px-4 py-3 font-medium">Tarifa general/hora</th>}
              <th className="px-4 py-3 font-medium">Contrato</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={esAdmin ? 8 : 7} className="px-4 py-10 text-center text-slate-400">
                  No hay establecimientos que mostrar.
                </td>
              </tr>
            )}
            {filtrados.map((e) => (
              <tr key={e.id} className="text-slate-800 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label={`Seleccionar ${e.nombre}`}
                    className="h-4 w-4 cursor-pointer accent-brand"
                    checked={seleccionados.has(e.id)}
                    onChange={() => toggleUno(e.id)}
                  />
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{e.nombre}</p>
                  {e.razon_social && (
                    <p className="text-xs text-slate-400">{e.razon_social}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500">{e.delegacion || "—"}</td>
                <td className="px-4 py-3 text-slate-500">{e.cif || "—"}</td>
                {esAdmin && (
                  <td className="px-4 py-3">{formatoEuros(e.tarifa_hora_cliente)}</td>
                )}
                <td className="px-4 py-3">
                  {(() => {
                    const ctrs = contratos.filter((c) => c.establecimiento_id === e.id);
                    if (ctrs.length === 0) return <span className="text-slate-300">—</span>;
                    return (
                      <div className="flex flex-col gap-1">
                        {ctrs.map((c) => (
                          <div key={c.id} className="flex items-center gap-1.5">
                            <span className="text-slate-700">{c.numero || "Contrato"}</span>
                            {(c.documentos?.length ?? 0) > 0 && (
                              <button
                                type="button"
                                onClick={() => verDoc(c.documentos[0].path)}
                                title={c.documentos[0].nombre}
                                className="inline-flex items-center gap-0.5 text-xs text-brand hover:underline"
                              >
                                <Paperclip className="h-3 w-3" /> ver
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </td>
                <td className="px-4 py-3">
                  <Badge activo={e.activo}>{e.activo ? "Activo" : "Inactivo"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <a
                      href={`/comprobante/cliente/${e.id}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Comprobante / PDF"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                      <FileText className="h-4 w-4" />
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditando(e);
                        setModalAbierto(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onBorrar(e)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={editando ? "Editar cliente" : "Nuevo cliente"}
        wide
      >
        <form action={formAction} className="space-y-4">
          {editando && <input type="hidden" name="id" value={editando.id} />}

          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" name="nombre" required defaultValue={editando?.nombre} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="razon_social">Razon social</Label>
              <Input
                id="razon_social"
                name="razon_social"
                defaultValue={editando?.razon_social ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="cif">CIF</Label>
              <Input id="cif" name="cif" defaultValue={editando?.cif ?? ""} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="direccion">Direccion fiscal</Label>
              <Input
                id="direccion"
                name="direccion"
                defaultValue={editando?.direccion ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="cliente@email.com"
                defaultValue={editando?.email ?? ""}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email_adicional">Email adicional</Label>
            <Input
              id="email_adicional"
              name="email_adicional"
              type="email"
              placeholder="otro@email.com (opcional)"
              defaultValue={editando?.email_adicional ?? ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="delegacion">Delegacion</Label>
              <Input
                id="delegacion"
                name="delegacion"
                placeholder="Ej. Andalucia"
                defaultValue={editando?.delegacion ?? ""}
              />
            </div>
            {esAdmin ? (
              <div>
                <Label htmlFor="tarifa_hora_cliente">Tarifa general/hora (€)</Label>
                <Input
                  id="tarifa_hora_cliente"
                  name="tarifa_hora_cliente"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editando?.tarifa_hora_cliente ?? 0}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Se usa si un cargo no tiene precio propio abajo.
                </p>
              </div>
            ) : (
              <input
                type="hidden"
                name="tarifa_hora_cliente"
                value={editando?.tarifa_hora_cliente ?? 0}
              />
            )}
          </div>

          {esAdmin && cargos.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="mb-1 text-sm font-medium text-slate-700">Tarifas por cargo (€/hora)</p>
              <p className="mb-3 text-xs text-slate-400">
                Lo que se cobra a este cliente por cada tipo de operario. Deja en blanco para usar
                la tarifa general.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {cargos.map((c) => (
                  <div key={c.id}>
                    <Label htmlFor={`tc_${c.id}`}>{c.nombre}</Label>
                    <Input
                      id={`tc_${c.id}`}
                      name={`tc_${c.id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={String(editando?.tarifa_hora_cliente ?? 0)}
                      defaultValue={editando?.tarifas_cliente?.[c.id] ?? ""}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="activo">Estado</Label>
            <Select
              id="activo"
              name="activo"
              defaultValue={editando ? String(editando.activo) : "true"}
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              name="observaciones"
              placeholder="Notas internas sobre el cliente..."
              defaultValue={editando?.observaciones ?? ""}
            />
          </div>

          {estado.error && (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">
              {estado.error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalAbierto(false)}
            >
              Cancelar
            </Button>
            <BotonGuardar />
          </div>
        </form>
      </Modal>
    </div>
  );
}
