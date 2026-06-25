import { redirect, notFound } from "next/navigation";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { PeriodoSelector } from "@/components/periodo-selector";
import { formatoEuros, formatoHoras } from "@/lib/utils";
import { totalesServicio, type ServicioConRelaciones } from "@/lib/types";

export const dynamic = "force-dynamic";

function fechaBonita(f: string | null) {
  if (!f) return "—";
  try {
    return format(new Date(f + "T00:00:00"), "d MMM yyyy", { locale: es });
  } catch {
    return f;
  }
}

export default async function ComprobanteClientePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/login");

  const { id } = await params;
  const sp = await searchParams;
  const ahora = new Date();
  const desde = sp.desde || format(startOfMonth(ahora), "yyyy-MM-dd");
  const hasta = sp.hasta || format(endOfMonth(ahora), "yyyy-MM-dd");

  const supabase = await createClient();
  const { data: est } = await supabase
    .from("establecimientos")
    .select("*")
    .eq("id", id)
    .single();
  if (!est) notFound();

  const { data: servData } = await supabase
    .from("servicios")
    .select("*, establecimientos(nombre, tarifa_hora_cliente), asignaciones(*, trabajadores(nombre), cargos(nombre))")
    .eq("establecimiento_id", id)
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .order("fecha", { ascending: true });

  const servicios = (servData as ServicioConRelaciones[]) ?? [];
  const filas = servicios.map((s) => {
    const t = totalesServicio(s.asignaciones ?? []);
    return { s, horas: t.horas, facturacion: t.facturacion, vigilantes: s.asignaciones?.length ?? 0 };
  });
  const totalHoras = filas.reduce((a, f) => a + f.horas, 0);
  const totalBase = filas.reduce((a, f) => a + f.facturacion, 0);

  return (
    <div className="mx-auto max-w-3xl bg-white p-10 text-slate-900 print:p-0">
      <PeriodoSelector desde={desde} hasta={hasta} />

      <div className="mb-8 flex items-start justify-between">
        <div>
          <Logo height={44} />
          <p className="mt-2 text-xs text-slate-500">SELECT CONTROL</p>
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold">Comprobante de cliente</h1>
          <p className="text-sm text-slate-600">{fechaBonita(desde)} – {fechaBonita(hasta)}</p>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 p-4">
        <p className="font-semibold">{est.razon_social || est.nombre}</p>
        {est.cif && <p className="text-sm text-slate-600">CIF: {est.cif}</p>}
        {est.direccion && <p className="text-sm text-slate-600">{est.direccion}</p>}
      </div>

      <table className="mb-6 w-full text-sm">
        <thead>
          <tr className="border-b-2 border-slate-300 text-left text-slate-500">
            <th className="py-2 font-medium">Fecha</th>
            <th className="py-2 font-medium">Horario</th>
            <th className="py-2 text-right font-medium">Operarios</th>
            <th className="py-2 text-right font-medium">Horas</th>
            <th className="py-2 text-right font-medium">Facturación</th>
          </tr>
        </thead>
        <tbody>
          {filas.length === 0 && (
            <tr><td colSpan={5} className="py-4 text-center text-slate-400">Sin servicios en este periodo.</td></tr>
          )}
          {filas.map((f) => (
            <tr key={f.s.id} className="border-b border-slate-100">
              <td className="py-2">{fechaBonita(f.s.fecha)}</td>
              <td className="py-2 text-slate-600">{f.s.hora_inicio?.slice(0, 5)}–{f.s.hora_fin?.slice(0, 5)}</td>
              <td className="py-2 text-right">{f.vigilantes}</td>
              <td className="py-2 text-right">{formatoHoras(f.horas)}</td>
              <td className="py-2 text-right font-medium">{formatoEuros(f.facturacion)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto w-64 space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-slate-500">Horas totales</span><span>{formatoHoras(totalHoras)}</span></div>
        <div className="mt-1 flex justify-between border-t border-slate-300 pt-2 text-base font-bold">
          <span>TOTAL (base)</span><span>{formatoEuros(totalBase)}</span>
        </div>
      </div>
    </div>
  );
}
