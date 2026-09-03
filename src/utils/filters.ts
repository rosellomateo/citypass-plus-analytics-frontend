// src/utils/filters.ts
import type { DashboardFilters } from '../types';
import { isWithinDateRange } from './dates';

/**
 * Filtra un array de objetos que tienen `timestamp` por el rango de fechas
 * del objeto DashboardFilters. Agnóstico de dominio.
 */
export function filterByDateRange<T extends { timestamp?: string; createdAt?: string; detectedAt?: string; updatedAt?: string }>(
  items: T[],
  filters: DashboardFilters
): T[] {
  if (filters.dateRange === '7d' || filters.dateRange === '30d' || filters.dateRange === 'today' || filters.dateRange === 'custom') {
    return items.filter((item) => {
      const ts = item.timestamp ?? item.createdAt ?? item.detectedAt ?? item.updatedAt;
      if (!ts) return true;
      return isWithinDateRange(ts, filters);
    });
  }
  return items;
}

/**
 * Filtra por zona (campo `zone`) si el filtro está presente.
 */
export function filterByZone<T extends { zone?: string }>(
  items: T[],
  filters: DashboardFilters
): T[] {
  if (!filters.zone || filters.zone === 'all') return items;
  return items.filter((item) => item.zone === filters.zone);
}

/**
 * Filtra por status si el filtro está presente.
 */
export function filterByStatus<T extends { status?: string }>(
  items: T[],
  filters: DashboardFilters
): T[] {
  if (!filters.status || filters.status === 'all') return items;
  return items.filter((item) => item.status === filters.status);
}

/**
 * Filtra por categoría si el filtro está presente.
 */
export function filterByCategory<T extends { category?: string }>(
  items: T[],
  filters: DashboardFilters
): T[] {
  if (!filters.category || filters.category === 'all') return items;
  return items.filter((item) => item.category === filters.category);
}

/**
 * Filtra por severity si el filtro está presente.
 */
export function filterBySeverity<T extends { severity?: string }>(
  items: T[],
  filters: DashboardFilters
): T[] {
  if (!filters.severity || filters.severity === 'all') return items;
  return items.filter((item) => item.severity === filters.severity);
}

/**
 * Filtra por domain si el filtro está presente.
 */
export function filterByDomain<T extends { domain?: string }>(
  items: T[],
  filters: DashboardFilters
): T[] {
  if (!filters.domain || (filters.domain as string) === 'all') return items;
  return items.filter((item) => item.domain === filters.domain);
}

/**
 * Filtra por búsqueda de texto libre en `title`, `description`, `eventType`, `name`.
 */
export function filterBySearch<T extends Record<string, unknown>>(
  items: T[],
  filters: DashboardFilters
): T[] {
  if (!filters.search) return items;
  const q = filters.search.toLowerCase();
  return items.filter((item) => {
    const fields = [item.title, item.description, item.eventType, item.name, item.topic];
    return fields.some((f) => typeof f === 'string' && f.toLowerCase().includes(q));
  });
}
