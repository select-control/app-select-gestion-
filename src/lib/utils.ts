import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Une clases de Tailwind de forma segura (evita conflictos). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calcula las horas totales entre una hora de inicio y una de fin.
 * Formato esperado: "HH:MM" o "HH:MM:SS".
 * Si la hora de fin es menor que la de inicio, se entiende que el
 * turno cruza la medianoche (turno de noche) y se suman 24 horas.
 */
export function calcularHoras(horaInicio: string, horaFin: string): number {
  const [hi, mi] = horaInicio.split(":").map(Number);
  const [hf, mf] = horaFin.split(":").map(Number);

  const inicioMin = hi * 60 + mi;
  let finMin = hf * 60 + mf;

  if (finMin <= inicioMin) {
    finMin += 24 * 60; // cruza medianoche
  }

  const horas = (finMin - inicioMin) / 60;
  return Math.round(horas * 100) / 100;
}

/** Formatea un numero como euros, p. ej. 1234.5 -> "1.234,50 €". */
export function formatoEuros(valor: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(valor || 0);
}

/** Formatea un numero de horas, p. ej. 8.5 -> "8,5 h". */
export function formatoHoras(valor: number): string {
  return `${new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 2,
  }).format(valor || 0)} h`;
}
