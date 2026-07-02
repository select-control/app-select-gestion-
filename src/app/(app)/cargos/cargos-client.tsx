"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Pencil, Trash2, Plus, BadgeEuro } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Card } from "@/components/ui/card";
import { formatoEuros } from "@/lib/utils";
import { UNIDADES_TARIFA, unidadCorta, type Rol, type Cargo } from "@/lib/types";
import {
  crearCargo,
  actualizarCargo,
  borrarCargo,
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

export function CargosClient({ cargos, rol }: { cargos: Cargo[]; rol: Rol }) {
  // Todos los roles ven/editan lo economico; solo /usuarios y /actividad son admin-only.
  const esAdmin = true;
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Cargo | null>(null);
  const [unidadSel, setUnidadSel] = useState<string>("hora");

  const accion = editando ? actualizarCargo : crearCargo;
  const [estado, formAction] = useFormState(accion, estadoInicial);

  useEffect(() => {
    if (estado.ok) setModalAbierto(false);
  }, [estado]);

  async function onBorrar(c: Cargo) {
    if (!confirm(`¿Borrar el cargo "${c.nombre}"?`)) return;
    const res = await borrarCargo(c.id);
    if (!res.ok) alert(res.error);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cargos</h1>
          <p className="text-sm text-slate-500">
            El cargo decide el precio/hora del trabajador
          </p>
        </div>
        {esAdmin && (
          <Button
            onClick={() => {
              setEditando(null);
              setUnidadSel("hora");
              setModalAbierto(true);
            }}
          >
            <Plus className="h-4 w-4" /> Nuevo cargo
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cargos.length === 0 && (
          <Card className="text-slate-500">No hay cargos todavia.</Card>
        )}
        {cargos.map((c) => (
          <Card key={c.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/15 p-3 text-emerald-600">
                <BadgeEuro className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{c.nombre}</p>
                <p className="text-sm text-slate-500">
                  {formatoEuros(c.tarifa_hora)} / {unidadCorta(c.unidad)}
                </p>
              </div>
            </div>
            {esAdmin && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditando(c);
                    setUnidadSel(c.unidad ?? "hora");
                    setModalAbierto(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onBorrar(c)}>
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {!esAdmin && (
        <p className="mt-6 text-sm text-slate-400">
          Solo el administrador puede crear o cambiar los precios de los cargos.
        </p>
      )}

      <Modal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={editando ? "Editar cargo" : "Nuevo cargo"}
      >
        <form action={formAction} className="space-y-4">
          {editando && <input type="hidden" name="id" value={editando.id} />}

          <div>
            <Label htmlFor="nombre">Nombre del cargo</Label>
            <Input
              id="nombre"
              name="nombre"
              required
              placeholder="Ej. Controlador"
              defaultValue={editando?.nombre}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tarifa_hora">Precio por {unidadCorta(unidadSel)} (€)</Label>
              <Input
                id="tarifa_hora"
                name="tarifa_hora"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={editando?.tarifa_hora ?? 0}
              />
            </div>
            <div>
              <Label htmlFor="unidad">Unidad</Label>
              <Select
                id="unidad"
                name="unidad"
                value={unidadSel}
                onChange={(e) => setUnidadSel(e.target.value)}
              >
                {UNIDADES_TARIFA.map((u) => (
                  <option key={u.valor} value={u.valor}>
                    {u.etiqueta}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="orden">Orden</Label>
            <Input
              id="orden"
              name="orden"
              type="number"
              min="0"
              defaultValue={editando?.orden ?? 0}
            />
            <p className="mt-1 text-xs text-slate-400">
              El precio y la unidad se pueden cambiar cuando quieras.
            </p>
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
