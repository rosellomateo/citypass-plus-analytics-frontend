import { DOMAIN_NAV_ITEMS } from '../config/domains';
import type { Domain } from '../types';

export type ProtectedArea = Domain | 'overview';

export const OVERVIEW = { area: 'overview', label: 'Analítica Urbana', path: '/analytics' } as const;

const AREAS = [OVERVIEW, ...DOMAIN_NAV_ITEMS.map(({ domain, path }) => ({ area: domain, path }))];

export const LOGIN_TEAMS = [
  { area: 'overview', label: OVERVIEW.label, clientId: import.meta.env.VITE_AUTH_CLIENT_ID?.trim() || 'citypass-analitica-web' },
  { area: 'eda', label: 'EDA', clientId: 'citypass-eda-web' },
  { area: 'login', label: 'Login Federado', clientId: import.meta.env.VITE_AUTH_LOGIN_CLIENT_ID?.trim() || 'citypass-admin-web' },
  { area: 'emergencies', label: 'Emergencias', clientId: 'citypass-emergencias-web' },
  { area: 'culture', label: 'Espacios Públicos y Cultura', clientId: 'citypass-espacios-web' },
  { area: 'mobility', label: 'Movilidad', clientId: 'citypass-movilidad-web' },
  { area: 'claims', label: 'Reclamos', clientId: 'citypass-reclamos-web' },
  { area: 'waste', label: 'Residuos', clientId: 'citypass-residuos-web' },
] as const;

export function canAccessArea(dashboards: readonly string[], area: ProtectedArea): boolean {
  return dashboards.includes(area);
}

export function getDefaultAuthorizedPath(dashboards: readonly string[], initialDashboard?: string): string | undefined {
  const initial = AREAS.find(({ area }) => area === initialDashboard && canAccessArea(dashboards, area));
  return initial?.path ?? AREAS.find(({ area }) => canAccessArea(dashboards, area))?.path;
}
