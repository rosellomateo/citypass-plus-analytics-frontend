// src/services/mobilityService.ts
import type {
  DashboardFilters,
  MobilityAnalyticsData,
  StationEntity,
  BikeEntity,
  BikeStatus,
  BikeStatusDistributionItem,
  StationBikesCount,
  DualSeriesTimeSlotItem,
  StationAvailabilityOccupancyItem,
  HistoricalAvailabilityPoint,
  IncidentTypeDistributionItem,
  AvgMaintenanceTimeByStation,
  TopProblematicBikeItem,
  IncidentTypeEntity,
  BikeIncidentEntity,
  MaintenanceRecordEntity,
  StationAvailabilityHistoryEntity,
  ViajeIniciadoEvent,
  ViajeFinalizadoEvent,
} from '../types';
import {
  mockStationsEntities,
  mockBikesEntities,
  mockIncidentTypesEntities,
  mockBikeIncidentsEntities,
  mockMaintenanceRecordsEntities,
  mockStationAvailabilityHistoryEntities,
  mockViajeIniciadoEvents,
  mockViajeFinalizadoEvents,
  mockStations,
} from '../data/mocks/mobility.mock';
import { delay } from '../utils';
import { isWithinDateRange } from '../utils/dates';

export const BIKE_STATUS_LABELS: Record<BikeStatus, string> = {
  AVAILABLE: 'Disponible',
  IN_USE: 'En uso',
  MAINTENANCE: 'En mantenimiento',
  OUT_OF_SERVICE: 'Fuera de servicio',
  STOLEN: 'Reportada como robada',
};

export const BIKE_STATUS_COLORS: Record<BikeStatus, string> = {
  AVAILABLE: '#10B981',
  IN_USE: '#2563A6',
  MAINTENANCE: '#F59E0B',
  OUT_OF_SERVICE: '#8B5CF6',
  STOLEN: '#EF4444',
};

const STANDARD_TIME_SLOTS = [
  '07:00 - 08:00',
  '08:00 - 09:00',
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 13:00',
  '13:00 - 14:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00',
  '17:00 - 18:00',
  '18:00 - 19:00',
  '19:00 - 20:00',
  '20:00 - 21:00',
  '21:00 - 22:00',
];

// Helper: map station ID to station name
function getStationNameMap(stations: StationEntity[] = mockStationsEntities): Map<string, string> {
  return new Map(stations.map((s) => [s.id, s.name]));
}

// 1. Total bikes per station (for Horizontal BarChart)
export function getBikesPerStationDistribution(
  bikes: BikeEntity[] = mockBikesEntities,
  stations: StationEntity[] = mockStationsEntities
): StationBikesCount[] {
  const stationNameMap = getStationNameMap(stations);
  const counts: Record<string, number> = {};

  stations.forEach((s) => {
    counts[s.name] = 0;
  });

  bikes.forEach((b) => {
    if (b.stationId) {
      const stName = stationNameMap.get(b.stationId) || 'Sin Estación';
      counts[stName] = (counts[stName] || 0) + 1;
    }
  });

  return Object.entries(counts).map(([station, count]) => ({ station, count }));
}

// 2. Bikes status distribution (with local station filter)
export function getBikesStatusDistributionFiltered(
  bikes: BikeEntity[] = mockBikesEntities,
  stations: StationEntity[] = mockStationsEntities,
  stationFilter?: string
): BikeStatusDistributionItem[] {
  const stationNameMap = getStationNameMap(stations);

  const filteredBikes =
    !stationFilter || stationFilter === 'ALL' || stationFilter === 'Todas las estaciones'
      ? bikes
      : bikes.filter((b) => b.stationId && stationNameMap.get(b.stationId) === stationFilter);

  const statusCounts: Record<BikeStatus, number> = {
    AVAILABLE: 0,
    IN_USE: 0,
    MAINTENANCE: 0,
    OUT_OF_SERVICE: 0,
    STOLEN: 0,
  };

  filteredBikes.forEach((b) => {
    if (statusCounts[b.status] !== undefined) {
      statusCounts[b.status] += 1;
    }
  });

  return (Object.keys(statusCounts) as BikeStatus[]).map((status) => ({
    name: BIKE_STATUS_LABELS[status],
    value: statusCounts[status],
    color: BIKE_STATUS_COLORS[status],
  }));
}

