import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 transition-shadow hover:shadow-md",
        className
      )}
      {...props}
    />
  );
}

export function Badge({
  children,
  activo,
}: {
  children: React.ReactNode;
  activo: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        activo
          ? "bg-brand/10 text-brand-dark ring-brand/30"
          : "bg-slate-100 text-slate-500 ring-slate-200"
      )}
    >
      {children}
    </span>
  );
}
