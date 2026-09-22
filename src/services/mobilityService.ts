// src/services/mobilityService.ts
import type {
  DashboardFilters,
  BackendMobilityRecord,
  MobilityLLMReport,
  MobilityAnalyticsData,
  TripsByStationItem,
  TripsByDurationBucketItem,
  DailyTripsTrendItem,
  StationAvgDurationItem,
  MobilityWeeklyAnalysis,
  AIAnalysisReport,
} from '../types';
import { mockMobilityRecords, mockMobilityLLMReport } from '../data/mocks/mobility.mock';
import { delay } from '../utils';
import { isWithinDateRange } from '../utils/dates';

export const STANDARD_DURATION_BUCKETS = ['<15min', '15-30min', '30-60min', '>1h'];

export const STATION_NAME_MAP: Record<string, string> = {
  'belgrano-03': 'Belgrano',
  'est-almagro-01': 'Almagro',
  'est-alagro-033': 'Almagro',
  'est-boedo-01': 'Boedo',
  'est-chacarita-02': 'Chacarita',
  'est-devoto-03': 'Devoto',
  'est-flores-01': 'Flores',
  'liniers-02': 'Liniers',
  'palermo-05': 'Palermo',
  'recoleta-04': 'Recoleta',
};

/**
 * Traduce y formaliza los nombres de estaciones para la UI (e.g. belgrano-03 -> Belgrano).
 */
export function formatStationName(rawName: string): string {
  if (!rawName) return 'Sin Estación';
  const lower = rawName.toLowerCase().trim();
  if (STATION_NAME_MAP[lower]) return STATION_NAME_MAP[lower];

  let cleaned = rawName.replace(/^est-?/i, '').replace(/-\d+$/i, '');
  if (!cleaned) cleaned = rawName;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Compara si un nombre de estación (crudo o formateado) coincide con el filtro seleccionado.
 */
export function isStationMatch(rawStation: string, stationFilter?: string): boolean {
  if (!stationFilter || stationFilter === 'ALL' || stationFilter === 'Todas las estaciones') {
    return true;
  }
  const formatted = formatStationName(rawStation);
  return rawStation === stationFilter || formatted === stationFilter;
}

/**
 * Deduplica registros analíticos reteniendo únicamente el registro con la fecha_snapshot más reciente
 * para cada clave única (fechaInicio + estacionInicio + duracionViaje).
 */
export function deduplicateMobilityRecords(records: BackendMobilityRecord[]): BackendMobilityRecord[] {
  if (!records || records.length === 0) return [];

  const mapKeyToRecord = new Map<string, BackendMobilityRecord>();

  records.forEach((record) => {
    const key = `${record.fechaInicio}|${record.estacionInicio}|${record.duracionViaje}`;
    const existing = mapKeyToRecord.get(key);

    if (!existing) {
      mapKeyToRecord.set(key, record);
    } else {
      const existingDate = new Date(existing.fecha_snapshot).getTime();
      const currentDate = new Date(record.fecha_snapshot).getTime();
      if (currentDate > existingDate) {
        mapKeyToRecord.set(key, record);
      }
    }
  });

  return Array.from(mapKeyToRecord.values());
}

/**
 * Filtra registros deduplicados según filtros globales de fecha (aplicados a fechaInicio) y búsqueda.
 */
export function getFilteredMobilityRecords(
  filters: DashboardFilters,
  records: BackendMobilityRecord[] = mockMobilityRecords
): BackendMobilityRecord[] {
  const deduplicated = deduplicateMobilityRecords(records);

  let filtered = deduplicated.filter((r) => isWithinDateRange(r.fechaInicio, filters));

  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.estacionInicio.toLowerCase().includes(q) ||
        formatStationName(r.estacionInicio).toLowerCase().includes(q) ||
        r.duracionViaje.toLowerCase().includes(q) ||
        r.fechaInicio.toLowerCase().includes(q)
    );
  }

  return filtered;
}

/**
 * Calcula SUM(cantidadViajes) por estación de inicio (con nombres traducidos).
 */
export function getTripsByStation(
  records: BackendMobilityRecord[],
  stationFilter?: string
): TripsByStationItem[] {
  const filtered = records.filter((r) => isStationMatch(r.estacionInicio, stationFilter));

  const counts: Record<string, number> = {};

  filtered.forEach((r) => {
    const formattedName = formatStationName(r.estacionInicio);
    counts[formattedName] = (counts[formattedName] || 0) + (r.cantidadViajes || 0);
  });

  return Object.entries(counts)
    .map(([station, count]) => ({ station, cantidadViajes: count }))
    .sort((a, b) => b.cantidadViajes - a.cantidadViajes);
}

/**
 * Agrupa SUM(cantidadViajes) por rango de duración manteniendo el orden estricto:
 * [<15min, 15-30min, 30-60min, >1h]
 */
export function getTripsByDurationBucket(
  records: BackendMobilityRecord[],
  stationFilter?: string
): TripsByDurationBucketItem[] {
  const filtered = records.filter((r) => isStationMatch(r.estacionInicio, stationFilter));

  const bucketCounts: Record<string, number> = {
    '<15min': 0,
    '15-30min': 0,
    '30-60min': 0,
    '>1h': 0,
  };

  let totalTrips = 0;

  filtered.forEach((r) => {
    const count = r.cantidadViajes || 0;
    totalTrips += count;
    if (bucketCounts[r.duracionViaje] !== undefined) {
      bucketCounts[r.duracionViaje] += count;
    } else {
      bucketCounts[r.duracionViaje] = (bucketCounts[r.duracionViaje] || 0) + count;
    }
  });

  const allBucketKeys = Array.from(
    new Set([...STANDARD_DURATION_BUCKETS, ...Object.keys(bucketCounts)])
  );

  return allBucketKeys.map((bucket) => {
    const count = bucketCounts[bucket] || 0;
    const porcentaje = totalTrips > 0 ? Number(((count / totalTrips) * 100).toFixed(1)) : 0;
    return {
      bucket,
      cantidadViajes: count,
      porcentaje,
    };
  });
}

