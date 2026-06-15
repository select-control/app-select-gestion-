"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Pencil, Trash2, Plus, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  crearUsuario,
  actualizarUsuario,
  borrarUsuario,
  type ResultadoAccion,
} from "./actions";

const estadoInicial: ResultadoAccion = { ok: false };

export interface UsuarioFila {
  id: string;
  email: string;
  nombre: string;
  rol: "admin" | "encargado";
}

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando..." : "Guardar"}
    </Button>
  );
}

export function UsuariosClient({
  usuarios,
  miId,
}: {
  usuarios: UsuarioFila[];
  miId: string | null;
}) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<UsuarioFila | null>(null);

  const accion = editando ? actualizarUsuario : crearUsuario;
  const [estado, formAction] = useFormState(accion, estadoInicial);

  function abrirNuevo() {
    setEditando(null);
    setModalAbierto(true);
  }
  function abrirEditar(u: UsuarioFila) {
    setEditando(u);
    setModalAbierto(true);
  }

  useEffect(() => {
    if (estado.ok) setModalAbierto(false);
  }, [estado]);

  async function onBorrar(u: UsuarioFila) {
    if (!confirm(`¿Eliminar el acceso de ${u.email}?`)) return;
    const res = await borrarUsuario(u.id);
    if (!res.ok) alert(res.error);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
          <p className="text-sm text-slate-500">
            Gestiona quien puede acceder a la aplicacion
          </p>
        </div>
        <Button onClick={abrirNuevo}>
          <Plus className="h-4 w-4" /> Nuevo usuario
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                  No hay usuarios todavia.
                </td>
              </tr>
            )}
            {usuarios.map((u) => (
              <tr key={u.id} className="text-slate-800 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">
                  {u.nombre}
                  {u.id === miId && (
                    <span className="ml-2 text-xs text-slate-400">(tu)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      u.rol === "admin"
                        ? "bg-green-500/15 text-emerald-600"
                        : "bg-slate-500/15 text-slate-700"
                    }`}
                  >
                    {u.rol === "admin" ? (
                      <ShieldCheck className="h-3 w-3" />
                    ) : (
                      <User className="h-3 w-3" />
                    )}
                    {u.rol === "admin" ? "Administrador" : "Encargado"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => abrirEditar(u)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {u.id !== miId && (
                      <Button variant="ghost" size="sm" onClick={() => onBorrar(u)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
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
        title={editando ? "Editar usuario" : "Nuevo usuario"}
      >
        <form action={formAction} className="space-y-4">
          {editando && <input type="hidden" name="id" value={editando.id} />}

          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" name="nombre" defaultValue={editando?.nombre ?? ""} />
          </div>

          {!editando && (
            <>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div>
                <Label htmlFor="password">Contrasena</Label>
                <Input
                  id="password"
                  name="password"
                  type="text"
                  required
                  placeholder="Minimo 6 caracteres"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Comparte esta contrasena con la persona. Podra cambiarla luego.
                </p>
              </div>
            </>
          )}

          {editando && (
            <div className="rounded-md bg-slate-100/60 px-3 py-2 text-sm text-slate-500">
              {editando.email}
            </div>
          )}

          <div>
            <Label htmlFor="rol">Rol</Label>
            <Select id="rol" name="rol" defaultValue={editando?.rol ?? "encargado"}>
              <option value="encargado">Encargado (solo horas)</option>
              <option value="admin">Administrador (todo)</option>
            </Select>
          </div>

          {estado.error && (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">
              {estado.error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <BotonGuardar />
          </div>
        </form>
      </Modal>
    </div>
  );
}
