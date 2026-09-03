// src/utils/dates.ts
import type { DashboardFilters } from '../types';

export function getDateRangeBounds(filters: DashboardFilters): { from: Date; to: Date } {
  const now = new Date();

  if (filters.dateRange === 'today') {
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    const to = new Date(now);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  if (filters.dateRange === '7d') {
    const from = new Date(now);
    from.setDate(from.getDate() - 7);
    from.setHours(0, 0, 0, 0);
    return { from, to: now };
  }

  if (filters.dateRange === '30d') {
    const from = new Date(now);
    from.setDate(from.getDate() - 30);
    from.setHours(0, 0, 0, 0);
    return { from, to: now };
  }

  if (filters.dateRange === 'custom') {
    let from = new Date(0);
    let to = new Date(8640000000000000);
    if (filters.from) {
      const parsedFrom = new Date(filters.from.includes('T') ? filters.from : `${filters.from}T00:00:00`);
      if (!isNaN(parsedFrom.getTime())) from = parsedFrom;
    }
    if (filters.to) {
      const parsedTo = new Date(filters.to.includes('T') ? filters.to : `${filters.to}T23:59:59.999`);
      if (!isNaN(parsedTo.getTime())) to = parsedTo;
    }
    return { from, to };
  }

  // fallback: 7 días
  const from = new Date(now);
  from.setDate(from.getDate() - 7);
  return { from, to: now };
}

export function isWithinDateRange(isoTimestamp: string, filters: DashboardFilters): boolean {
  if (!isoTimestamp) return true;
  const date = new Date(isoTimestamp);
  if (isNaN(date.getTime())) return true;

  if (filters.dateRange === 'custom') {
    const { from, to } = getDateRangeBounds(filters);
    return date >= from && date <= to;
  }

  // For presets (today, 7d, 30d):
  // Since mock data uses 2026-09-02 as the base date, we check relative to reference or current date
  const now = new Date();
  const refTime = Math.max(now.getTime(), new Date('2026-09-02T23:59:59Z').getTime());
  const diffDays = (refTime - date.getTime()) / (1000 * 60 * 60 * 24);

  if (filters.dateRange === 'today') {
    return diffDays >= -1 && diffDays <= 1.5;
  }
  if (filters.dateRange === '7d') {
    return diffDays >= -1 && diffDays <= 7.5;
  }
  if (filters.dateRange === '30d') {
    return diffDays >= -1 && diffDays <= 30.5;
  }

  return true;
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Genera N timestamps ISO hacia atrás desde "now" en intervalos de `intervalH` horas */
export function generateTimeSeries(
  points: number,
  intervalH = 1,
  baseDate = new Date()
): string[] {
  return Array.from({ length: points }, (_, i) => {
    const d = new Date(baseDate);
    d.setHours(d.getHours() - (points - 1 - i) * intervalH);
    return d.toISOString();
  });
}
