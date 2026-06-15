import { cn } from "@/lib/utils";

/**
 * Wordmark "SELECT CONTROL" recreado en CSS al estilo del logo:
 * negras, italicas y agresivas, con "CONTROL" espaciado y un acento verde.
 */
export function Wordmark({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const main = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-6xl sm:text-7xl",
  }[size];

  const sub = {
    sm: "text-[8px] tracking-[0.45em]",
    md: "text-[10px] tracking-[0.5em]",
    lg: "text-xs tracking-[0.62em] sm:text-sm",
  }[size];

  return (
    <div className={cn("inline-flex select-none flex-col", className)}>
      <span className={cn("wordmark text-white", main)}>
        SELE<span className="text-brand">C</span>T
      </span>
      <span className={cn("wordmark-sub mt-1 self-stretch text-center text-brand", sub)}>
        CONTROL
      </span>
    </div>
  );
}
