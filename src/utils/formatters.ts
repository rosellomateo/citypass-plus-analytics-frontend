// src/utils/formatters.ts

/** Formatea un número con separador de miles */
export function formatNumber(n: number): string {
  return n.toLocaleString('es-AR');
}

/** Formatea porcentaje con símbolo */
export function formatPct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

/** Formatea variación con signo y color semántico */
export function formatVariation(v: number): string {
  const sign = v >= 0 ? '+' : '';
  return `${sign}${v.toFixed(1)}%`;
}

/** Formatea latencia en ms o s */
export function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Formatea duración en minutos y segundos */
export function formatDuration(minutes: number): string {
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

/** Trunca texto largo */
export function truncate(text: string, maxLen = 60): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
}

/** Capitaliza primera letra */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
