import { MantineProvider } from '@mantine/core';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { analyticsApi } from '../api/analyticsApi';
import type { CultureActivityApiRecord, CrossModuleResponse, EmergencyApiRecord } from '../api/types';
import { getApiClaimsAnalyticsData, getApiCultureAnalyticsData, mapEmergencyApiData } from '../dataSources/apiAnalyticsDataSource';
import { getClaimsByCategoryFiltered } from '../services/claimsService';
import { auditedClaimsImpact } from '../utils/impactMetrics';
import { useCultureData } from '../hooks/useCultureData';
import { useDashboardImpact } from '../hooks/useDashboardImpact';
import { CultureDashboard } from '../pages/CultureDashboard';
import { DashboardImpactCards } from '../components/common/DashboardImpactCards';
import { WasteAffected, WasteAffectedMetric } from '../components/waste/WasteAffected';

vi.mock('../hooks/useCultureData', () => ({ useCultureData: vi.fn() }));
vi.mock('../hooks/useDashboardImpact', () => ({ useDashboardImpact: vi.fn() }));
vi.mock('../components/charts/BarChart', () => ({ BarChart: () => null }));
vi.mock('../components/charts/PieChart', () => ({ PieChart: () => null }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
const filters = { dateRange: 'all' as const };
const report: CrossModuleResponse = { fecha_snapshot: '2026-11-18', datos: [], version_cultura: 2 };

function activityRows(): CultureActivityApiRecord[] {
  const base = { estado_actual: 'PROGRAMADA', categoria: 'CULTURAL', causaTipo: null,
    barrio: 'Flores', organizadorTipo: null, cantidadActividades: 0, cantidadMasivas: 0,
    cantidadAfectadasPorClima: 0, fecha_snapshot: '2026-11-18' };
  return [
    { ...base, estado_actual: 'CANCELADA', causaTipo: 'EVENTO_CLIMATICO', cantidadActividades: 20, cantidadMasivas: 10, cantidadAfectadasPorClima: 20, organizadorTipo: 'CIUDAD' },
    { ...base, estado_actual: 'SUSPENDIDA', causaTipo: 'EVENTO_CLIMATICO', cantidadActividades: 10, cantidadMasivas: 2, cantidadAfectadasPorClima: 10 },
    { ...base, categoria: 'Música', causaTipo: 'EVENTO_CLIMATICO', cantidadActividades: 7, cantidadAfectadasPorClima: 7, organizadorTipo: 'CIUDADANO' },
    { ...base, causaTipo: 'RECLAMO', cantidadActividades: 16, cantidadMasivas: 8, organizadorTipo: 'CIUDAD' },
    { ...base, causaTipo: 'INCIDENTE_VIAL', cantidadActividades: 16, cantidadMasivas: 6, organizadorTipo: 'CIUDAD' },
    { ...base, causaTipo: 'ACCIDENTE_VIAL', cantidadActividades: 12, cantidadMasivas: 4, organizadorTipo: 'CIUDADANO' },
    { ...base, cantidadActividades: 24, cantidadMasivas: 10, organizadorTipo: 'CIUDAD' },
    { ...base, cantidadActividades: 56, cantidadMasivas: 16 },
  ];
}

it('calculates the six culture cases from activity counts and retains the full denominator', async () => {
  vi.stubEnv('VITE_DATA_SOURCE', 'api');
  const rows = activityRows();
  const original = structuredClone(rows);
  vi.spyOn(analyticsApi, 'getCulture').mockResolvedValue({ datos: rows, informe: undefined as never });
  const result = await getApiCultureAnalyticsData(filters);
  expect(result.activities?.total).toBe(161);
  expect(result.activities?.affectedByClimate).toBe(37);
  const values = Object.fromEntries(result.activities!.caseMetrics!.map(({ id, valor }) => [id, valor]));
  expect(values).toEqual({ c1: 30, c2: 16, c3: 56, c4: 16, c5: 12, c6: 19 });
  expect(result.activities!.caseMetrics!.find(({ id }) => id === 'c6')!.detalle).toEqual([
    { etiqueta: 'Total de actividades', valor: 161 }, { etiqueta: 'Organizadas por la ciudad', valor: 76 },
    { etiqueta: 'Sin organizador informado', valor: 66 },
  ]);
  expect(rows).toEqual(original);

  vi.mocked(useCultureData).mockReturnValue({ data: result, loading: false, error: null, refetch: vi.fn() } as never);
  vi.mocked(useDashboardImpact).mockReturnValue({ data: { ...report, datos: [{ id: 'c2', valor: 999 }],
    eventos_publicos: [{ evento_id: 'e1', emergencias: 3, ultimo_vinculo: '2026-11-18' }] }, loading: false } as never);
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  render(<MantineProvider env="test"><MemoryRouter><CultureDashboard /></MemoryRouter></MantineProvider>);
  for (const [label, value] of [['Eventos culturales cancelados por clima', '30'], ['Actividades afectadas por reclamos', '16'],
    ['Actividades masivas creadas (capacidad de 500 o más)', '56'], ['Actividades afectadas por incidentes viales', '16'],
    ['Actividades modificadas por accidentes viales', '12'], ['Actividades organizadas por ciudadanos frente al total', '19']]) {
    expect(screen.getByRole('article', { name: `KPI: ${label}` })).toHaveTextContent(value);
  }
  expect(screen.getByText('Causas de afecto')).toBeInTheDocument();
  expect(screen.queryByText('Eventos públicos y sus afectaciones')).not.toBeInTheDocument();
  expect(screen.queryByText('Impacto por evento público')).not.toBeInTheDocument();
  expect(screen.queryByText('Reservas Confirmadas')).not.toBeInTheDocument();
  expect(screen.queryByText('Eventos públicos con emergencias vinculadas')).not.toBeInTheDocument();
});

it('separates missing emergency states, counts preventive public events and shows proven zeroes', () => {
  const base: EmergencyApiRecord = { estado_actual: 'CERRADA', prioridad: 'ALTA', categoria: 'MEDICA',
    causaTipo: null, cantidadEmergencias: 139, tiempoPromRespuestaDespacho: null, tiempoPromRespuestaLugar: null, fecha_snapshot: '2026-11-18' };
  const rows = [base, { ...base, causaTipo: 'EVENTO_PUBLICO', categoria: 'PREVENTIVA', cantidadEmergencias: 28 },
    { ...base, estado_actual: 'PENDIENTE', cantidadEmergencias: 11 },
    { ...base, estado_actual: null, cantidadEmergencias: 1 }];
  const result = mapEmergencyApiData(rows, filters);
  expect(result).toMatchObject({ totalEmergencies: 179, closedCount: 167, activeCount: 11, unknownStateCount: 1 });
  expect(result.caseMetrics).toEqual(expect.arrayContaining([{ id: 'c3', valor: 28 }, { id: 'c4', valor: 0 }, { id: 'c4b', valor: 0 }]));
  render(<DashboardImpactCards area="emergencies" data={report} fallbackMetrics={result.caseMetrics} showMissing />);
  expect(screen.getByRole('article', { name: 'KPI: Emergencias preventivas por eventos públicos' })).toHaveTextContent('28');
  expect(screen.getByRole('article', { name: 'KPI: Emergencias por incidentes viales' })).toHaveTextContent('0');
  const withIncident = mapEmergencyApiData([{ ...base, causaTipo: 'INCIDENTE_VIAL', estado_actual: 'DESPACHADA', cantidadEmergencias: 2 }], filters);
  expect(withIncident.caseMetrics?.find(({ id }) => id === 'c4')?.valor).toBe(2);
  expect(withIncident.caseMetrics?.find(({ id }) => id === 'c4b')).toBeUndefined();
});

it('uses the bicycle link rather than EMERGENCIA and compares only unlinked road categories', async () => {
  vi.stubEnv('VITE_DATA_SOURCE', 'api');
  const base = { barrio: 'Flores', categoria: 'OTROS', prioridad: 'ALTA', origenClasificacion: 'MANUAL', estado_actual: 'RECIBIDO',
    row_count: 2, tiempo_prom_hasta_estado_actual: null, fecha_snapshot: '2026-11-18', causaTipo: 'RECLAMO', vinculadoEmergenciaBici: true };
  const rows = [base, { ...base, categoria: 'BACHES', row_count: 10, vinculadoEmergenciaBici: false },
    { ...base, categoria: 'TRANSITO', row_count: 8, vinculadoEmergenciaBici: false },
    { ...base, categoria: 'ALUMBRADO', causaTipo: 'EMERGENCIA', row_count: 36, vinculadoEmergenciaBici: false },
    { ...base, categoria: ' texto ', row_count: 1, vinculadoEmergenciaBici: false }];
  const original = structuredClone(rows);
  vi.spyOn(analyticsApi, 'getClaims').mockResolvedValue({ datos: rows, informe: {} as never });
  const result = await getApiClaimsAnalyticsData(filters);
  expect(result.totalClaims).toBe(57);
  expect(result.bicycleComparison).toEqual({ linked: 2, otherRoad: 18 });
  expect(result.availableCategories).not.toContain('TEXTO');
  for (const filter of ['Todos', 'creado']) expect(getClaimsByCategoryFiltered(result.records, filter).map(({ category }) => category)).not.toContain('TEXTO');
  const oldReport = { ...report, datos: [{ id: 'c5', valor: 99, detalle: [{ etiqueta: 'Otras causas', valor: 55 }] }] };
  const audited = auditedClaimsImpact(oldReport, result.bicycleComparison)!;
  expect(audited.datos).toEqual([{ id: 'c5', valor: 2, detalle: [{ etiqueta: 'Otros reclamos viales', valor: 18 }] }]);
  expect(auditedClaimsImpact(oldReport, undefined)!.datos).toEqual([]);
  vi.mocked(analyticsApi.getClaims).mockResolvedValue({ datos: rows.map((row) => {
    const copy = { ...row };
    Reflect.deleteProperty(copy, 'vinculadoEmergenciaBici');
    return copy;
  }), informe: {} as never });
  expect((await getApiClaimsAnalyticsData(filters)).bicycleComparison).toBeUndefined();
  expect(rows).toEqual(original);
});

it('removes the waste route table and its link even when a source supplies detail rows', () => {
  const data: CrossModuleResponse = { ...report, afectaciones: { fecha_snapshot: '2026-11-18',
    recorridos_eventos: [{ recorrido_id: 'r1', evento_id: 'e1', recorrido: 'Circuito', nombre_evento: 'Festival' }] },
    resumen_gold: [{ id: 'waste-cause', titulo: '', fecha_snapshot: '2026-11-18', puntos: [{ etiqueta: 'Evento público', valor: 28 }] }] };
  render(<><WasteAffectedMetric report={data} /><WasteAffected report={data} zones={[]} /></>);
  expect(screen.getByText('Intervenciones por causa publicada')).toBeInTheDocument();
  expect(screen.queryByText('Eventos que están afectando los recorridos')).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Ver recorridos afectados' })).not.toBeInTheDocument();
});

it('includes unclassified emergencies in every distribution and reads criticality and circulation independently', () => {
  const base: EmergencyApiRecord = { estado_actual: 'DESCARTADA', categoria: null, prioridad: 'CRITICA', causaTipo: null,
    cantidadEmergencias: 70, criticidadAfectada: 0, afectaCirculacion: null,
    tiempoPromRespuestaDespacho: null, tiempoPromRespuestaLugar: null, fecha_snapshot: '2026-11-19' };
  const rows = [base, { ...base, estado_actual: 'DESPACHADA', categoria: 'PREVENTIVA', prioridad: 'BAJA', causaTipo: 'EVENTO_PUBLICO',
    cantidadEmergencias: 3, afectaCirculacion: true, tiempoPromRespuestaDespacho: 10, tiempoPromRespuestaLugar: 20 },
    { ...base, estado_actual: null, categoria: 'Ambulancia', prioridad: 'Medio', cantidadEmergencias: 1, afectaCirculacion: false, criticidadAfectada: 1 },
    { ...base, estado_actual: 'RESUELTA', prioridad: null, cantidadEmergencias: 2 }];
  const original = structuredClone(rows);
  const result = mapEmergencyApiData(rows, filters);
  expect(result.totalEmergencies).toBe(76);
  expect(result.emergenciesByCategoryStacked.reduce((sum, row) => sum + row.total, 0)).toBe(76);
  expect(result.emergenciesByPriority.reduce((sum, row) => sum + row.count, 0)).toBe(76);
  expect(result.emergenciesByCause!.reduce((sum, row) => sum + row.valor, 0)).toBe(76);
  expect(result.emergenciesByCategoryStacked.find(({ category }) => category === 'Sin categoría informada')).toMatchObject({ total: 72, CRITICA: 70, SIN_PRIORIDAD: 2 });
  expect(result.emergenciesByCategoryStacked.find(({ category }) => category === 'Ambulancia')?.MEDIA).toBe(1);
  expect(result.affectedCriticalityCount).toBe(1);
  expect(result.circulationAffectedCount).toBe(3);
  expect(result.circulationUnknownCount).toBe(72);
  expect(result.avgDispatchTimeMinutes).toBe(10);
  expect(result.avgArrivalTimeMinutes).toBe(20);
  const unknownTimes = mapEmergencyApiData([base], filters);
  expect(unknownTimes.avgDispatchTimeMinutes).toBeUndefined();
  expect(unknownTimes.avgArrivalTimeMinutes).toBeUndefined();
  expect(rows).toEqual(original);
});

it('does not confuse cumulative activity counters with distinct activities or current causes', async () => {
  vi.stubEnv('VITE_DATA_SOURCE', 'api');
  const rows: CultureActivityApiRecord[] = [{ estado_actual: 'CANCELADA', categoria: 'CULTURAL', causaTipo: 'EVENTO_CLIMATICO',
    organizadorTipo: 'CIUDAD', cantidadActividades: 1, cantidadMasivas: 0, cantidadAfectadasPorClima: 1,
    totalVecesEventoClimatico: 3, totalVecesReclamo: 2, totalVecesIncidenteVial: 1, totalVecesAccidenteVial: 0, fecha_snapshot: '2026-11-19' }];
  vi.spyOn(analyticsApi, 'getCulture').mockResolvedValue({ datos: rows, informe: undefined as never });
  const result = await getApiCultureAnalyticsData(filters);
  expect(result.activities!.total).toBe(1);
  expect(result.activities!.byCause).toEqual([{ etiqueta: 'Clima', valor: 1 }]);
  expect(result.activities!.cumulativeCauseChanges).toEqual([
    { etiqueta: 'Clima', valor: 3 }, { etiqueta: 'Reclamo', valor: 2 },
    { etiqueta: 'Incidente vial', valor: 1 }, { etiqueta: 'Accidente vial', valor: 0 },
  ]);
  const base: EmergencyApiRecord = { estado_actual: 'CERRADA', prioridad: 'BAJA', categoria: 'PREVENTIVA', causaTipo: 'EVENTO_PUBLICO',
    cantidadEmergencias: 1, tiempoPromRespuestaDespacho: null, tiempoPromRespuestaLugar: null, tiempoPromResolucion: 42,
    fecha_snapshot: '2026-11-19' };
  expect(mapEmergencyApiData([base, { ...base, categoria: 'MEDICA', cantidadEmergencias: 9 }], filters).resolutionByCause)
    .toEqual([{ etiqueta: 'Evento público', valor: 42 }]);
});
