"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Printer } from "lucide-react";

/** Selector de periodo (desde/hasta) + boton de imprimir. Oculto al imprimir. */
export function PeriodoSelector({ desde, hasta }: { desde: string; hasta: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [d, setD] = useState(desde);
  const [h, setH] = useState(hasta);

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3 print:hidden">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Desde</label>
        <input
          type="date"
          value={d}
          onChange={(e) => setD(e.target.value)}
          className="h-9 rounded-lg border border-slate-300 px-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Hasta</label>
        <input
          type="date"
          value={h}
          onChange={(e) => setH(e.target.value)}
          className="h-9 rounded-lg border border-slate-300 px-2 text-sm"
        />
      </div>
      <button
        onClick={() => router.push(`${pathname}?desde=${d}&hasta=${h}`)}
        className="h-9 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Aplicar
      </button>
      <button
        onClick={() => window.print()}
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-gradient-to-b from-brand-light to-brand px-4 text-sm font-semibold text-black shadow-brand hover:brightness-105"
      >
        <Printer className="h-4 w-4" /> Imprimir / PDF
      </button>
    </div>
  );
}