// 3. Trips by time slot Dual Series (Iniciados vs Finalizados, ordered chronologically, local station filter)
export function getTripsByTimeSlotDualSeries(
  startedEvents: ViajeIniciadoEvent[] = mockViajeIniciadoEvents,
  finishedEvents: ViajeFinalizadoEvent[] = mockViajeFinalizadoEvents,
  stationFilter?: string
): DualSeriesTimeSlotItem[] {
  const isAll = !stationFilter || stationFilter === 'ALL' || stationFilter === 'Todas las estaciones';

  const filteredStarted = isAll
    ? startedEvents
    : startedEvents.filter((e) => e.data.estacionOrigenId === stationFilter);

  const filteredFinished = isAll
    ? finishedEvents
    : finishedEvents.filter((e) => e.data.estacionDestinoId === stationFilter);

  const slotMap: Record<string, { iniciados: number; finalizados: number }> = {};
  STANDARD_TIME_SLOTS.forEach((slot) => {
    slotMap[slot] = { iniciados: 0, finalizados: 0 };
  });

  filteredStarted.forEach((e) => {
    const hour = new Date(e.metadata.occurredAt).getHours();
    const slot = `${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00`;
    if (!slotMap[slot]) slotMap[slot] = { iniciados: 0, finalizados: 0 };
    slotMap[slot].iniciados += 1;
  });

  filteredFinished.forEach((e) => {
    const hour = new Date(e.metadata.occurredAt).getHours();
    const slot = `${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00`;
    if (!slotMap[slot]) slotMap[slot] = { iniciados: 0, finalizados: 0 };
    slotMap[slot].finalizados += 1;
  });

  return Object.entries(slotMap)
    .map(([slot, data]) => ({
      slot,
      iniciados: data.iniciados,
      finalizados: data.finalizados,
    }))
    .sort((a, b) => {
      const hA = parseInt(a.slot.slice(0, 2), 10);
      const hB = parseInt(b.slot.slice(0, 2), 10);
      return hA - hB;
    });
}

// 4. Station availability & occupancy (Dynamic calculation from capacity and current bikes)
export function getStationAvailabilityOccupancy(
  stations: StationEntity[] = mockStationsEntities,
  bikes: BikeEntity[] = mockBikesEntities
): StationAvailabilityOccupancyItem[] {
  return stations.map((st) => {
    const bikesAtStation = bikes.filter((b) => b.stationId === st.id);
    const availableBikes = bikesAtStation.filter((b) => b.status === 'AVAILABLE').length;
    const freeSlots = Math.max(0, st.capacity - bikesAtStation.length);

    return {
      station: st.name,
      availableBikes,
      freeSlots,
      capacity: st.capacity,
    };
  });
}

// 5. Historical availability evolution (from station_availability_history)
export function getHistoricalAvailabilityTimeSeries(
  history: StationAvailabilityHistoryEntity[] = mockStationAvailabilityHistoryEntities,
  stations: StationEntity[] = mockStationsEntities,
  stationFilter?: string
): HistoricalAvailabilityPoint[] {
  const stationNameMap = getStationNameMap(stations);
  const isAll = !stationFilter || stationFilter === 'ALL' || stationFilter === 'Todas las estaciones';

  const filtered = isAll
    ? history
    : history.filter((h) => stationNameMap.get(h.stationId) === stationFilter);

  const timeMap: Record<string, { available: number; slots: number; count: number }> = {};

  filtered.forEach((item) => {
    const dateObj = new Date(item.recordedAt);
    const timeLabel = `${dateObj.getHours().toString().padStart(2, '0')}:00`;

    if (!timeMap[timeLabel]) {
      timeMap[timeLabel] = { available: 0, slots: 0, count: 0 };
    }
    timeMap[timeLabel].available += item.availableBikes;
    timeMap[timeLabel].slots += item.availableSlots;
    timeMap[timeLabel].count += 1;
  });

  return Object.entries(timeMap)
    .map(([timestamp, data]) => ({
      timestamp,
      availableBikes: Math.round(data.available / (data.count || 1)),
      freeSlots: Math.round(data.slots / (data.count || 1)),
    }))
    .sort((a, b) => parseInt(a.timestamp.slice(0, 2), 10) - parseInt(b.timestamp.slice(0, 2), 10));
}

