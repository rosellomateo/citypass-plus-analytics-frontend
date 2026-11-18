import { DOMAIN_NAV_ITEMS } from '../config/domains';
import type { Domain } from '../types';

export type ProtectedArea = Domain | 'overview';

export const OVERVIEW = { area: 'overview', label: 'Analítica Urbana', path: '/analytics' } as const;

const AREAS = [OVERVIEW, ...DOMAIN_NAV_ITEMS.map(({ domain, path }) => ({ area: domain, path }))];


const MODULE_AREAS: Record<string, ProtectedArea> = {
  admin: 'login',
  login: 'login',
  identidad: 'login',
  ldap: 'login',
  dap: 'login',
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

export function getDefaultAuthorizedPath(dashboards: readonly string[], initialDashboard?: string): string | undefined {
  const initial = AREAS.find(({ area }) => area === initialDashboard && canAccessArea(dashboards, area));
  return initial?.path ?? AREAS.find(({ area }) => canAccessArea(dashboards, area))?.path;
}
