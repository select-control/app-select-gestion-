import { startOfYear, endOfYear, format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Clock,
  Wallet,
  TrendingUp,
  PiggyBank,
  CalendarClock,
  AlertTriangle,
  Percent,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { BarrasHorizontales, BarrasMensuales } from "@/components/charts";
import { formatoEuros, formatoHoras } from "@/lib/utils";
import { totalesServicio, type ServicioConRelaciones } from "@/lib/types";

export const dynamic = "force-dynamic";

const TILES: Record<string, string> = {
  green: "from-emerald-400 to-emerald-600",
  blue: "from-sky-400 to-blue-600",
  violet: "from-violet-400 to-violet-600",
  amber: "from-amber-400 to-orange-500",
  rose: "from-rose-400 to-red-600",
  brand: "from-brand-light to-brand-dark",
};
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function StatCard({
  titulo,
  valor,
  icono: Icono,
  tile,
}: {
  titulo: string;
  valor: string;
  icono: React.ElementType;
  tile: keyof typeof TILES;
}) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${TILES[tile]} text-white shadow-md`}>
        <Icono className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{titulo}</p>
        <p className="truncate text-2xl font-bold text-slate-900">{valor}</p>
      </div>
    </Card>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const usuario = await getUsuarioActual();
  const esAdmin = true; // encargado ve el panel economico igual que el admin

  const ahora = new Date();
  const desde = format(startOfYear(ahora), "yyyy-MM-dd");
  const hasta = format(endOfYear(ahora), "yyyy-MM-dd");

  const { data } = await supabase
    .from("servicios")
    .select("*, establecimientos(nombre, tarifa_hora_cliente), asignaciones(*, trabajadores(nombre), cargos(nombre))")
    .gte("fecha", desde)
    .lte("fecha", hasta);

  const servicios = (data as ServicioConRelaciones[]) ?? [];

  let totalHoras = 0, coste = 0, facturacion = 0, puestosSinCubrir = 0;
  const porMes = Array.from({ length: 12 }, () => 0);
  const porCliente = new Map<string, number>();
  const porTrabajador = new Map<string, number>();

  for (const s of servicios) {
    const t = totalesServicio(s.asignaciones ?? []);
    coste += t.coste;
    facturacion += t.facturacion;
    totalHoras += t.horas;
    const mes = Number(s.fecha.slice(5, 7)) - 1;
    if (mes >= 0 && mes < 12) porMes[mes] += t.facturacion;
    const cli = s.establecimientos?.nombre || "—";
    porCliente.set(cli, (porCliente.get(cli) || 0) + t.facturacion);
    for (const a of s.asignaciones ?? []) {
      const tr = a.trabajadores?.nombre || "Sin asignar";
      porTrabajador.set(tr, (porTrabajador.get(tr) || 0) + (a.horas || 0));
    }
    const faltan = s.puestos_necesarios - (s.asignaciones?.length ?? 0);
    if (faltan > 0) puestosSinCubrir += faltan;
  }

  const beneficio = facturacion - coste;
  const margen = facturacion > 0 ? (beneficio / facturacion) * 100 : 0;
  const anio = format(ahora, "yyyy");

  const topClientes = Array.from(porCliente.entries())
    .map(([etiqueta, valor]) => ({ etiqueta, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 8);
  const topTrabajadores = Array.from(porTrabajador.entries())
    .map(([etiqueta, valor]) => ({ etiqueta, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 8);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Panel</h1>
        <p className="text-sm text-slate-500">Resumen del año {anio}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard titulo="Servicios" valor={String(servicios.length)} icono={CalendarClock} tile="violet" />
        <StatCard titulo="Horas trabajadas" valor={formatoHoras(totalHoras)} icono={Clock} tile="blue" />
        {esAdmin ? (
          <>
            <StatCard titulo="Facturacion" valor={formatoEuros(facturacion)} icono={TrendingUp} tile="green" />
            <StatCard titulo="Beneficio" valor={formatoEuros(beneficio)} icono={PiggyBank} tile={beneficio >= 0 ? "brand" : "rose"} />
          </>
        ) : (
          <StatCard titulo="Puestos sin cubrir" valor={String(puestosSinCubrir)} icono={AlertTriangle} tile="amber" />
        )}
      </div>

      {esAdmin && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard titulo="Coste trabajadores" valor={formatoEuros(coste)} icono={Wallet} tile="amber" />
          <StatCard titulo="Margen medio" valor={`${margen.toFixed(0)}%`} icono={Percent} tile="brand" />
          <StatCard titulo="Puestos sin cubrir" valor={String(puestosSinCubrir)} icono={AlertTriangle} tile="rose" />
        </div>
      )}

      {/* Gráficos */}
      {esAdmin && (
        <Card className="mt-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Facturación por mes ({anio})</h2>
          <BarrasMensuales
            data={porMes.map((valor, i) => ({ mes: MESES[i], valor }))}
            formato={formatoEuros}
          />
        </Card>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {esAdmin && (
          <Card>
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Top clientes por facturación</h2>
            <BarrasHorizontales data={topClientes} formato={formatoEuros} />
          </Card>
        )}
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Top trabajadores por horas</h2>
          <BarrasHorizontales
            data={topTrabajadores}
            formato={formatoHoras}
            color="from-sky-400 to-blue-600"
          />
        </Card>
      </div>

      {servicios.length === 0 && (
        <Card className="mt-6 text-center text-slate-500">
          No hay servicios registrados este año todavia.
        </Card>
      )}
    </div>
  );
}
