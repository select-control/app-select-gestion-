"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarClock,
  Users,
  Building2,
  FileBarChart,
  ShieldCheck,
  BadgeEuro,
  FileSignature,
  Wallet,
  Lock,
  Activity,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import type { Rol } from "@/lib/types";

const navItems = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard, soloAdmin: false },
  { href: "/servicios", label: "Servicios", icon: CalendarClock, soloAdmin: false },
  { href: "/trabajadores", label: "Trabajadores", icon: Users, soloAdmin: false },
  { href: "/establecimientos", label: "Clientes", icon: Building2, soloAdmin: false },
  { href: "/contratos", label: "Contratos", icon: FileSignature, soloAdmin: false },
  { href: "/caja", label: "Caja", icon: Wallet, soloAdmin: false },
  { href: "/cargos", label: "Cargos", icon: BadgeEuro, soloAdmin: false },
  { href: "/informes", label: "Pagos y cobros", icon: FileBarChart, soloAdmin: false },
  { href: "/usuarios", label: "Usuarios", icon: ShieldCheck, soloAdmin: true },
  { href: "/actividad", label: "Panel de control", icon: Activity, soloAdmin: true },
  { href: "/seguridad", label: "Seguridad", icon: Lock, soloAdmin: false },
];

export function Sidebar({
  rol,
  nombre,
  email,
}: {
  rol: Rol;
  nombre: string | null;
  email: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function cerrarSesion() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const items = navItems.filter((i) => !i.soloAdmin || rol === "admin");

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      {/* franja de acento de marca */}
      <div className="h-1.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />

      <div className="flex items-center justify-center border-b border-slate-200 px-4 py-5">
        <Logo height={52} className="max-w-full" />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const activo = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                activo
                  ? "bg-brand/10 text-brand-dark"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {activo && (
                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand" />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  activo ? "text-brand-dark" : "text-slate-400 group-hover:text-slate-600"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <div className="mb-2 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/15 text-sm font-bold uppercase text-brand-dark ring-1 ring-brand/30">
            {(nombre || email || "?").charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">
              {nombre || email}
            </p>
            <p className="text-xs capitalize text-slate-400">{rol}</p>
          </div>
        </div>
        <button
          onClick={cerrarSesion}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesion
        </button>
      </div>
    </aside>
  );
}
