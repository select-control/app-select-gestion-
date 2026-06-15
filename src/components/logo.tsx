/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

/** Logo REAL de SELECT CONTROL (imagen en public/logo.jpg). */
export function Logo({
  className,
  height = 44,
}: {
  className?: string;
  height?: number;
}) {
  return (
    <img
      src="/logo.jpg"
      alt="SELECT CONTROL"
      style={{ height }}
      className={cn("w-auto select-none object-contain", className)}
    />
  );
}
