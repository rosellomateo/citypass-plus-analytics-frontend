import type { WasteAlertDetail } from '../types';

export function normalizedSearch(value: string) {
  return value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function visibleStationTrips<T extends { station: string; cantidadViajes: number }>(rows: T[], search: string) {
  const term = normalizedSearch(search);
  return rows.filter((row) => term ? normalizedSearch(row.station).includes(term) : row.cantidadViajes > 3);
}

export function priorityKey(value: string) {
  const key = normalizedSearch(value).toUpperCase();
  return ({ CRITICO: 'CRITICA', ALTO: 'ALTA', MEDIO: 'MEDIA', BAJO: 'BAJA' } as Record<string, string>)[key] ?? key;
}

export const PRIORITY_RANK: Record<string, number> = { CRITICA: 4, ALTA: 3, MEDIA: 2, BAJA: 1 };
export const PRIORITY_COLOR: Record<string, string> = { CRITICA: '#800020', ALTA: '#C83E4D', MEDIA: '#D99838', BAJA: '#4F8A72' };

export function sortAlertDetails(rows: WasteAlertDetail[]) {
  return [...rows].sort((a, b) => (PRIORITY_RANK[priorityKey(b.priority)] ?? 0) - (PRIORITY_RANK[priorityKey(a.priority)] ?? 0)
    || a.zone.localeCompare(b.zone, 'es') || a.alertType.localeCompare(b.alertType, 'es'));
}

export function fillRangeLabel(value: string): string | null {
  const range = value.trim().replace(/\s|%/g, '').replace(/[–—]/g, '-');
  return /^\d+(?:-\d+)?$/.test(range) ? `${range.replace('-', '–')} %` : null;
}

export function alertFillRanges(rows: WasteAlertDetail[], zone: string | null) {
  const ranges = new Map<string, number>();
  for (const row of rows) {
    if (zone && row.zone !== zone) continue;
    const label = fillRangeLabel(row.fillRange);
    if (label) ranges.set(label, (ranges.get(label) ?? 0) + row.alerts);
  }
  return [...ranges].sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([name, value]) => ({ name, value }));
}

export function formatAlertAverage(value: number) {
  return value.toLocaleString('es-AR', { maximumFractionDigits: 2 });
}
