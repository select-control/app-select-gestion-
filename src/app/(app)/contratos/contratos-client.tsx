"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil, Trash2, Plus, Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import type { Rol, ContratoConRelaciones, Establecimiento } from "@/lib/types";
import {
  crearContrato,
  actualizarContrato,
  borrarContrato,
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

function Si({ v }: { v: boolean }) {
  return v ? (
    <Check className="h-4 w-4 text-emerald-600" />
  ) : (
    <Minus className="h-4 w-4 text-slate-300" />
  );
}

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando..." : "Guardar"}
    </Button>
  );
}

export function ContratosClient({
  contratos,
  establecimientos,
  rol,
}: {
  contratos: ContratoConRelaciones[];
  establecimientos: Establecimiento[];
  rol: Rol;
}) {
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<ContratoConRelaciones | null>(null);

  const accion = editando ? actualizarContrato : crearContrato;
  const [estado, formAction] = useFormState(accion, estadoInicial);

  useEffect(() => {
    if (estado.ok) setModal(false);
  }, [estado]);

  async function onBorrar(c: ContratoConRelaciones) {
    if (!confirm(`¿Borrar el contrato ${c.numero || ""}?`)) return;
    const res = await borrarContrato(c.id);
    if (!res.ok) alert(res.error);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contratos</h1>
          <p className="text-sm text-slate-500">{contratos.length} en total</p>
        </div>
        <Button onClick={() => { setEditando(null); setModal(true); }}>
          <Plus className="h-4 w-4" /> Nuevo contrato
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-slate-500">
            <tr>
              <th className="px-3 py-3 font-medium">Nº</th>
              <th className="px-3 py-3 font-medium">Cliente</th>
              <th className="px-3 py-3 font-medium">Inicio</th>
              <th className="px-3 py-3 font-medium">Fin</th>
              <th className="px-3 py-3 text-center font-medium">Firmado</th>
              <th className="px-3 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {contratos.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No hay contratos todavia.</td></tr>
            )}
            {contratos.map((c) => (
              <tr key={c.id} className="text-slate-800 hover:bg-slate-50">
                <td className="px-3 py-3 font-semibold">{c.numero || "—"}</td>
                <td className="px-3 py-3">{c.establecimientos?.nombre || "—"}</td>
                <td className="whitespace-nowrap px-3 py-3 text-slate-500">{fechaBonita(c.fecha_inicio)}</td>
                <td className="whitespace-nowrap px-3 py-3 text-slate-500">{fechaBonita(c.fecha_fin)}</td>
                <td className="px-3 py-3"><div className="flex justify-center"><Si v={c.firmado} /></div></td>
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setEditando(c); setModal(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onBorrar(c)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? "Editar contrato" : "Nuevo contrato"} wide>
        <form action={formAction} className="space-y-4">
          {editando && <input type="hidden" name="id" value={editando.id} />}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numero">Nº de contrato</Label>
              <Input id="numero" name="numero" defaultValue={editando?.numero ?? ""} />
            </div>
            <div>
              <Label htmlFor="establecimiento_id">Cliente</Label>
              <Select id="establecimiento_id" name="establecimiento_id" defaultValue={editando?.establecimiento_id ?? ""}>
                <option value="">— Selecciona —</option>
                {establecimientos.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fecha_inicio">Fecha inicio</Label>
              <Input id="fecha_inicio" name="fecha_inicio" type="date" defaultValue={editando?.fecha_inicio ?? ""} />
            </div>
            <div>
              <Label htmlFor="fecha_fin">Fecha fin</Label>
              <Input id="fecha_fin" name="fecha_fin" type="date" defaultValue={editando?.fecha_fin ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["firmado", "Firmado"],
            ].map(([name, label]) => (
              <label key={name} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name={name}
                  defaultChecked={Boolean(editando?.[name as keyof ContratoConRelaciones])}
                  className="h-4 w-4 accent-emerald-500"
                />
                {label}
              </label>
            ))}
          </div>
          <div>
            <Label htmlFor="notas">Notas</Label>
            <Textarea id="notas" name="notas" defaultValue={editando?.notas ?? ""} />
          </div>

          {estado.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{estado.error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
            <BotonGuardar />
          </div>
        </form>
      </Modal>
    </div>
  );
}
