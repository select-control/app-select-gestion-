"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Pencil, Trash2, Plus, Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/card";
import { formatoEuros } from "@/lib/utils";
import type { Rol, TrabajadorConCargo, Cargo } from "@/lib/types";
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
  const esAdmin = rol === "admin";
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<TrabajadorConCargo | null>(null);
  const [busqueda, setBusqueda] = useState("");

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
    if (!q) return true;
    return (
      t.nombre.toLowerCase().includes(q) ||
      (t.cargos?.nombre || "").toLowerCase().includes(q)
    );
  });

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

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          className="pl-9"
          placeholder="Buscar por nombre o cargo..."
          value={busqueda}
          onChange={(ev) => setBusqueda(ev.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Cargo</th>
              {esAdmin && <th className="px-4 py-3 font-medium">Precio/hora</th>}
              <th className="px-4 py-3 font-medium">IBAN</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={esAdmin ? 6 : 5} className="px-4 py-10 text-center text-slate-400">
                  No hay trabajadores que mostrar.
                </td>
              </tr>
            )}
            {filtrados.map((t) => (
              <tr key={t.id} className="text-slate-800 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{t.nombre}</td>
                <td className="px-4 py-3 text-slate-500">{t.cargos?.nombre || "—"}</td>
                {esAdmin && (
                  <td className="px-4 py-3">
                    {t.cargos ? formatoEuros(t.cargos.tarifa_hora) : "—"}
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
                    {c.nombre} ({formatoEuros(c.tarifa_hora)}/h)
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
