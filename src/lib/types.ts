export type Rol = "admin" | "encargado";

export type EstadoServicio = "Pendiente" | "Realizado" | "Cancelado";
export type FormaCobro = "efectivo" | "transferencia";

/** Un cargo: define el precio/hora del trabajador que lo ejerce. */
export interface Cargo {
  id: string;
  nombre: string;
  tarifa_hora: number;
  orden: number;
  created_at: string;
}

export interface Trabajador {
  id: string;
  nombre: string;
  iban: string | null;
  telefono: string | null;
  cargo_id: string | null;
  activo: boolean;
  created_at: string;
}

export interface TrabajadorConCargo extends Trabajador {
  cargos: Pick<Cargo, "nombre" | "tarifa_hora"> | null;
}

export interface Establecimiento {
  id: string;
  nombre: string;
  razon_social: string | null;
  cif: string | null;
  direccion: string | null;
  delegacion: string | null;
  email: string | null;
  tarifa_hora_cliente: number;
  activo: boolean;
  created_at: string;
}

export interface Servicio {
  id: string;
  establecimiento_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  puestos_necesarios: number; // total de vigilantes (suma de puestos_por_cargo)
  puestos_por_cargo: Record<string, number>; // { cargo_id: nº necesarios }
  precio_hora_cliente: number; // precio estandar (snapshot del establecimiento)
  precio_especial: number | null; // si se aplica un precio distinto al estandar
  delegacion: string | null;
  observaciones: string | null;
  estado: EstadoServicio;
  cobrado: boolean;
  forma_cobro: FormaCobro | null;
  fecha_cobro: string | null;
  created_at: string;
}

export interface Asignacion {
  id: string;
  servicio_id: string;
  trabajador_id: string | null;
  cargo_id: string | null;
  hueco: number;
  hora_inicio: string;
  hora_fin: string;
  horas: number;
  horas_extra: number; // horas extra (overtime)
  precio_hora_extra: number; // €/h que se paga al trabajador por hora extra (manual)
  coste_hora: number;
  extras: number; // plus/dietas/kilometraje en € (suelto)
  created_at: string;
}

export interface AsignacionConRelaciones extends Asignacion {
  trabajadores: Pick<Trabajador, "nombre"> | null;
  cargos: Pick<Cargo, "nombre"> | null;
}

export interface ServicioConRelaciones extends Servicio {
  establecimientos: Pick<Establecimiento, "nombre" | "tarifa_hora_cliente"> | null;
  asignaciones: AsignacionConRelaciones[];
}

export interface Contrato {
  id: string;
  numero: string | null;
  establecimiento_id: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  firmado: boolean;
  segurpri: boolean;
  via_publica: boolean;
  aprobado: boolean;
  notas: string | null;
  created_at: string;
}

export interface ContratoConRelaciones extends Contrato {
  establecimientos: Pick<Establecimiento, "nombre"> | null;
}

export interface MovimientoCaja {
  id: string;
  fecha: string;
  concepto: string | null;
  ingreso: number;
  gasto: number;
  created_at: string;
}

export interface Garantia {
  id: string;
  nombre: string | null;
  importe: number;
  fecha_garantia: string | null;
  vencimiento: string | null;
  created_at: string;
}

export interface UsuarioApp {
  id: string;
  nombre: string | null;
  rol: Rol;
}

// ----------------------------------------------------------------------------
// Calculos de dinero. Se calculan al vuelo, nunca se guardan.
// ----------------------------------------------------------------------------

/** Precio/hora que se aplica al cliente: el especial si existe, si no el estandar. */
export function precioAplicado(
  s: Pick<Servicio, "precio_hora_cliente" | "precio_especial">
): number {
  return s.precio_especial != null && s.precio_especial > 0
    ? s.precio_especial
    : s.precio_hora_cliente || 0;
}

export interface TotalesAsignacion {
  coste: number; // horas * coste_hora + extras
  facturacion: number; // horas * precio aplicado
  beneficio: number; // facturacion - coste
}

export function totalesAsignacion(
  a: Pick<
    Asignacion,
    "horas" | "horas_extra" | "precio_hora_extra" | "coste_hora" | "extras"
  >,
  precioHora: number
): TotalesAsignacion {
  const horasNormales = a.horas || 0;
  const horasExtra = a.horas_extra || 0;
  // Coste = horas normales × tarifa del cargo + horas extra × precio extra + plus
  const coste =
    horasNormales * (a.coste_hora || 0) +
    horasExtra * (a.precio_hora_extra || 0) +
    (a.extras || 0);
  // Facturación: el cliente paga TODAS las horas trabajadas (normales + extra).
  const facturacion = (horasNormales + horasExtra) * (precioHora || 0);
  return { coste, facturacion, beneficio: facturacion - coste };
}

/** Suma de coste, facturacion, beneficio, horas y margen de un servicio. */
export function totalesServicio(
  servicio: Pick<Servicio, "precio_hora_cliente" | "precio_especial">,
  asignaciones: Pick<
    Asignacion,
    "horas" | "horas_extra" | "precio_hora_extra" | "coste_hora" | "extras"
  >[]
): TotalesAsignacion & { margen: number; horas: number } {
  const precio = precioAplicado(servicio);
  const t = asignaciones.reduce(
    (acc, a) => {
      const x = totalesAsignacion(a, precio);
      acc.coste += x.coste;
      acc.facturacion += x.facturacion;
      acc.beneficio += x.beneficio;
      acc.horas += (a.horas || 0) + (a.horas_extra || 0);
      return acc;
    },
    { coste: 0, facturacion: 0, beneficio: 0, horas: 0 }
  );
  const margen = t.facturacion > 0 ? t.beneficio / t.facturacion : 0;
  return { ...t, margen };
}
