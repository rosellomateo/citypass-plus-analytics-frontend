import { DOMAIN_NAV_ITEMS } from '../config/domains';
import type { Domain } from '../types';

export type ProtectedArea = Domain | 'overview';

export const OVERVIEW = { area: 'overview', label: 'Analítica Urbana', path: '/analytics' } as const;

const AREAS = [OVERVIEW, ...DOMAIN_NAV_ITEMS.map(({ domain, path }) => ({ area: domain, path }))];

export const LOGIN_TEAMS = [OVERVIEW, ...DOMAIN_NAV_ITEMS.map(({ domain, label }) => ({ area: domain, label }))];

export function canAccessArea(dashboards: readonly string[], area: ProtectedArea): boolean {
  return dashboards.includes(area);
}

export function getDefaultAuthorizedPath(dashboards: readonly string[], initialDashboard?: string): string | undefined {
  const initial = AREAS.find(({ area }) => area === initialDashboard && canAccessArea(dashboards, area));
  return initial?.path ?? AREAS.find(({ area }) => canAccessArea(dashboards, area))?.path;
}
