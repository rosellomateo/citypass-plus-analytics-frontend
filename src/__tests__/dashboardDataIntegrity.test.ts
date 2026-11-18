import { afterEach, expect, it, vi } from 'vitest';
import { analyticsApi } from '../api/analyticsApi';
import type { CultureActivityApiRecord, EmergencyApiRecord, WasteInterventionEvent } from '../api/types';
import { getApiClaimsAnalyticsData, getApiCultureAnalyticsData, mapEmergencyApiData } from '../dataSources/apiAnalyticsDataSource';
import { affectedInterventions } from '../utils/wasteInterventions';
import { getDateRangeBounds, isWithinDateRange } from '../utils/dates';

const filters = { dateRange: 'all' as const };
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

it('preserves absent claim times through the API adapter instead of treating them as zero', async () => {
  vi.stubEnv('VITE_DATA_SOURCE', 'api');
  const row = { barrio: 'Flores', categoria: 'TRANSITO', prioridad: 'ALTA', origenClasificacion: 'MANUAL',
    estado_actual: 'RESUELTO', row_count: 2, tiempo_prom_hasta_estado_actual: 10, fecha_snapshot: '2026-11-18' };
  vi.spyOn(analyticsApi, 'getClaims').mockResolvedValue({ datos: [row,
    { ...row, estado_actual: 'CERRADO', row_count: 100, tiempo_prom_hasta_estado_actual: null },
  ], informe: {} as never });
  const result = await getApiClaimsAnalyticsData(filters);
  expect(result.totalClaims).toBe(102);
  expect(result.avgResolutionTimeHours).toBe(10);
  expect(result.records[1].tiempo_prom_hasta_estado_actual).toBeNull();
});

it('unifies repeated and damaged category labels without changing the received records or totals', async () => {
  vi.stubEnv('VITE_DATA_SOURCE', 'api');
  const datos: CultureActivityApiRecord[] = ['Música', 'M�sica', ' MUSICA ', 'CULTURAL', 'Cultura', 'Arte'].map((categoria) => ({
    categoria, organizadorTipo: 'CIUDADANO', cantidadActividades: 2,
    cantidadMasivas: 0, cantidadAfectadasPorClima: null, fecha_snapshot: '2026-09-01',
  }));
  const original = structuredClone(datos);
  vi.spyOn(analyticsApi, 'getCulture').mockResolvedValue({ datos, informe: {} as never });
  const result = await getApiCultureAnalyticsData(filters);
  expect(result.activities?.byCategory).toEqual([
    { category: 'Música', count: 6 }, { category: 'Cultura', count: 4 }, { category: 'Arte', count: 2 },
  ]);
  expect(result.activities?.total).toBe(12);
  expect(result.activities?.byOrganizer).toEqual([{ organizer: 'CIUDADANO', count: 12 }]);
  expect(datos).toEqual(original);
});

it('separates bicycle and road incidents and weights resolution means using only available data', () => {
  const row: EmergencyApiRecord = { estado_actual: 'CERRADA', prioridad: 'Alta', categoria: 'MEDICA',
    cantidadEmergencias: 2, causaTipo: 'MOVILIDAD_BICICLETA', tiempoPromRespuestaDespacho: 1,
    tiempoPromRespuestaLugar: null, tiempoPromResolucion: 10, fecha_snapshot: '2026-09-01' };
  const result = mapEmergencyApiData([row,
    { ...row, causaTipo: 'INCIDENTE_VIAL', cantidadEmergencias: 6, tiempoPromResolucion: 30 },
    { ...row, causaTipo: 'RECLAMO', cantidadEmergencias: 100, tiempoPromResolucion: null },
  ], filters);
  expect(result.resolutionByCategory).toEqual([{ etiqueta: 'MEDICA', valor: 25 }]);
  expect(result.emergenciesByCause).toEqual(expect.arrayContaining([
    { etiqueta: 'Viajes en bicicleta', valor: 2 }, { etiqueta: 'Incidente vial', valor: 6 },
    { etiqueta: 'Reclamos', valor: 100 },
  ]));
  expect(mapEmergencyApiData([{ ...row, tiempoPromResolucion: undefined }], filters).resolutionByCategory).toEqual([]);
});

it('deduplicates affected stops, ignores cancelled stops and never turns trucks into routes', () => {
  const event: WasteInterventionEvent = { metadata: { eventId: 'original', eventType: 'com.citypass.residuos.IntervencionActualizada' },
    data: { intervencionId: 'parada-1', camionId: 'AB123CD', estadoNuevo: 'AFECTADA', causaTipo: 'INCIDENTE_VIAL', updatedAt: '2026-11-16T02:40:00Z' } };
  const rows = affectedInterventions([event, { ...event, metadata: { ...event.metadata, eventId: 'retry' } },
    { ...event, data: { ...event.data, intervencionId: 'parada-2' } },
    { ...event, data: { ...event.data, intervencionId: 'parada-3', estadoNuevo: 'CANCELADA' } },
  ]);
  expect(rows).toHaveLength(2);
  expect(rows[0]).not.toHaveProperty('recorrido_id');
  expect(rows[0]).not.toHaveProperty('zona');
});

it('shows the complete published cut without the old seven-day restriction', () => {
  expect(isWithinDateRange('2026-09-01', filters)).toBe(true);
  const { from, to } = getDateRangeBounds(filters, new Date('2026-11-18'));
  expect(+from).toBe(0);
  expect(+to).toBeGreaterThan(+new Date('2026-11-18'));
});
