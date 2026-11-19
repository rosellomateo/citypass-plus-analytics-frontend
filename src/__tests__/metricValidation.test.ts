import { expect, it } from 'vitest';
import type { BackendAnalyticsRecord, BackendMobilityRecord } from '../types';
import type { WasteInterventionEvent } from '../api/types';
import { getClaimsAnalyticsData } from '../services/claimsService';
import { getAffectationsByCause, getTripsByCause } from '../services/mobilityService';
import { countRoadAffectedInterventions } from '../utils/wasteInterventions';

it('classifies actual claim states and weights resolution times only over resolved or closed claims', async () => {
  const base: BackendAnalyticsRecord = { barrio: 'Flores', categoria: 'TRANSITO', prioridad: 'ALTA',
    origenClasificacion: 'MANUAL', estado_actual: 'RESUELTO', row_count: 2,
    tiempo_prom_hasta_estado_actual: 10, fecha_snapshot: '2026-11-18' };
  const records = [base,
    { ...base, estado_actual: 'CERRADO', row_count: 1, tiempo_prom_hasta_estado_actual: 40 },
    { ...base, estado_actual: 'ASIGNADO', row_count: 4, tiempo_prom_hasta_estado_actual: 1000 },
    { ...base, estado_actual: 'EN_PROCESO', row_count: 3 },
    { ...base, estado_actual: 'EN_REVISION', row_count: 1 },
    { ...base, estado_actual: 'RECIBIDO', row_count: 5 },
    { ...base, estado_actual: 'RECHAZADO', row_count: 6 },
    { ...base, estado_actual: 'CERRADO', row_count: 50, tiempo_prom_hasta_estado_actual: null },
  ];
  const original = structuredClone(records);
  const result = await getClaimsAnalyticsData({ dateRange: 'all' }, records);
  expect(result.totalClaims).toBe(72);
  expect(result.claimsByStatus).toEqual([
    { status: 'CREADO', count: 5 }, { status: 'EN CURSO', count: 8 },
    { status: 'CERRADO', count: 53 }, { status: 'CANCELADO', count: 6 },
  ]);
  expect(result.avgResolutionTimeHours).toBe(20);
  expect(result.avgResolutionByCategory).toEqual([{ category: 'TRANSITO', hours: 20 }]);
  expect(records).toEqual(original);
});

it('keeps NORMAL out of station affectations but counts it as finished trips, without modifying rows', () => {
  const base: BackendMobilityRecord = { causaTipo: 'INCIDENTE_VIAL', cantidadAfectaciones: 12,
    estacionesAfectadasDistintas: 12, cantidadBloqueadas: 1, estacionesBloqueadasDistintas: 1,
    cantidadPreventivas: 0, cantidadRestauradas: 8, cantidadViajesInterrumpidos: 12, fecha_snapshot: '2026-11-18' };
  const normal: BackendMobilityRecord = { ...base, causaTipo: 'NORMAL', cantidadAfectaciones: 0,
    estacionesAfectadasDistintas: 0, cantidadBloqueadas: 0, estacionesBloqueadasDistintas: 0,
    cantidadRestauradas: 0, cantidadViajesInterrumpidos: 36 };
  const records = [base, normal];
  const original = structuredClone(records);

  expect(getAffectationsByCause(records).map(({ causa }) => causa)).toEqual(['INCIDENTE_VIAL']);
  expect(getTripsByCause(records)).toEqual([
    { causa: 'NORMAL', etiqueta: 'Finalizados normalmente', viajes: 36 },
    { causa: 'INCIDENTE_VIAL', etiqueta: 'Incidente vial', viajes: 12 },
  ]);
  expect(records).toEqual(original);
});

it('separates waste programming causes from affection causes and counts stops rather than trucks or retries', () => {
  const event: WasteInterventionEvent = {
    metadata: { eventType: 'com.citypass.residuos.IntervencionActualizada', eventId: 'e1' },
    data: { intervencionId: 'p1', camionId: 'truck1', estadoNuevo: 'AFECTADA',
      causaProgramada: 'EVENTO_PUBLICO', causaTipoAfectacion: 'INCIDENTE_VIAL', updatedAt: '2026-11-16T02:40:00Z' },
  };
  const events = [event,
    { ...event, metadata: { ...event.metadata, eventId: 'retry' } },
    { ...event, data: { ...event.data, intervencionId: 'p2' } },
    { ...event, data: { ...event.data, intervencionId: 'cancelled', estadoNuevo: 'CANCELADA' } },
    { ...event, data: { ...event.data, intervencionId: 'programming-only', causaProgramada: 'INCIDENTE_VIAL', causaTipoAfectacion: null } },
    { ...event, data: { ...event.data, intervencionId: 'explicit-null', causaTipoAfectacion: null, causaTipo: 'INCIDENTE_VIAL' } },
  ];
  const original = structuredClone(events);
  expect(countRoadAffectedInterventions(events)).toBe(2);
  expect(events).toEqual(original);
  expect(countRoadAffectedInterventions([{ ...event, data: { ...event.data, causaTipoAfectacion: undefined, causaTipo: 'INCIDENTE_VIAL' } }])).toBe(1);
});
