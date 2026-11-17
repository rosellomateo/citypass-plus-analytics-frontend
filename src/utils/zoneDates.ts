import type { PublicEventZone } from '../api/types';
import type { DashboardFilters } from '../types';
import { getDateRangeBounds } from './dates';

export function eventTime(value?: string | null) {
  const millis = value ? Date.parse(value) : NaN;
  return Number.isFinite(millis) ? millis : undefined;
}

export function getZonePeriod(filters: DashboardFilters) {
  const now = new Date();
  return { now, ...getDateRangeBounds(filters, now) };
}

export function getPublicEventStatus(event: PublicEventZone, now: number): string | null {
  const source = event.estado?.trim().toUpperCase();
  if (source === 'CANCELADO' || source === 'CANCELADA') return 'Cancelado';
  if (source === 'SUSPENDIDO' || source === 'SUSPENDIDA') return 'Suspendido';
  if (source === 'FINALIZADO' || source === 'FINALIZADA') return 'Finalizado';
  const start = eventTime(event.inicio);
  const end = eventTime(event.fin);
  if (end !== undefined && end <= now) return 'Finalizado';
  if (start !== undefined && start > now) return 'Programado';
  if (source === 'EN_CURSO' || source === 'ACTIVO' || source === 'ACTIVE') return 'En curso';
  if (start !== undefined && end !== undefined) return 'En curso';
  return source ? source.replaceAll('_', ' ') : null;
}
