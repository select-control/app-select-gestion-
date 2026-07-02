import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { PrintButton } from "@/components/print-button";
import { formatoEuros } from "@/lib/utils";
import { unidadCorta } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TrabajadoresLotePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/login");

  const sp = await searchParams;
  const ids = (sp.ids || "").split(",").map((s) => s.trim()).filter(Boolean);

  const supabase = await createClient();
  const { data } = ids.length
    ? await supabase
        .from("trabajadores")
        .select("*, cargos(nombre, tarifa_hora, unidad)")
        .in("id", ids)
        .order("nombre")
    : { data: [] as Record<string, unknown>[] };

  const trabajadores = (data ?? []) as Array<{
    id: string;
    nombre: string;
    iban: string | null;
    telefono: string | null;
    activo: boolean;
    observaciones: string | null;
    cargos: { nombre: string; tarifa_hora: number; unidad: string } | null;
  }>;

  return (
    <div className="mx-auto max-w-3xl bg-white p-10 text-slate-900 print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="text-sm text-slate-500">
          {trabajadores.length} trabajador{trabajadores.length === 1 ? "" : "es"} seleccionado
          {trabajadores.length === 1 ? "" : "s"}
        </p>
        <PrintButton />
      </div>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <Logo height={44} />
          <p className="mt-2 text-xs text-slate-500">SELECT CONTROL</p>
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold">Ficha de trabajadores</h1>
          <p className="text-sm text-slate-600">{trabajadores.length} en total</p>
        </div>
      </div>

      {trabajadores.length === 0 && (
        <p className="py-10 text-center text-slate-400">No hay trabajadores seleccionados.</p>
      )}

      <div className="space-y-4">
        {trabajadores.map((t) => (
          <div
            key={t.id}
            className="break-inside-avoid rounded-lg border border-slate-200 p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-base font-semibold">{t.nombre}</p>
              <span
                className={
                  "rounded-full px-2 py-0.5 text-xs font-medium " +
                  (t.activo ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500")
                }
              >
                {t.activo ? "Activo" : "Inactivo"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <Dato label="Cargo" valor={t.cargos?.nombre || "—"} />
              <Dato
                label="Precio"
                valor={
                  t.cargos
                    ? `${formatoEuros(t.cargos.tarifa_hora)} / ${unidadCorta(t.cargos.unidad)}`
                    : "—"
                }
              />
              <Dato label="Telefono" valor={t.telefono || "—"} />
              <Dato label="IBAN" valor={t.iban || "—"} mono />
            </div>
            {t.observaciones && (
              <div className="mt-2 border-t border-slate-100 pt-2 text-sm">
                <span className="text-slate-500">Observaciones: </span>
                <span className="whitespace-pre-wrap">{t.observaciones}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Dato({ label, valor, mono }: { label: string; valor: string; mono?: boolean }) {
  return (
    <p>
      <span className="text-slate-500">{label}: </span>
      <span className={mono ? "font-mono text-xs" : ""}>{valor}</span>
    </p>
  );
}