// 6. Incidents by type distribution (with local station filter)
export function getIncidentsByTypeDistribution(
  incidents: BikeIncidentEntity[] = mockBikeIncidentsEntities,
  types: IncidentTypeEntity[] = mockIncidentTypesEntities,
  stations: StationEntity[] = mockStationsEntities,
  stationFilter?: string
): IncidentTypeDistributionItem[] {
  const stationNameMap = getStationNameMap(stations);
  const typeMap = new Map(types.map((t) => [t.id, t]));

  const filteredIncidents =
    !stationFilter || stationFilter === 'ALL' || stationFilter === 'Todas las estaciones'
      ? incidents
      : incidents.filter((i) => i.stationId && stationNameMap.get(i.stationId) === stationFilter);

  const typeCounts: Record<string, number> = {};
  filteredIncidents.forEach((inc) => {
    const t = typeMap.get(inc.incidentTypeId);
    const name = t ? t.name : 'Otro';
    typeCounts[name] = (typeCounts[name] || 0) + 1;
  });

  return types.map((t) => ({
    typeName: t.name,
    count: typeCounts[t.name] || 0,
    severity: t.severity,
  }));
}

// 7. Single Metric: Average Maintenance Hours (overall or filtered by station)
export function getAvgMaintenanceHours(
  records: MaintenanceRecordEntity[] = mockMaintenanceRecordsEntities,
  bikes: BikeEntity[] = mockBikesEntities,
  stations: StationEntity[] = mockStationsEntities,
  stationFilter?: string
): number {
  const bikeStationMap = new Map(bikes.map((b) => [b.id, b.stationId]));
  const stationNameMap = getStationNameMap(stations);

  const isAll = !stationFilter || stationFilter === 'ALL' || stationFilter === 'Todas las estaciones';

  const filteredRecords = isAll
    ? records
    : records.filter((r) => {
        const stId = bikeStationMap.get(r.bikeId);
        return stId && stationNameMap.get(stId) === stationFilter;
      });

  if (filteredRecords.length === 0) return 0;

  let totalHours = 0;
  let count = 0;

  filteredRecords.forEach((r) => {
    if (r.startedAt && r.endedAt) {
      const diffMs = new Date(r.endedAt).getTime() - new Date(r.startedAt).getTime();
      const hours = Math.max(0, diffMs / 3600000);
      if (hours > 0) {
        totalHours += hours;
        count += 1;
      }
    }
  });

  return count > 0 ? Number((totalHours / count).toFixed(1)) : 0;
}

export function getAvgMaintenanceTimeByStation(
  records: MaintenanceRecordEntity[] = mockMaintenanceRecordsEntities,
  bikes: BikeEntity[] = mockBikesEntities,
  stations: StationEntity[] = mockStationsEntities,
  stationFilter?: string
): AvgMaintenanceTimeByStation[] {
  const bikeStationMap = new Map(bikes.map((b) => [b.id, b.stationId]));
  const stationNameMap = getStationNameMap(stations);

  const stationTotals: Record<string, { totalHours: number; count: number }> = {};
  stations.forEach((s) => {
    stationTotals[s.name] = { totalHours: 0, count: 0 };
  });

  records.forEach((r) => {
    const stId = bikeStationMap.get(r.bikeId);
    if (stId) {
      const stName = stationNameMap.get(stId);
      if (stName) {
        let durationHours = 0;
        if (r.endedAt && r.startedAt) {
          const diffMs = new Date(r.endedAt).getTime() - new Date(r.startedAt).getTime();
          durationHours = Math.max(0, diffMs / 3600000);
        }
        if (durationHours > 0) {
          stationTotals[stName].totalHours += durationHours;
          stationTotals[stName].count += 1;
        }
      }
    }
  });

  const result = Object.entries(stationTotals).map(([station, { totalHours, count }]) => ({
    station,
    avgHours: count > 0 ? Number((totalHours / count).toFixed(1)) : 0,
  }));

  if (!stationFilter || stationFilter === 'ALL' || stationFilter === 'Todas las estaciones') {
    return result;
  }
  return result.filter((r) => r.station === stationFilter);
}

