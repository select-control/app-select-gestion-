import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { PrintButton } from "@/components/print-button";
import { formatoEuros } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientesLotePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/login");

  const sp = await searchParams;
  const ids = (sp.ids || "").split(",").map((s) => s.trim()).filter(Boolean);

  const supabase = await createClient();
  const [{ data }, { data: cargosData }] = await Promise.all([
    ids.length
      ? supabase.from("establecimientos").select("*").in("id", ids).order("nombre")
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    supabase.from("cargos").select("id, nombre"),
  ]);

  const cargosMap = new Map<string, string>(
    ((cargosData ?? []) as Array<{ id: string; nombre: string }>).map((c) => [c.id, c.nombre])
  );

  const clientes = (data ?? []) as Array<{
    id: string;
    nombre: string;
    razon_social: string | null;
    cif: string | null;
    direccion: string | null;
    email: string | null;
    delegacion: string | null;
    tarifa_hora_cliente: number;
    tarifas_cliente: Record<string, number> | null;
    activo: boolean;
    observaciones: string | null;
  }>;

  return (
    <div className="mx-auto max-w-3xl bg-white p-10 text-slate-900 print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="text-sm text-slate-500">
          {clientes.length} cliente{clientes.length === 1 ? "" : "s"} seleccionado
          {clientes.length === 1 ? "" : "s"}
        </p>
        <PrintButton />
      </div>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <Logo height={44} />
          <p className="mt-2 text-xs text-slate-500">SELECT CONTROL</p>
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold">Ficha de clientes</h1>
          <p className="text-sm text-slate-600">{clientes.length} en total</p>
        </div>
      </div>

      {clientes.length === 0 && (
        <p className="py-10 text-center text-slate-400">No hay clientes seleccionados.</p>
      )}

      <div className="space-y-4">
        {clientes.map((e) => {
          const tarifas = Object.entries(e.tarifas_cliente ?? {}).filter(([, v]) => v > 0);
          return (
            <div
              key={e.id}
              className="break-inside-avoid rounded-lg border border-slate-200 p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold">{e.nombre}</p>
                  {e.razon_social && (
                    <p className="text-xs text-slate-400">{e.razon_social}</p>
                  )}
                </div>
                <span
                  className={
                    "rounded-full px-2 py-0.5 text-xs font-medium " +
                    (e.activo ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500")
                  }
                >
                  {e.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <Dato label="CIF" valor={e.cif || "—"} />
                <Dato label="Delegacion" valor={e.delegacion || "—"} />
                <Dato label="Direccion" valor={e.direccion || "—"} />
                <Dato label="Email" valor={e.email || "—"} />
                <Dato label="Tarifa general/hora" valor={formatoEuros(e.tarifa_hora_cliente)} />
              </div>
              {tarifas.length > 0 && (
                <div className="mt-2 border-t border-slate-100 pt-2 text-sm">
                  <span className="text-slate-500">Tarifas por cargo: </span>
                  {tarifas
                    .map(([cid, v]) => `${cargosMap.get(cid) || "?"} ${formatoEuros(v)}/h`)
                    .join("  ·  ")}
                </div>
              )}
              {e.observaciones && (
                <div className="mt-2 border-t border-slate-100 pt-2 text-sm">
                  <span className="text-slate-500">Observaciones: </span>
                  <span className="whitespace-pre-wrap">{e.observaciones}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <p>
      <span className="text-slate-500">{label}: </span>
      <span>{valor}</span>
    </p>
  );
}
