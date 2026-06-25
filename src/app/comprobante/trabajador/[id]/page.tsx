import { redirect, notFound } from "next/navigation";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { PeriodoSelector } from "@/components/periodo-selector";
import { formatoEuros, formatoHoras } from "@/lib/utils";

export const dynamic = "force-dynamic";

function fechaBonita(f: string | null) {
  if (!f) return "—";
  try {
    return format(new Date(f + "T00:00:00"), "d MMM yyyy", { locale: es });
  } catch {
    return f;
  }
}

export default async function ComprobanteTrabajadorPage({
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
  const { data: trab } = await supabase
    .from("trabajadores")
    .select("*, cargos(nombre)")
    .eq("id", id)
    .single();
  if (!trab) notFound();

  const { data: asigData } = await supabase
    .from("asignaciones")
    .select("*, servicios!inner(fecha, hora_inicio, hora_fin, establecimientos(nombre))")
    .eq("trabajador_id", id)
    .gte("servicios.fecha", desde)
    .lte("servicios.fecha", hasta);

  type Fila = {
    fecha: string;
    establecimiento: string;
    hora_inicio: string;
    hora_fin: string;
    horas: number;
    coste_hora: number;
    extras: number;
    total: number;
  };
  const filas: Fila[] = (asigData ?? [])
    .map((a: Record<string, unknown>) => {
      const serv = a.servicios as { fecha: string; hora_inicio: string; hora_fin: string; establecimientos: { nombre: string } | null };
      const horas = Number(a.horas) || 0;
      const coste_hora = Number(a.coste_hora) || 0;
      const extras = Number(a.extras) || 0;
      return {
        fecha: serv.fecha,
        establecimiento: serv.establecimientos?.nombre || "—",
        hora_inicio: serv.hora_inicio,
        hora_fin: serv.hora_fin,
        horas,
        coste_hora,
        extras,
        total: horas * coste_hora + extras,
      };
    })
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const totalHoras = filas.reduce((s, f) => s + f.horas, 0);
  const totalPagar = filas.reduce((s, f) => s + f.total, 0);

  return (
    <div className="mx-auto max-w-3xl bg-white p-10 text-slate-900 print:p-0">
      <PeriodoSelector desde={desde} hasta={hasta} />

      <div className="mb-8 flex items-start justify-between">
        <div>
          <Logo height={44} />
          <p className="mt-2 text-xs text-slate-500">SELECT CONTROL</p>
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold">Comprobante de trabajador</h1>
          <p className="text-sm text-slate-600">{fechaBonita(desde)} – {fechaBonita(hasta)}</p>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 p-4">
        <p className="font-semibold">{trab.nombre}</p>
        {trab.cargos?.nombre && <p className="text-sm text-slate-600">Cargo: {trab.cargos.nombre}</p>}
        {trab.iban && <p className="text-sm text-slate-600">IBAN: {trab.iban}</p>}
      </div>

      <table className="mb-6 w-full text-sm">
        <thead>
          <tr className="border-b-2 border-slate-300 text-left text-slate-500">
            <th className="py-2 font-medium">Fecha</th>
            <th className="py-2 font-medium">Cliente</th>
            <th className="py-2 font-medium">Horario</th>
            <th className="py-2 text-right font-medium">Horas</th>
            <th className="py-2 text-right font-medium">€/h</th>
            <th className="py-2 text-right font-medium">Extras</th>
            <th className="py-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {filas.length === 0 && (
            <tr><td colSpan={7} className="py-4 text-center text-slate-400">Sin servicios en este periodo.</td></tr>
          )}
          {filas.map((f, i) => (
            <tr key={i} className="border-b border-slate-100">
              <td className="py-2">{fechaBonita(f.fecha)}</td>
              <td className="py-2">{f.establecimiento}</td>
              <td className="py-2 text-slate-600">{f.hora_inicio?.slice(0, 5)}–{f.hora_fin?.slice(0, 5)}</td>
              <td className="py-2 text-right">{formatoHoras(f.horas)}</td>
              <td className="py-2 text-right">{formatoEuros(f.coste_hora)}</td>
              <td className="py-2 text-right">{f.extras ? formatoEuros(f.extras) : "—"}</td>
              <td className="py-2 text-right font-medium">{formatoEuros(f.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto w-64 space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-slate-500">Horas totales</span><span>{formatoHoras(totalHoras)}</span></div>
        <div className="mt-1 flex justify-between border-t border-slate-300 pt-2 text-base font-bold">
          <span>TOTAL A PAGAR</span><span>{formatoEuros(totalPagar)}</span>
        </div>
      </div>
    </div>
  );
}
