import { describe, expect, it } from 'vitest';
import { getDashboardsForProfile } from '../auth/authorization';

describe('LDAP profile menu visibility', () => {
  it.each(['admin', 'analitica-urbana'])('shows every dashboard to Analítica with %s', (group) => {
    expect(getDashboardsForProfile('analitica', [group])).toEqual([
      'overview', 'claims', 'emergencies', 'mobility', 'culture', 'waste', 'login',
    ]);
  });

  it.each([
    ['reclamos', 'claims'], ['emergencias', 'emergencies'], ['movilidad', 'mobility'],
    ['espacios', 'culture'], ['residuos', 'waste'], ['admin', 'login'], ['login', 'login'],
  ])('limits the %s module to its own dashboard', (module, area) => {
    for (const group of ['admin', 'delegados', 'operadores']) {
      expect(getDashboardsForProfile(module, [group])).toEqual([area]);
    }
  });

  it.each(['soporte-n2', 'guardia-finde'])('keeps the additional Reclamos role %s scoped to Reclamos', (group) => {
    expect(getDashboardsForProfile('reclamos', [group])).toEqual(['claims']);
    expect(getDashboardsForProfile('residuos', [group])).toEqual([]);
  });

  it.each([
    ['analitica', []], ['analitica', ['operadores']], ['reclamos', []], ['reclamos', ['unknown']],
    ['reclamos', ['analitica-urbana']], ['unknown', ['admin']], ['__proto__', ['admin']],
    ['eda', ['admin']], ['constructor', ['admin']], ['reclamos', ['ADMIN']],
  ] as const)('grants no menu access to %s with %j', (module, groups) => {
    expect(getDashboardsForProfile(module, groups)).toEqual([]);
  });
});
