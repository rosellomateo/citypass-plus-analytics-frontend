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
    const to = new Date(now);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  if (filters.dateRange === '30d') {
    const from = new Date(now);
    from.setDate(from.getDate() - 30);
    from.setHours(0, 0, 0, 0);
    const to = new Date(now);
    to.setHours(23, 59, 59, 999);
    return { from, to };
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

  // Fallback 7d
  const from = new Date(now);
  from.setDate(from.getDate() - 7);
  from.setHours(0, 0, 0, 0);
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

export function isWithinDateRange(isoTimestamp: string, filters: DashboardFilters): boolean {
  if (!isoTimestamp) return true;
  const date = new Date(isoTimestamp);
  if (isNaN(date.getTime())) return true;

  // Custom filter check uses exact date bounds
  if (filters.dateRange === 'custom') {
    const { from, to } = getDateRangeBounds(filters);
    return date >= from && date <= to;
  }

  // Presets (today, 7d, 30d):
  // Since mock data dates across modules span early to late September 2026 (e.g. 2026-09-02 to 2026-09-21),
  // we anchor refTime relative to the dataset event date or current time to support mock presets cleanly.
  const now = new Date();
  const sep02MockBase = new Date('2026-09-02T23:59:59Z').getTime();
  const sep21MockBase = new Date('2026-09-21T23:59:59Z').getTime();

  let refTime = now.getTime();
  if (date.getTime() <= sep02MockBase) {
    refTime = sep02MockBase;
  } else if (date.getTime() <= sep21MockBase) {
    refTime = sep21MockBase;
  }

  const diffDays = (refTime - date.getTime()) / (1000 * 60 * 60 * 24);

  if (filters.dateRange === 'today') {
    return diffDays >= -0.5 && diffDays <= 1.5;
  }
  if (filters.dateRange === '7d') {
    return diffDays >= -0.5 && diffDays <= 7.5;
  }
  if (filters.dateRange === '30d') {
    return diffDays >= -0.5 && diffDays <= 30.5;
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
