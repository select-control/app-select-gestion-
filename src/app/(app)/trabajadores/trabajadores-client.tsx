"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Pencil, Trash2, Plus, Search, FileText, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/card";
import { formatoEuros } from "@/lib/utils";
import { unidadCorta, type Rol, type TrabajadorConCargo, type Cargo } from "@/lib/types";
import {
  crearTrabajador,
  actualizarTrabajador,
  borrarTrabajador,
  type ResultadoAccion,
} from "./actions";

const estadoInicial: ResultadoAccion = { ok: false };

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando..." : "Guardar"}
    </Button>
  );
}

export function TrabajadoresClient({
  trabajadores,
  cargos,
  rol,
}: {
  trabajadores: TrabajadorConCargo[];
  cargos: Cargo[];
  rol: Rol;
}) {
  // Todos los roles ven/editan lo economico; solo /usuarios y /actividad son admin-only.
  const esAdmin = true;
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<TrabajadorConCargo | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos"); // todos | activos | inactivos
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());

  const accion = editando ? actualizarTrabajador : crearTrabajador;
  const [estado, formAction] = useFormState(accion, estadoInicial);

  useEffect(() => {
    if (estado.ok) setModalAbierto(false);
  }, [estado]);

  async function onBorrar(t: TrabajadorConCargo) {
    if (!confirm(`¿Borrar al trabajador "${t.nombre}"?`)) return;
    const res = await borrarTrabajador(t.id);
    if (!res.ok) alert(res.error);
  }

  const filtrados = trabajadores.filter((t) => {
    const q = busqueda.toLowerCase().trim();
    if (
      q &&
      !(
        t.nombre.toLowerCase().includes(q) ||
        (t.cargos?.nombre || "").toLowerCase().includes(q)
      )
    )
      return false;

    // Filtro por estado
    if (filtroEstado === "activos" && !t.activo) return false;
    if (filtroEstado === "inactivos" && t.activo) return false;

    // Filtro por precio/hora (viene del cargo)
    const precio = t.cargos?.tarifa_hora ?? 0;
    const min = parseFloat(precioMin);
    const max = parseFloat(precioMax);
    if (!isNaN(min) && precio < min) return false;
    if (!isNaN(max) && precio > max) return false;

    return true;
  });

  // --- Seleccion multiple ---
  const todosSeleccionados =
    filtrados.length > 0 && filtrados.every((t) => seleccionados.has(t.id));

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
      if (filtrados.length > 0 && filtrados.every((t) => prev.has(t.id))) {
        // Deseleccionar los visibles
        const s = new Set(prev);
        filtrados.forEach((t) => s.delete(t.id));
        return s;
      }
      // Seleccionar todos los visibles
      const s = new Set(prev);
      filtrados.forEach((t) => s.add(t.id));
      return s;
    });
  }

  function generarPdfConjunto() {
    const ids = filtrados.filter((t) => seleccionados.has(t.id)).map((t) => t.id);
    if (ids.length === 0) return;
    window.open(`/comprobante/trabajadores-lote?ids=${ids.join(",")}`, "_blank", "noreferrer");
  }

  const numSeleccionados = filtrados.filter((t) => seleccionados.has(t.id)).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trabajadores</h1>
          <p className="text-sm text-slate-500">{trabajadores.length} en total</p>
        </div>
        <Button
          onClick={() => {
            setEditando(null);
            setModalAbierto(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nuevo trabajador
        </Button>
      </div>

      {/* Buscador + filtros */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Buscar por nombre o cargo..."
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
            <Label className="text-xs">Precio/hora (€)</Label>
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
          title={numSeleccionados === 0 ? "Selecciona al menos un trabajador" : "Generar un PDF con los seleccionados"}
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
              <th className="px-4 py-3 font-medium">Cargo</th>
              {esAdmin && <th className="px-4 py-3 font-medium">Precio</th>}
              <th className="px-4 py-3 font-medium">IBAN</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={esAdmin ? 7 : 6} className="px-4 py-10 text-center text-slate-400">
                  No hay trabajadores que mostrar.
                </td>
              </tr>
            )}
            {filtrados.map((t) => (
              <tr key={t.id} className="text-slate-800 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label={`Seleccionar ${t.nombre}`}
                    className="h-4 w-4 cursor-pointer accent-brand"
                    checked={seleccionados.has(t.id)}
                    onChange={() => toggleUno(t.id)}
                  />
                </td>
                <td className="px-4 py-3 font-medium">{t.nombre}</td>
                <td className="px-4 py-3 text-slate-500">{t.cargos?.nombre || "—"}</td>
                {esAdmin && (
                  <td className="px-4 py-3">
                    {t.cargos
                      ? `${formatoEuros(t.cargos.tarifa_hora)} / ${unidadCorta(t.cargos.unidad)}`
                      : "—"}
                  </td>
                )}
                <td className="px-4 py-3 font-mono text-xs text-slate-500">
                  {t.iban || "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge activo={t.activo}>{t.activo ? "Activo" : "Inactivo"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <a
                      href={`/comprobante/trabajador/${t.id}`}
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
                        setEditando(t);
                        setModalAbierto(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onBorrar(t)}>
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
        title={editando ? "Editar trabajador" : "Nuevo trabajador"}
      >
        <form action={formAction} className="space-y-4">
          {editando && <input type="hidden" name="id" value={editando.id} />}

          <div>
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input id="nombre" name="nombre" required defaultValue={editando?.nombre} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cargo_id">Cargo</Label>
              <Select
                id="cargo_id"
                name="cargo_id"
                defaultValue={editando?.cargo_id ?? ""}
              >
                <option value="">— Sin cargo —</option>
                {cargos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({formatoEuros(c.tarifa_hora)}/{unidadCorta(c.unidad)})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="telefono">Telefono</Label>
              <Input id="telefono" name="telefono" defaultValue={editando?.telefono ?? ""} />
            </div>
          </div>

          <div>
            <Label htmlFor="iban">IBAN (para pagos)</Label>
            <Input
              id="iban"
              name="iban"
              placeholder="ES00 0000 0000 0000 0000 0000"
              defaultValue={editando?.iban ?? ""}
            />
          </div>

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
              placeholder="Notas internas sobre el trabajador..."
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
