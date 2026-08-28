// src/utils/dates.ts
import type { DashboardFilters } from '../types';

export function getDateRangeBounds(filters: DashboardFilters): { from: Date; to: Date } {
  const now = new Date();

  if (filters.dateRange === 'today') {
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    return { from, to: now };
  }

  if (filters.dateRange === '7d') {
    const from = new Date(now);
    from.setDate(from.getDate() - 7);
    return { from, to: now };
  }

  if (filters.dateRange === '30d') {
    const from = new Date(now);
    from.setDate(from.getDate() - 30);
    return { from, to: now };
  }

  if (filters.dateRange === 'custom' && filters.from && filters.to) {
    return { from: new Date(filters.from), to: new Date(filters.to) };
  }

  // fallback: 7 días
  const from = new Date(now);
  from.setDate(from.getDate() - 7);
  return { from, to: now };
}

export function isWithinDateRange(isoTimestamp: string, filters: DashboardFilters): boolean {
  const { from, to } = getDateRangeBounds(filters);
  const date = new Date(isoTimestamp);
  return date >= from && date <= to;
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
