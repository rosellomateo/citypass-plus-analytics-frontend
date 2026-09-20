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
import { getMobilityAnalyticsData } from '../services/mobilityService';
import { getCultureAnalyticsData } from '../services/cultureService';
import { mockClaimRecords } from '../data/mocks/claims.mock';
import {
  mockEmergenciaCreadaEvents,
  mockEmergenciaPriorizadaEvents,
} from '../data/mocks/emergencies.mock';
import type { EmergencyPriority, EmergencyState } from '../types';

const defaultFilters = { dateRange: '7d' as const };

describe('Domain Services Aggregations', () => {
  it('Reclamos service calculates CU-R1 (counts by category/status) and CU-R2 (avg resolution time)', async () => {
    const data = await getClaimsAnalyticsData(defaultFilters);
    expect(data.totalClaims).toBeGreaterThan(0);
    expect(data.claimsByCategory.length).toBeGreaterThan(0);
    expect(data.claimsByStatus.length).toBe(4);
    expect(data.avgResolutionTimeHours).toBeGreaterThanOrEqual(0);
    expect(data.availableCategories.length).toBeGreaterThan(0);
  });

  it('Reclamos service supports local category filtering for status distribution', () => {
    // Filter status distribution by specific category
    const catFiltered = getClaimsByStatusFiltered(mockClaimRecords, 'ALUMBRADO');
    expect(catFiltered.length).toBe(4);
    const totalCount = catFiltered.reduce((acc, curr) => acc + curr.count, 0);
    const alumbradoTotal = mockClaimRecords
      .filter((e) => formatClaimCategory(e.categoria) === 'ALUMBRADO')
      .reduce((acc, r) => acc + (r.row_count ?? 1), 0);
    expect(totalCount).toBe(alumbradoTotal);

    // Filter with non-existent category returns 0 for all statuses without crashing
    const emptyFiltered = getClaimsByStatusFiltered(mockClaimRecords, 'NON_EXISTENT');
    expect(emptyFiltered.every((s) => s.count === 0)).toBe(true);
  });

  it('Reclamos service strictly excludes CANCELLED claims from claims by category', () => {
    // 'Todos' pill selected -> canceled claims must be excluded completely
    const allFiltered = getClaimsByCategoryFiltered(mockClaimRecords, 'Todos');
    const totalCount = allFiltered.reduce((acc, curr) => acc + curr.count, 0);

    // Count non-canceled claims manually
    const nonCanceledManual = mockClaimRecords
      .filter((e) => {
        const st = mapClaimStatus(e.estado_actual);
        return st !== 'CANCELADO';
      })
      .reduce((acc, r) => acc + (r.row_count ?? 1), 0);

    expect(totalCount).toBe(nonCanceledManual);

    // Specific status pill ('en curso')
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
  });

  it('Emergency service supports combined category and state pill filtering for stacked distribution', () => {
    const priorityMap = new Map<string, EmergencyPriority>();
    mockEmergenciaPriorizadaEvents.forEach((e) => priorityMap.set(e.data.emergenciaId, e.data.prioridad));

    const currentStateMap = new Map<string, EmergencyState>();
    mockEmergenciaCreadaEvents.forEach((e) => currentStateMap.set(e.data.emergenciaId, e.data.estado));

    const catName = mockEmergenciaCreadaEvents[0].data.categoria || mockEmergenciaCreadaEvents[0].data.tipo;

    // Single category filter
    const singleCatFiltered = getCategoryPriorityDistribution(
      mockEmergenciaCreadaEvents,
      priorityMap,
      currentStateMap,
      'Todos',
      catName
    );
    expect(singleCatFiltered.length).toBe(1);
    expect(singleCatFiltered[0].category).toBe(catName);

    // Combined category + state pill filter ('Recibido')
    const combinedFiltered = getCategoryPriorityDistribution(
      mockEmergenciaCreadaEvents,
      priorityMap,
      currentStateMap,
      'Recibido',
      catName
    );
    expect(combinedFiltered.length).toBe(1);
    expect(combinedFiltered[0].category).toBe(catName);

    // Non-matching filter combination returns 0 total count without crashing
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

  it('Mobility service calculates CU-M1 (trips by station/slot) and CU-M2 (avg trip duration)', async () => {
    const data = await getMobilityAnalyticsData(defaultFilters);
    expect(data.totalTripsStarted).toBeGreaterThan(0);
    expect(data.tripsByOriginStation.length).toBeGreaterThan(0);
    expect(data.tripsByTimeSlot.length).toBeGreaterThan(0);
    expect(data.avgTripDurationMinutes).toBeGreaterThan(0);
  });

  it('Culture service calculates CU-C1 (reservations/cancellation rate) and CU-C2 (inscriptions/occupancy rate)', async () => {
    const data = await getCultureAnalyticsData(defaultFilters);
    expect(data.confirmedReservations).toBeGreaterThan(0);
    expect(data.cancellationRatePct).toBeGreaterThanOrEqual(0);
    expect(data.totalInscriptions).toBeGreaterThan(0);
    expect(data.inscriptionsByEvent.length).toBeGreaterThan(0);
    expect(data.avgOccupancyRatePct).toBeGreaterThan(0);
  });
});
