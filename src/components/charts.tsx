import { cn } from "@/lib/utils";

/** Barras horizontales (ranking): cada fila con etiqueta, barra y valor. */
export function BarrasHorizontales({
  data,
  formato,
  color = "from-brand-light to-brand",
}: {
  data: { etiqueta: string; valor: number }[];
  formato: (v: number) => string;
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.valor), 1);
  if (data.length === 0)
    return <p className="py-6 text-center text-sm text-slate-400">Sin datos.</p>;
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.etiqueta}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="truncate pr-2 text-slate-700">{d.etiqueta}</span>
            <span className="shrink-0 font-medium text-slate-900">{formato(d.valor)}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn("h-full rounded-full bg-gradient-to-r", color)}
              style={{ width: `${Math.max(3, (d.valor / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Barras verticales por mes. */
export function BarrasMensuales({
  data,
  formato,
}: {
  data: { mes: string; valor: number }[];
  formato: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.valor), 1);
  return (
    <div className="flex items-end justify-between gap-2" style={{ height: 180 }}>
      {data.map((d) => (
        <div key={d.mes} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex w-full flex-1 items-end">
            <div
              className="group relative w-full rounded-t-md bg-gradient-to-t from-brand-dark to-brand-light transition-all hover:brightness-105"
              style={{ height: `${(d.valor / max) * 100}%`, minHeight: d.valor > 0 ? 4 : 0 }}
              title={formato(d.valor)}
            />
          </div>
          <span className="text-[10px] text-slate-400">{d.mes}</span>
        </div>
      ))}
    </div>
  );
}