/**
 * Calcula la evolución diaria de SUM(cantidadViajes) y SUM(duracionTotalViajes) por fechaInicio.
 */
export function getDailyTripsTrend(
  records: BackendMobilityRecord[],
  stationFilter?: string
): DailyTripsTrendItem[] {
  const filtered = records.filter((r) => isStationMatch(r.estacionInicio, stationFilter));

  const dateMap: Record<string, { count: number; totalDuration: number }> = {};

  filtered.forEach((r) => {
    if (!dateMap[r.fechaInicio]) {
      dateMap[r.fechaInicio] = { count: 0, totalDuration: 0 };
    }
    dateMap[r.fechaInicio].count += r.cantidadViajes || 0;
    dateMap[r.fechaInicio].totalDuration += r.duracionTotalViajes || 0;
  });

  return Object.entries(dateMap)
    .map(([fecha, data]) => ({
      fecha,
      cantidadViajes: data.count,
      duracionTotal: Number(data.totalDuration.toFixed(1)),
      totalDuration: Number(data.totalDuration.toFixed(1)),
    }))
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
}

/**
 * Calcula la Duración Promedio Ponderada por Estación:
 * SUM(duracionTotalViajes) / SUM(cantidadViajes) (con nombres traducidos).
 */
export function getStationAvgDuration(
  records: BackendMobilityRecord[],
  stationFilter?: string
): StationAvgDurationItem[] {
  const filtered = records.filter((r) => isStationMatch(r.estacionInicio, stationFilter));

  const stationTotals: Record<string, { totalDuration: number; totalTrips: number }> = {};

  filtered.forEach((r) => {
    const formattedName = formatStationName(r.estacionInicio);
    if (!stationTotals[formattedName]) {
      stationTotals[formattedName] = { totalDuration: 0, totalTrips: 0 };
    }
    stationTotals[formattedName].totalDuration += r.duracionTotalViajes || 0;
    stationTotals[formattedName].totalTrips += r.cantidadViajes || 0;
  });

  return Object.entries(stationTotals)
    .map(([station, { totalDuration, totalTrips }]) => ({
      station,
      promDuracionPonderada:
        totalTrips > 0 ? Number((totalDuration / totalTrips).toFixed(1)) : 0,
      cantidadViajes: totalTrips,
    }))
    .sort((a, b) => b.promDuracionPonderada - a.promDuracionPonderada);
}

/**
 * Servicio analítico principal que compone los KPIs calculados dinámicamente según los filtros activos.
 */
export async function getMobilityAnalyticsData(
  filters: DashboardFilters,
  records: BackendMobilityRecord[] = mockMobilityRecords,
  llmReport: MobilityLLMReport = mockMobilityLLMReport
): Promise<MobilityAnalyticsData> {
  await delay();

  const filteredRecords = getFilteredMobilityRecords(filters, records);

  // Extraer lista única de estaciones formateadas/traducidas
  const availableStations = Array.from(
    new Set(records.map((r) => formatStationName(r.estacionInicio)))
  ).sort();

  // Todos los KPIs calculados 100% dinámicamente sobre los registros del período filtrado
  const totalDurationSum = filteredRecords.reduce((acc, r) => acc + (r.duracionTotalViajes || 0), 0);
  const totalTripsSum = filteredRecords.reduce((acc, r) => acc + (r.cantidadViajes || 0), 0);

  const weightedAvgDurationMinutes =
    totalTripsSum > 0 ? Number((totalDurationSum / totalTripsSum).toFixed(1)) : 0;

  const tripsByStation = getTripsByStation(filteredRecords);
  const tripsByDurationBucket = getTripsByDurationBucket(filteredRecords);
  const dailyTripsTrend = getDailyTripsTrend(filteredRecords);
  const stationAvgDuration = getStationAvgDuration(filteredRecords);

  const topStationName =
    tripsByStation.length > 0 && totalTripsSum > 0 ? tripsByStation[0].station : 'N/A';

  const predominantBucketObj =
    totalTripsSum > 0
      ? [...tripsByDurationBucket].sort((a, b) => b.cantidadViajes - a.cantidadViajes)[0]
      : undefined;
  const predominantDurationBucket = predominantBucketObj ? predominantBucketObj.bucket : 'N/A';

  const executiveReport: MobilityWeeklyAnalysis | undefined =
    llmReport && llmReport.analisis && llmReport.analisis.length > 0
      ? llmReport.analisis[0]
      : undefined;

  return {
    totalTrips: totalTripsSum,
    weeklyTrips: totalTripsSum,
    totalDurationMinutes: Number(totalDurationSum.toFixed(1)),
    weightedAvgDurationMinutes,
    topStationName,
    predominantDurationBucket,
    tripsByStation,
    tripsByDurationBucket,
    dailyTripsTrend,
    stationAvgDuration,
    availableStations,
    records: filteredRecords,
    executiveReport,
    aiReport: llmReport as unknown as AIAnalysisReport,
  };
}
