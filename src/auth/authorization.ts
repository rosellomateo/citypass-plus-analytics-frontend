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

const MODULE_AREAS: Record<string, ProtectedArea> = {
  eda: 'eda',
  admin: 'login',
  login: 'login',
  emergencias: 'emergencies',
  espacios: 'culture',
  movilidad: 'mobility',
  reclamos: 'claims',
  residuos: 'waste',
};

/** Menu visibility only: each data endpoint still enforces its own permissions. */
export function getDashboardsForProfile(module: string, groups: readonly string[]): ProtectedArea[] {
  if (module === 'analitica') {
    return groups.some((group) => group === 'admin' || group === 'analitica-urbana')
      ? AREAS.map(({ area }) => area)
      : [];
  }
  const area = Object.hasOwn(MODULE_AREAS, module) ? MODULE_AREAS[module] : undefined;
  if (!area) return [];
  const allowedGroups = module === 'reclamos'
    ? ['admin', 'delegados', 'operadores', 'soporte-n2', 'guardia-finde']
    : ['admin', 'delegados', 'operadores'];
  return groups.some((group) => allowedGroups.includes(group)) ? [area] : [];
}

export function canAccessArea(dashboards: readonly string[], area: ProtectedArea): boolean {
  return dashboards.includes(area);
}

export function getDefaultAuthorizedPath(dashboards: readonly string[]): string | undefined {
  return AREAS.find(({ area }) => canAccessArea(dashboards, area))?.path;
}
