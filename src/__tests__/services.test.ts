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
  getBikesPerStationDistribution,
  getBikesStatusDistributionFiltered,
  getTripsByTimeSlotDualSeries,
  getStationAvailabilityOccupancy,
  getHistoricalAvailabilityTimeSeries,
  getIncidentsByTypeDistribution,
  getAvgMaintenanceTimeByStation,
  getTopProblematicBikes,
} from '../services/mobilityService';
import { getCultureAnalyticsData } from '../services/cultureService';
import { mockClaimRecords } from '../data/mocks/claims.mock';
import {
  mockEmergenciaCreadaEvents,
  mockEmergenciaPriorizadaEvents,
} from '../data/mocks/emergencies.mock';
import {
  mockStationsEntities,
  mockBikesEntities,
  mockIncidentTypesEntities,
  mockBikeIncidentsEntities,
  mockMaintenanceRecordsEntities,
  mockStationAvailabilityHistoryEntities,
  mockViajeIniciadoEvents,
  mockViajeFinalizadoEvents,
} from '../data/mocks/mobility.mock';
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

  it('Mobility service calculates CU-M1 & CU-M2 composite analytics correctly', async () => {
    const data = await getMobilityAnalyticsData(defaultFilters);
    expect(data.totalTripsStarted).toBeGreaterThan(0);
    expect(data.totalTripsCompleted).toBeGreaterThan(0);
    expect(data.totalBikes).toBeGreaterThan(0);
    expect(data.availableBikesCount).toBeGreaterThan(0);
    expect(data.totalFreeSlots).toBeGreaterThan(0);
    expect(data.bikesByStation.length).toBe(mockStationsEntities.length);
    expect(data.bikesStatusDistribution.length).toBe(5);
    expect(data.timeSlotDualSeries.length).toBeGreaterThan(0);
    expect(data.stationAvailabilityOccupancy.length).toBe(mockStationsEntities.length);
    expect(data.historicalAvailability.length).toBeGreaterThan(0);
    expect(data.incidentsByTypeDistribution.length).toBe(mockIncidentTypesEntities.length);
    expect(data.avgMaintenanceTimeByStation.length).toBe(mockStationsEntities.length);
    expect(data.topProblematicBikes.length).toBeGreaterThan(0);
  });

  it('Mobility service supports bikes per station distribution (horizontal bar data)', () => {
    const bikesByStation = getBikesPerStationDistribution(mockBikesEntities, mockStationsEntities);
    expect(bikesByStation.length).toBe(mockStationsEntities.length);
    const sumCount = bikesByStation.reduce((acc, curr) => acc + curr.count, 0);
    const assignedBikesCount = mockBikesEntities.filter((b) => b.stationId !== null).length;
    expect(sumCount).toBe(assignedBikesCount);
  });

  it('Mobility service calculates dynamic station availability and free slots', () => {
    const occupancy = getStationAvailabilityOccupancy(mockStationsEntities, mockBikesEntities);
    expect(occupancy.length).toBe(mockStationsEntities.length);

    occupancy.forEach((item) => {
      const station = mockStationsEntities.find((s) => s.name === item.station)!;
      const bikesAtStation = mockBikesEntities.filter((b) => b.stationId === station.id);
      const manualAvailable = bikesAtStation.filter((b) => b.status === 'AVAILABLE').length;
      const manualFree = Math.max(0, station.capacity - bikesAtStation.length);

      expect(item.availableBikes).toBe(manualAvailable);
      expect(item.freeSlots).toBe(manualFree);
      expect(item.capacity).toBe(station.capacity);
    });
  });

  it('Mobility service supports station filtering for bike status distribution', () => {
    const allDist = getBikesStatusDistributionFiltered(mockBikesEntities, mockStationsEntities);
    const totalAll = allDist.reduce((acc, curr) => acc + curr.value, 0);
    expect(totalAll).toBe(mockBikesEntities.length);

    const stName = mockStationsEntities[0].name;
    const filteredDist = getBikesStatusDistributionFiltered(mockBikesEntities, mockStationsEntities, stName);
    const totalFiltered = filteredDist.reduce((acc, curr) => acc + curr.value, 0);
    const manualStationBikes = mockBikesEntities.filter((b) => b.stationId === mockStationsEntities[0].id).length;
    expect(totalFiltered).toBe(manualStationBikes);
  });

  it('Mobility service calculates dual-series trips by time slot in chronological order', () => {
    const timeSlots = getTripsByTimeSlotDualSeries(mockViajeIniciadoEvents, mockViajeFinalizadoEvents);
    expect(timeSlots.length).toBeGreaterThan(0);

    // Verify chronological order
    for (let i = 0; i < timeSlots.length - 1; i++) {
      const hCurr = parseInt(timeSlots[i].slot.slice(0, 2), 10);
      const hNext = parseInt(timeSlots[i + 1].slot.slice(0, 2), 10);
      expect(hCurr).toBeLessThan(hNext);
    }
  });

  it('Mobility service ranks top problematic bikes by incidents and maintenance entries', () => {
    const topBikes = getTopProblematicBikes(
      mockBikesEntities,
      mockBikeIncidentsEntities,
      mockMaintenanceRecordsEntities,
      mockStationsEntities,
      5
    );
    expect(topBikes.length).toBeLessThanOrEqual(5);
    expect(topBikes[0].incidentCount + topBikes[0].maintenanceCount).toBeGreaterThanOrEqual(
      topBikes[topBikes.length - 1].incidentCount + topBikes[topBikes.length - 1].maintenanceCount
    );
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

