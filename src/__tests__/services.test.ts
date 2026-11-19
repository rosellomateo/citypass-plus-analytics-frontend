// src/__tests__/services.test.ts
import { describe, it, expect } from 'vitest';
import {
  getClaimsAnalyticsData,
  getClaimsByStatusFiltered,
  getClaimsByCategoryFiltered,
  formatClaimCategory,
  mapClaimStatus,
} from '../services/claimsService';
import {
  getEmergencyAnalyticsData,
  getCategoryPriorityDistribution,
} from '../services/emergencyService';
import {
  getMobilityAnalyticsData,
  getFilteredMobilityRecords,
  getAffectationsByCause,
  getTripsByCause,
  causeLabel,
} from '../services/mobilityService';
import { getCultureAnalyticsData } from '../services/cultureService';
import { mockClaimRecords } from '../data/mocks/claims.mock';
import {
  mockEmergenciaCreadaEvents,
  mockEmergenciaPriorizadaEvents,
} from '../data/mocks/emergencies.mock';
import { mockMobilityRecords, mockMobilityLLMReport } from '../data/mocks/mobility.mock';
import type { EmergencyPriority, EmergencyState } from '../types';

const defaultFilters = { dateRange: '7d' as const };

describe('Domain Services Aggregations', () => {
  it('Reclamos service calculates CU-R1 (counts by category/status) and CU-R2 (avg resolution time)', async () => {
    const data = await getClaimsAnalyticsData(defaultFilters, mockClaimRecords);
    expect(data.totalClaims).toBeGreaterThan(0);
    expect(data.claimsByCategory.length).toBeGreaterThan(0);
    expect(data.claimsByStatus.length).toBe(4);
    expect(data.avgResolutionTimeHours).toBeGreaterThanOrEqual(0);
    expect(data.availableCategories.length).toBeGreaterThan(0);
  });

  it('Reclamos service supports local category filtering for status distribution', () => {
    const catFiltered = getClaimsByStatusFiltered(mockClaimRecords, 'ALUMBRADO');
    expect(catFiltered.length).toBe(4);
    const totalCount = catFiltered.reduce((acc, curr) => acc + curr.count, 0);
    const alumbradoTotal = mockClaimRecords
      .filter((e) => formatClaimCategory(e.categoria) === 'ALUMBRADO')
      .reduce((acc, r) => acc + (r.row_count ?? 1), 0);
    expect(totalCount).toBe(alumbradoTotal);

    const emptyFiltered = getClaimsByStatusFiltered(mockClaimRecords, 'NON_EXISTENT');
    expect(emptyFiltered.every((s) => s.count === 0)).toBe(true);
  });

  it('Reclamos service strictly excludes CANCELLED claims from claims by category', () => {
    const allFiltered = getClaimsByCategoryFiltered(mockClaimRecords, 'Todos');
    const totalCount = allFiltered.reduce((acc, curr) => acc + curr.count, 0);

    const nonCanceledManual = mockClaimRecords
      .filter((e) => {
        const st = mapClaimStatus(e.estado_actual);
        return st !== 'CANCELADO';
      })
      .reduce((acc, r) => acc + (r.row_count ?? 1), 0);

    expect(totalCount).toBe(nonCanceledManual);

    const enCursoFiltered = getClaimsByCategoryFiltered(mockClaimRecords, 'en curso');
    const enCursoTotal = enCursoFiltered.reduce((acc, curr) => acc + curr.count, 0);
    const enCursoManual = mockClaimRecords
      .filter((e) => {
        const st = mapClaimStatus(e.estado_actual);
        return st === 'EN CURSO';
      })
      .reduce((acc, r) => acc + (r.row_count ?? 1), 0);

    expect(enCursoTotal).toBe(enCursoManual);
  });

  it('Emergency service calculates CU-E1 (counts by state/priority) and CU-E2 (avg dispatch time)', async () => {
    const data = await getEmergencyAnalyticsData(defaultFilters);
    expect(data.totalEmergencies).toBeGreaterThan(0);
    expect(data.emergenciesByState.length).toBeGreaterThan(0);
    expect(data.emergenciesByPriority.length).toBe(4);
    expect(data.avgDispatchTimeMinutes).toBeGreaterThanOrEqual(0);
    expect(data.emergenciesByCategoryStacked.length).toBeGreaterThan(0);
    expect(data.availableCategories.length).toBeGreaterThan(0);
    expect(data.aiReport?.analisis?.length).toBeGreaterThan(0);
  });

  it('Emergency service supports combined category and state pill filtering for stacked distribution', () => {
    const priorityMap = new Map<string, EmergencyPriority>();
    mockEmergenciaPriorizadaEvents.forEach((e) => priorityMap.set(e.data.emergenciaId, e.data.prioridad));

    const currentStateMap = new Map<string, EmergencyState>();
    mockEmergenciaCreadaEvents.forEach((e) => currentStateMap.set(e.data.emergenciaId, e.data.estado));

    const catName = mockEmergenciaCreadaEvents[0].data.categoria || mockEmergenciaCreadaEvents[0].data.tipo;

    const singleCatFiltered = getCategoryPriorityDistribution(
      mockEmergenciaCreadaEvents,
      priorityMap,
      currentStateMap,
      'Todos',
      catName
    );
    expect(singleCatFiltered.length).toBe(1);
    expect(singleCatFiltered[0].category).toBe(catName);

    const combinedFiltered = getCategoryPriorityDistribution(
      mockEmergenciaCreadaEvents,
      priorityMap,
      currentStateMap,
      'Recibido',
      catName
    );
    expect(combinedFiltered.length).toBe(1);
    expect(combinedFiltered[0].category).toBe(catName);

    const emptyCombined = getCategoryPriorityDistribution(
      mockEmergenciaCreadaEvents,
      priorityMap,
      currentStateMap,
      'Rechazado',
      catName
    );
    expect(emptyCombined.length).toBe(1);
    expect(emptyCombined[0].total).toBe(0);
  });

  /* ---------------------- MOVILIDAD TESTS ---------------------- */

  it('Mobility service keeps only the latest snapshot and filters by cause', () => {
    const viejo = { ...mockMobilityRecords[0], fecha_snapshot: '2026-11-10', cantidadAfectaciones: 999 };
    const records = getFilteredMobilityRecords(defaultFilters, [...mockMobilityRecords, viejo]);
    expect(records).toHaveLength(mockMobilityRecords.length);
    expect(records.every((r) => r.fecha_snapshot === '2026-11-18')).toBe(true);

    const reclamos = getFilteredMobilityRecords({ ...defaultFilters, search: 'reclamo' }, mockMobilityRecords);
    expect(reclamos.map((r) => r.causaTipo)).toEqual(['RECLAMO']);
  });

  it('Mobility service orders station affectations by cause and leaves NORMAL out', () => {
    const items = getAffectationsByCause(mockMobilityRecords);
    expect(items[0]).toMatchObject({ causa: 'EVENTO_CLIMATICO', etiqueta: 'Clima', afectaciones: 159, bloqueadas: 156 });
    expect(items.some((item) => item.causa === 'NORMAL')).toBe(false);
  });

  it('Mobility service lists trips by interruption cause including normal trips', () => {
    const trips = getTripsByCause(mockMobilityRecords);
    expect(trips[0]).toEqual({ causa: 'NORMAL', etiqueta: 'Finalizados normalmente', viajes: 36 });
    expect(trips.find((t) => t.causa === 'INCIDENTE_VIAL')?.viajes).toBe(12);
  });

  it('Mobility service labels causes like the backend', () => {
    expect(causeLabel('EVENTO_PUBLICO')).toBe('Evento público');
    expect(causeLabel(null)).toBe('Sin causa informada');
    expect(causeLabel('OTRA_CAUSA')).toBe('otra causa');
  });

  it('Mobility service handles empty records gracefully avoiding NaN or division by zero', async () => {
    const emptyData = await getMobilityAnalyticsData(defaultFilters, [], mockMobilityLLMReport);
    expect(emptyData.totalAffectations).toBe(0);
    expect(emptyData.restoredPct).toBe(0);
    expect(emptyData.affectationsByCause).toEqual([]);
    expect(emptyData.topCause).toBe('N/A');
  });

  it('Mobility service composes analytics data from the cause summary', async () => {
    const data = await getMobilityAnalyticsData(defaultFilters, mockMobilityRecords, mockMobilityLLMReport);
    expect(data.totalAffectations).toBe(300);
    expect(data.totalBlocked).toBe(166);
    expect(data.totalPreventive).toBe(14);
    expect(data.interruptedTrips).toBe(15);
    expect(data.normalTrips).toBe(36);
    expect(data.topCause).toBe('Clima');
    expect(data.executiveReport).toEqual(mockMobilityLLMReport.analisis[0]);
    expect(data.aiReport).toBe(mockMobilityLLMReport);
  });

  it('Culture service calculates CU-C1 (reservations/cancellation rate) and CU-C2 (inscriptions/occupancy rate)', async () => {
    const data = await getCultureAnalyticsData(defaultFilters);
    expect(data.confirmedReservations).toBeGreaterThan(0);
    expect(data.cancellationRatePct).toBeGreaterThanOrEqual(0);
    expect(data.totalInscriptions).toBeGreaterThan(0);
    expect(data.inscriptionsByEvent.length).toBeGreaterThan(0);
    expect(data.avgOccupancyRatePct).toBeGreaterThan(0);
    expect(data.aiReport?.analisis?.length).toBeGreaterThan(0);
  });
});
