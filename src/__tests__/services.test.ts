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
  deduplicateMobilityRecords,
  getFilteredMobilityRecords,
  getTripsByStation,
  getTripsByDurationBucket,
  getDailyTripsTrend,
  getStationAvgDuration,
} from '../services/mobilityService';
import { getCultureAnalyticsData } from '../services/cultureService';
import { mockClaimRecords } from '../data/mocks/claims.mock';
import {
  mockEmergenciaCreadaEvents,
  mockEmergenciaPriorizadaEvents,
} from '../data/mocks/emergencies.mock';
import { mockMobilityRecords, mockMobilityLLMReport } from '../data/mocks/mobility.mock';
import type { EmergencyPriority, EmergencyState, BackendMobilityRecord } from '../types';

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

  it('Mobility service deduplicates records by selecting the latest fecha_snapshot', () => {
    const duplicateRecords: BackendMobilityRecord[] = [
      {
        fechaInicio: '2026-07-27',
        estacionInicio: 'est-almagro-01',
        duracionViaje: '<15min',
        cantidadViajes: 1,
        duracionTotalViajes: 12.0,
        promDuracion: 12.0,
        fecha_snapshot: '2026-08-02',
      },
      {
        fechaInicio: '2026-07-27',
        estacionInicio: 'est-almagro-01',
        duracionViaje: '<15min',
        cantidadViajes: 1,
        duracionTotalViajes: 12.0,
        promDuracion: 12.0,
        fecha_snapshot: '2026-09-22', // más reciente
      },
    ];

    const deduplicated = deduplicateMobilityRecords(duplicateRecords);
    expect(deduplicated.length).toBe(1);
    expect(deduplicated[0].fecha_snapshot).toBe('2026-09-22');
  });

  it('Mobility service calculates exact weighted average for trip duration SUM(totalMinutes)/SUM(trips)', () => {
    const records: BackendMobilityRecord[] = [
      {
        fechaInicio: '2026-09-18',
        estacionInicio: 'estacion-A',
        duracionViaje: '15-30min',
        cantidadViajes: 10,
        duracionTotalViajes: 200,
        promDuracion: 20,
        fecha_snapshot: '2026-09-20',
      },
      {
        fechaInicio: '2026-09-18',
        estacionInicio: 'estacion-A',
        duracionViaje: '30-60min',
        cantidadViajes: 2,
        duracionTotalViajes: 100,
        promDuracion: 50,
        fecha_snapshot: '2026-09-20',
      },
    ];

    // Weighted average: (200 + 100) / (10 + 2) = 300 / 12 = 25 min.
    // Simple average would be (20 + 50) / 2 = 35 min. We verify it's 25!
    const avgDurationItems = getStationAvgDuration(records);
    expect(avgDurationItems.length).toBe(1);
    expect(avgDurationItems[0].promDuracionPonderada).toBe(25);
  });

  it('Mobility service respects strict duration bucket ordering', () => {
    const records: BackendMobilityRecord[] = [
      {
        fechaInicio: '2026-09-18',
        estacionInicio: 'liniers-02',
        duracionViaje: '>1h',
        cantidadViajes: 5,
        duracionTotalViajes: 350,
        promDuracion: 70,
        fecha_snapshot: '2026-09-20',
      },
      {
        fechaInicio: '2026-09-18',
        estacionInicio: 'liniers-02',
        duracionViaje: '<15min',
        cantidadViajes: 10,
        duracionTotalViajes: 100,
        promDuracion: 10,
        fecha_snapshot: '2026-09-20',
      },
    ];

    const buckets = getTripsByDurationBucket(records);
    expect(buckets.map((b) => b.bucket)).toEqual(['<15min', '15-30min', '30-60min', '>1h']);
    expect(buckets.find((b) => b.bucket === '<15min')?.cantidadViajes).toBe(10);
    expect(buckets.find((b) => b.bucket === '>1h')?.cantidadViajes).toBe(5);
  });

  it('Mobility service supports station filtering dynamically without hardcoded stations', () => {
    const stations = getTripsByStation(mockMobilityRecords);
    expect(stations.length).toBeGreaterThan(0);

    const firstStation = stations[0].station;
    const filteredTrips = getTripsByStation(mockMobilityRecords, firstStation);
    expect(filteredTrips.length).toBe(1);
    expect(filteredTrips[0].station).toBe(firstStation);
  });

  it('Mobility service filters records by date and search text', () => {
    const records = getFilteredMobilityRecords(
      {
        dateRange: 'custom',
        from: '2026-09-01',
        to: '2026-09-30',
        search: 'palermo',
      },
      mockMobilityRecords
    );

    expect(records.length).toBeGreaterThan(0);
    expect(records.every((record) => record.estacionInicio.toLowerCase().includes('palermo'))).toBe(
      true
    );
  });

  it('Mobility service calculates and sorts the daily trips trend', () => {
    const trend = getDailyTripsTrend([
      {
        fechaInicio: '2026-09-19',
        estacionInicio: 'palermo-05',
        duracionViaje: '15-30min',
        cantidadViajes: 2,
        duracionTotalViajes: 40,
        promDuracion: 20,
        fecha_snapshot: '2026-09-20',
      },
      {
        fechaInicio: '2026-09-18',
        estacionInicio: 'palermo-05',
        duracionViaje: '<15min',
        cantidadViajes: 3,
        duracionTotalViajes: 30,
        promDuracion: 10,
        fecha_snapshot: '2026-09-20',
      },
    ]);

    expect(trend).toEqual([
      { fecha: '2026-09-18', cantidadViajes: 3, duracionTotal: 30 },
      { fecha: '2026-09-19', cantidadViajes: 2, duracionTotal: 40 },
    ]);
  });

  it('Mobility service handles empty records gracefully avoiding NaN or division by zero', async () => {
    const emptyData = await getMobilityAnalyticsData(defaultFilters, []);
    expect(emptyData.weightedAvgDurationMinutes).toBe(0);
    expect(emptyData.tripsByStation.length).toBe(0);
    expect(emptyData.topStationName).toBe('N/A');
    expect(emptyData.predominantDurationBucket).toBe('N/A');
  });

  it('Mobility service composes analytics data dynamically from filtered records', async () => {
    const data = await getMobilityAnalyticsData(defaultFilters);
    expect(data.totalTrips).toBeGreaterThan(0);
    expect(data.weeklyTrips).toBeGreaterThan(0);
    expect(data.totalDurationMinutes).toBeGreaterThan(0);
    expect(data.weightedAvgDurationMinutes).toBeGreaterThan(0);
    expect(data.availableStations.length).toBeGreaterThan(0);
    expect(data.executiveReport).toEqual(mockMobilityLLMReport.analisis[0]);
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
