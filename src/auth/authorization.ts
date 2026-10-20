import type { CityPassClaims } from './session';
import type { Domain } from '../types';

export type ProtectedArea = Domain | 'overview';

/** Explicit local interpretation of IdP groups. Unknown groups grant nothing. */
const GROUPS_BY_AREA: Record<ProtectedArea, readonly string[]> = {
  overview: ['analitica-urbana'],
  emergencies: ['analitica-urbana', 'seguridad-urbana'],
  culture: ['analitica-urbana', 'cultura'],
  mobility: ['analitica-urbana', 'movilidad-urbana'],
  claims: ['analitica-urbana', 'reclamos'],
  waste: ['analitica-urbana', 'residuos'],
};

const AREA_PATHS: Array<[ProtectedArea, string]> = [
  ['overview', '/analytics'],
  ['emergencies', '/analytics/emergencies'],
  ['culture', '/analytics/culture'],
  ['mobility', '/analytics/mobility'],
  ['claims', '/analytics/claims'],
  ['waste', '/analytics/waste'],
];

export function canAccessArea(claims: CityPassClaims | undefined, area: ProtectedArea): boolean {
  return Boolean(claims && GROUPS_BY_AREA[area].some((group) => claims.groups.includes(group)));
}

export function getDefaultAuthorizedPath(claims: CityPassClaims | undefined): string | undefined {
  return AREA_PATHS.find(([area]) => canAccessArea(claims, area))?.[1];
}

export function hasAnyAnalyticsAccess(claims: CityPassClaims | undefined): boolean {
  return AREA_PATHS.some(([area]) => canAccessArea(claims, area));
}