// 8. Top problematic bikes ranking (most incidents & maintenance entries, station filter, top limit = 5)
export function getTopProblematicBikes(
  bikes: BikeEntity[] = mockBikesEntities,
  incidents: BikeIncidentEntity[] = mockBikeIncidentsEntities,
  records: MaintenanceRecordEntity[] = mockMaintenanceRecordsEntities,
  stations: StationEntity[] = mockStationsEntities,
  stationFilterOrLimit?: string | number,
  limitParam = 5
): TopProblematicBikeItem[] {
  let stationFilter: string | undefined;
  let limit = limitParam;

  if (typeof stationFilterOrLimit === 'number') {
    limit = stationFilterOrLimit;
    stationFilter = undefined;
  } else {
    stationFilter = stationFilterOrLimit;
  }

  const stationNameMap = getStationNameMap(stations);
  const isAll = !stationFilter || stationFilter === 'ALL' || stationFilter === 'Todas las estaciones';

  const incidentCounts: Record<string, number> = {};
  const maintenanceCounts: Record<string, number> = {};

  incidents.forEach((i) => {
    incidentCounts[i.bikeId] = (incidentCounts[i.bikeId] || 0) + 1;
  });

  records.forEach((r) => {
    maintenanceCounts[r.bikeId] = (maintenanceCounts[r.bikeId] || 0) + 1;
  });

  const filteredBikes = isAll
    ? bikes
    : bikes.filter((b) => b.stationId && stationNameMap.get(b.stationId) === stationFilter);

  const scoredBikes = filteredBikes.map((b) => {
    const incCount = incidentCounts[b.id] || 0;
    const mntCount = maintenanceCounts[b.id] || 0;
    const stName = b.stationId ? stationNameMap.get(b.stationId) || 'En Tránsito' : 'En Tránsito';

    return {
      bikeCode: b.code,
      stationName: stName,
      incidentCount: incCount,
      maintenanceCount: mntCount,
      status: b.status,
    };
  });

  return scoredBikes
    .filter((b) => b.incidentCount > 0 || b.maintenanceCount > 0)
    .sort((a, b) => {
      if (b.incidentCount !== a.incidentCount) {
        return b.incidentCount - a.incidentCount;
      }
      return b.maintenanceCount - a.maintenanceCount;
    })
    .slice(0, limit);
}

// Main API Composite Fetcher
export async function getMobilityAnalyticsData(filters: DashboardFilters): Promise<MobilityAnalyticsData> {
  await delay();

  const started = mockViajeIniciadoEvents.filter((e) => isWithinDateRange(e.metadata.occurredAt, filters));
  const finished = mockViajeFinalizadoEvents.filter((e) => isWithinDateRange(e.metadata.occurredAt, filters));

  const startedMap = new Map(started.map((e) => [e.data.viajeId, e]));

  // Avg trip duration
  const durationsMinutes: number[] = [];
  finished.forEach((f) => {
    let durationMin = 0;
    if (f.data.duracionSegundos !== undefined) {
      durationMin = f.data.duracionSegundos / 60;
    } else {
      const sEvt = startedMap.get(f.data.viajeId);
      if (sEvt) {
        const sTime = new Date(sEvt.metadata.occurredAt).getTime();
        const fTime = new Date(f.metadata.occurredAt).getTime();
        durationMin = Math.max(0, (fTime - sTime) / 60000);
      }
    }

    if (durationMin > 0) {
      durationsMinutes.push(durationMin);
    }
  });

  const avgTripDurationMinutes =
    durationsMinutes.length > 0
      ? Number((durationsMinutes.reduce((a, b) => a + b, 0) / durationsMinutes.length).toFixed(1))
      : 0;

  // Bikes & station metrics
  const totalBikes = mockBikesEntities.length;
  const availableBikesCount = mockBikesEntities.filter((b) => b.status === 'AVAILABLE').length;

  const availabilityOccupancy = getStationAvailabilityOccupancy(mockStationsEntities, mockBikesEntities);
  const totalFreeSlots = availabilityOccupancy.reduce((acc, curr) => acc + curr.freeSlots, 0);

  return {
    totalTripsStarted: started.length,
    totalTripsCompleted: finished.length,
    avgTripDurationMinutes,
    totalBikes,
    availableBikesCount,
    totalFreeSlots,
    bikesByStation: getBikesPerStationDistribution(mockBikesEntities, mockStationsEntities),
    bikesStatusDistribution: getBikesStatusDistributionFiltered(mockBikesEntities, mockStationsEntities),
    timeSlotDualSeries: getTripsByTimeSlotDualSeries(started, finished),
    stationAvailabilityOccupancy: availabilityOccupancy,
    historicalAvailability: getHistoricalAvailabilityTimeSeries(mockStationAvailabilityHistoryEntities, mockStationsEntities),
    incidentsByTypeDistribution: getIncidentsByTypeDistribution(mockBikeIncidentsEntities, mockIncidentTypesEntities, mockStationsEntities),
    avgMaintenanceTimeByStation: getAvgMaintenanceTimeByStation(mockMaintenanceRecordsEntities, mockBikesEntities, mockStationsEntities),
    topProblematicBikes: getTopProblematicBikes(mockBikesEntities, mockBikeIncidentsEntities, mockMaintenanceRecordsEntities, mockStationsEntities, undefined, 5),
    availableStations: mockStations,
  };
}
