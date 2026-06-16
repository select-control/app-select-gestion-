"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil, Trash2, Plus, Check, Minus, Paperclip, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import type { Rol, ContratoConRelaciones, Establecimiento } from "@/lib/types";
import {
  crearContrato,
  actualizarContrato,
  borrarContrato,
  subirDocumentoContrato,
  borrarDocumentoContrato,
  urlDocumentoContrato,
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
  const router = useRouter();
  const [modal, setModal] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  // editando se deriva de la lista viva → tras subir/borrar un documento y
  // refrescar, la sección de documentos se actualiza sola.
  const editando = editandoId ? contratos.find((c) => c.id === editandoId) ?? null : null;

  const accion = editandoId ? actualizarContrato : crearContrato;
  const [estado, formAction] = useFormState(accion, estadoInicial);

  const [subiendo, startSubir] = useTransition();
  const [docError, setDocError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!estado.ok) return;
    if (estado.id) {
      // Contrato recién creado: pasamos a modo edición (sin cerrar) para que
      // aparezca el botón de adjuntar documentos al momento.
      setEditandoId(estado.id);
      router.refresh();
    } else {
      setModal(false);
    }
  }, [estado, router]);

  function abrirNuevo() {
    setEditandoId(null);
    setDocError(null);
    setModal(true);
  }
  function abrirEditar(c: ContratoConRelaciones) {
    setEditandoId(c.id);
    setDocError(null);
    setModal(true);
  }

  async function onBorrar(c: ContratoConRelaciones) {
    if (!confirm(`¿Borrar el contrato ${c.numero || ""}?`)) return;
    const res = await borrarContrato(c.id);
    if (!res.ok) alert(res.error);
  }

  function onElegirArchivo(file: File | null) {
    if (!file || !editandoId) return;
    setDocError(null);
    const fd = new FormData();
    fd.set("id", editandoId);
    fd.set("archivo", file);
    startSubir(async () => {
      const res = await subirDocumentoContrato(fd);
      if (!res.ok) setDocError(res.error || "No se pudo subir.");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    });
  }

  async function onVerDoc(path: string) {
    const res = await urlDocumentoContrato(path);
    if (res.url) window.open(res.url, "_blank", "noreferrer");
    else alert(res.error || "No se pudo abrir el documento.");
  }

  async function onBorrarDoc(path: string) {
    if (!editandoId) return;
    if (!confirm("¿Borrar este documento?")) return;
    const res = await borrarDocumentoContrato(editandoId, path);
    if (!res.ok) alert(res.error);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contratos</h1>
          <p className="text-sm text-slate-500">{contratos.length} en total</p>
        </div>
        <Button onClick={abrirNuevo}>
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
              <th className="px-3 py-3 text-center font-medium">Documentos</th>
              <th className="px-3 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {contratos.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No hay contratos todavia.</td></tr>
            )}
            {contratos.map((c) => (
              <tr key={c.id} className="text-slate-800 hover:bg-slate-50">
                <td className="px-3 py-3 font-semibold">{c.numero || "—"}</td>
                <td className="px-3 py-3">{c.establecimientos?.nombre || "—"}</td>
                <td className="whitespace-nowrap px-3 py-3 text-slate-500">{fechaBonita(c.fecha_inicio)}</td>
                <td className="whitespace-nowrap px-3 py-3 text-slate-500">{fechaBonita(c.fecha_fin)}</td>
                <td className="px-3 py-3"><div className="flex justify-center"><Si v={c.firmado} /></div></td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-center gap-1 text-slate-500">
                    {(c.documentos?.length ?? 0) > 0 ? (
                      <>
                        <Paperclip className="h-3.5 w-3.5" />
                        <span className="text-xs">{c.documentos.length}</span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => abrirEditar(c)}>
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

      <Modal open={modal} onClose={() => setModal(false)} title={editandoId ? "Editar contrato" : "Nuevo contrato"} wide>
        <form action={formAction} className="space-y-4">
          {editandoId && <input type="hidden" name="id" value={editandoId} />}
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
          <label className="flex w-fit items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="firmado"
              defaultChecked={Boolean(editando?.firmado)}
              className="h-4 w-4 accent-emerald-500"
            />
            Firmado
          </label>
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

        {/* Documentos adjuntos (contrato escaneado, anexos, imágenes...) */}
        <div className="mt-6 border-t border-slate-200 pt-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Documentos del contrato</h3>
            {editandoId && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.heic,.webp,image/*,application/pdf"
                  onChange={(e) => onElegirArchivo(e.target.files?.[0] ?? null)}
                />
                <Button type="button" variant="secondary" disabled={subiendo} onClick={() => fileRef.current?.click()}>
                  <Paperclip className="h-4 w-4" /> {subiendo ? "Subiendo..." : "Adjuntar"}
                </Button>
              </>
            )}
          </div>

          {!editandoId ? (
            <p className="text-sm text-slate-400">Guarda el contrato primero para poder adjuntar documentos.</p>
          ) : (editando?.documentos?.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-400">Sin documentos. Adjunta el contrato, anexos o imágenes (PDF, Word, fotos).</p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {(editando?.documentos ?? []).map((d) => (
                <li key={d.path} className="flex items-center justify-between px-3 py-2 text-sm">
                  <button
                    type="button"
                    onClick={() => onVerDoc(d.path)}
                    className="flex min-w-0 items-center gap-2 text-left text-slate-700 hover:text-brand"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate underline-offset-2 hover:underline">{d.nombre}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onBorrarDoc(d.path)}
                    title="Borrar documento"
                    className="ml-2 shrink-0 text-slate-400 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {docError && <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{docError}</p>}
        </div>
      </Modal>
    </div>
  );
}
