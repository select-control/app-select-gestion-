"use client";

import { Printer } from "lucide-react";

/** Boton que abre el dialogo de impresion del navegador (permite "Guardar como PDF"). */
export function PrintButton({ children = "Imprimir / PDF" }: { children?: React.ReactNode }) {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-b from-brand-light to-brand px-4 py-2 text-sm font-semibold text-black shadow-brand transition-all hover:brightness-105 print:hidden"
    >
      <Printer className="h-4 w-4" />
      {children}
    </button>
  );
}
