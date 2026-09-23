import { analyticsApi } from '../api/analyticsApi';
import type {
  ClaimApiRecord,
  CultureApiRecord,
  EmergencyApiRecord,
  MobilityApiRecord,
  WasteApiRecord,
} from '../api/types';
import { getClaimsAnalyticsData as calculateClaimsAnalyticsData } from '../services/claimsService';
import { getMobilityAnalyticsData as calculateMobilityAnalyticsData } from '../services/mobilityService';
import type {
  BackendAnalyticsRecord,
  BackendMobilityRecord,
  ClaimsAnalyticsData,
  CultureAnalyticsData,
  DashboardFilters,
  EmergencyAnalyticsData,
  MobilityAnalyticsData,
  MobilityLLMReport,
  WasteAlertMetrics,
} from '../types';
import { isWithinDateRange } from '../utils/dates';

export type ClaimsDataSourceData = ClaimsAnalyticsData & {
  records: BackendAnalyticsRecord[];
};

function numberOrZero(value: number | null): number {
  return value ?? 0;
}

function textOrEmpty(value: string | null): string {
  return value ?? '';
}

function rowsInRange<T extends { fecha_snapshot: string | null }>(
  rows: T[],
  filters: DashboardFilters
): T[] {
  return rows.filter(
    (row) => !row.fecha_snapshot || isWithinDateRange(row.fecha_snapshot, filters)
  );
}

function weightedAverage(
  rows: Array<{ value: number; weight: number }>
): number {
  const totalWeight = rows.reduce((total, row) => total + row.weight, 0);
  if (totalWeight === 0) return 0;

  const total = rows.reduce((sum, row) => sum + row.value * row.weight, 0);
  return Number((total / totalWeight).toFixed(1));
}

function mapClaimRecord(row: ClaimApiRecord): BackendAnalyticsRecord {
  return {
    barrio: textOrEmpty(row.barrio),
    categoria: textOrEmpty(row.categoria),
    prioridad: textOrEmpty(row.prioridad),
    origenClasificacion: textOrEmpty(row.origenClasificacion),
    estado_actual: textOrEmpty(row.estado_actual),
    row_count: numberOrZero(row.row_count),
    tiempo_prom_hasta_estado_actual: numberOrZero(
      row.tiempo_prom_hasta_estado_actual
    ),
    fecha_snapshot: textOrEmpty(row.fecha_snapshot),
  };
}

export async function getApiClaimsAnalyticsData(
  filters: DashboardFilters
): Promise<ClaimsDataSourceData> {
  const rows = await analyticsApi.getClaims();
  const records = rows.map(mapClaimRecord);
  const analytics = await calculateClaimsAnalyticsData(filters, records);

  return { ...analytics, records };
}

export function mapEmergencyApiData(
  rows: EmergencyApiRecord[],
  filters: DashboardFilters
): EmergencyAnalyticsData {
  const filtered = rowsInRange(rows, filters);
  const stateCounts = new Map<string, number>();
  const priorityCounts = new Map<string, number>();

  filtered.forEach((row) => {
    const count = numberOrZero(row.cantidadEmergencias);
    const state = textOrEmpty(row.estado_actual) || 'SIN ESTADO';
    const priority = textOrEmpty(row.prioridad).toUpperCase() || 'SIN PRIORIDAD';
    stateCounts.set(state, (stateCounts.get(state) ?? 0) + count);
    priorityCounts.set(priority, (priorityCounts.get(priority) ?? 0) + count);
  });

  const closedStates = new Set([
    'cerrada',
    'cerrado',
    'resuelta',
    'descartada',
    'rechazado',
  ]);
  let closedCount = 0;
  let activeCount = 0;
  stateCounts.forEach((count, state) => {
    if (closedStates.has(state.toLowerCase())) closedCount += count;
    else activeCount += count;
  });

  const dispatchRows = filtered.map((row) => ({
    priority: textOrEmpty(row.prioridad).toUpperCase() || 'SIN PRIORIDAD',
    value: numberOrZero(row.tiempoPromRespuestaDespacho),
    weight: numberOrZero(row.cantidadEmergencias),
  }));
  const dispatchByPriority = new Map<string, Array<{ value: number; weight: number }>>();
  dispatchRows.forEach(({ priority, value, weight }) => {
    const values = dispatchByPriority.get(priority) ?? [];
    values.push({ value, weight });
    dispatchByPriority.set(priority, values);
  });

  return {
    totalEmergencies: activeCount + closedCount,
    activeCount,
    closedCount,
    emergenciesByState: Array.from(stateCounts, ([state, count]) => ({ state, count })),
    emergenciesByPriority: Array.from(priorityCounts, ([priority, count]) => ({
      priority,
      count,
    })),
    avgDispatchTimeMinutes: weightedAverage(dispatchRows),
    avgDispatchTimeByPriority: Array.from(
      dispatchByPriority,
      ([priority, values]) => ({ priority, minutes: weightedAverage(values) })
    ),
    // El endpoint actual no informa categoria.
    emergenciesByCategoryStacked: [],
    availableCategories: [],
  };
}

export async function getApiEmergencyAnalyticsData(
  filters: DashboardFilters
): Promise<EmergencyAnalyticsData> {
  return mapEmergencyApiData(await analyticsApi.getEmergencies(), filters);
}

export async function mapMobilityApiData(
  rows: MobilityApiRecord[],
  filters: DashboardFilters
): Promise<MobilityAnalyticsData> {
  const records: BackendMobilityRecord[] = rows.map((row) => ({
    fechaInicio: textOrEmpty(row.fechaInicio),
    estacionInicio: textOrEmpty(row.estacionInicio),
    duracionViaje: textOrEmpty(row.duracionViaje),
    cantidadViajes: numberOrZero(row.cantidadViajes),
    duracionTotalViajes: numberOrZero(row.duracionTotalViajes),
    promDuracion: numberOrZero(row.promDuracion),
    fecha_snapshot: textOrEmpty(row.fecha_snapshot),
  }));
  const emptyLlmReport: MobilityLLMReport = {
    actualizado_en: '',
    analisis: [],
    caso_de_uso: '',
    semanas: [],
    ultima_semana: '',
    version_esquema: '',
  };
  const analytics = await calculateMobilityAnalyticsData(filters, records, emptyLlmReport);

  return { ...analytics, executiveReport: undefined, aiReport: undefined };
}

export async function getApiMobilityAnalyticsData(
  filters: DashboardFilters
): Promise<MobilityAnalyticsData> {
  return await mapMobilityApiData(await analyticsApi.getMobility(), filters);
}

export function mapCultureApiData(
  rows: CultureApiRecord[],
  filters: DashboardFilters
): CultureAnalyticsData {
  const filtered = rowsInRange(rows, filters);
  const confirmedReservations = filtered.reduce(
    (total, row) => total + numberOrZero(row.cantidadConfirmadas),
    0
  );
  const cancelledReservations = filtered.reduce(
    (total, row) => total + numberOrZero(row.cantidadCanceladas),
    0
  );
  const totalReservations = confirmedReservations + cancelledReservations;
  const inscriptionsByCategory = new Map<string, number>();

  filtered.forEach((row) => {
    const category = textOrEmpty(row.categoria).toUpperCase() || 'SIN CATEGORIA';
    inscriptionsByCategory.set(
      category,
      (inscriptionsByCategory.get(category) ?? 0) + numberOrZero(row.inscriptos)
    );
  });

  return {
    confirmedReservations,
    cancelledReservations,
    cancellationRatePct:
      totalReservations === 0
        ? 0
        : Number(((cancelledReservations / totalReservations) * 100).toFixed(1)),
    reservationsBySpace: filtered.map((row) => ({
      space: textOrEmpty(row.recursoId) || 'SIN RECURSO',
      confirmed: numberOrZero(row.cantidadConfirmadas),
      cancelled: numberOrZero(row.cantidadCanceladas),
    })),
    totalInscriptions: filtered.reduce(
      (total, row) => total + numberOrZero(row.inscriptos),
      0
    ),
    inscriptionsByEvent: filtered.map((row) => ({
      eventTitle: textOrEmpty(row.recursoId) || 'SIN RECURSO',
      registered: numberOrZero(row.inscriptos),
      capacity: numberOrZero(row.cupoMaximo),
      occupancyPct: numberOrZero(row.pctOcupacion),
    })),
    inscriptionsByCategory: Array.from(
      inscriptionsByCategory,
      ([category, count]) => ({ category, count })
    ),
    avgOccupancyRatePct: weightedAverage(
      filtered.map((row) => ({
        value: numberOrZero(row.pctOcupacion),
        weight: Math.max(1, numberOrZero(row.cantidadTotal)),
      }))
    ),
  };
}

export async function getApiCultureAnalyticsData(
  filters: DashboardFilters
): Promise<CultureAnalyticsData> {
  return mapCultureApiData(await analyticsApi.getCulture(), filters);
}

export function mapWasteApiData(
  rows: WasteApiRecord[],
  filters: DashboardFilters
): WasteAlertMetrics {
  const rowsForPeriod = rowsInRange(rows, filters);
  let filtered = [...rowsForPeriod];

  if (filters.zone && filters.zone !== 'all') {
    filtered = filtered.filter(
      (row) => textOrEmpty(row.zona).toLowerCase() === filters.zone!.toLowerCase()
    );
  }

  const selectedAlertType = filters.wasteType || filters.category;
  if (selectedAlertType && selectedAlertType !== 'all') {
    filtered = filtered.filter(
      (row) =>
        textOrEmpty(row.tipoAlerta).toLowerCase() === selectedAlertType.toLowerCase()
    );
  }

  if (filters.search) {
    const query = filters.search.toLowerCase();
    filtered = filtered.filter((row) =>
      [row.zona, row.tipoAlerta, row.prioridad, row.rangoNivelLlenado].some((value) =>
        textOrEmpty(value).toLowerCase().includes(query)
      )
    );
  }

  const fillRangeCounts = new Map<string, number>();
  const alertTypeCounts = new Map<string, number>();
  const priorityCounts = new Map<string, number>();
  const zoneRows = new Map<string, Array<{ value: number; weight: number }>>();

  filtered.forEach((row) => {
    const alerts = numberOrZero(row.cantidadAlertas);
    const resolved = numberOrZero(row.cantidadResueltas);
    const fillRange = textOrEmpty(row.rangoNivelLlenado) || 'SIN RANGO';
    const alertType = textOrEmpty(row.tipoAlerta) || 'SIN TIPO';
    const priority = textOrEmpty(row.prioridad) || 'SIN PRIORIDAD';
    const zone = textOrEmpty(row.zona) || 'SIN ZONA';

    fillRangeCounts.set(fillRange, (fillRangeCounts.get(fillRange) ?? 0) + alerts);
    alertTypeCounts.set(alertType, (alertTypeCounts.get(alertType) ?? 0) + alerts);
    priorityCounts.set(priority, (priorityCounts.get(priority) ?? 0) + alerts);

    const values = zoneRows.get(zone) ?? [];
    values.push({
      value: numberOrZero(row.tiempoPromResolucion),
      weight: resolved,
    });
    zoneRows.set(zone, values);
  });

  const totalAlerts = filtered.reduce(
    (total, row) => total + numberOrZero(row.cantidadAlertas),
    0
  );
  const resolvedAlerts = filtered.reduce(
    (total, row) => total + numberOrZero(row.cantidadResueltas),
    0
  );

  return {
    mode: 'alerts',
    totalAlerts,
    resolvedAlerts,
    resolutionRatePct:
      totalAlerts > 0 ? Number(((resolvedAlerts / totalAlerts) * 100).toFixed(1)) : 0,
    avgResolutionTime: weightedAverage(
      filtered.map((row) => ({
        value: numberOrZero(row.tiempoPromResolucion),
        weight: numberOrZero(row.cantidadResueltas),
      }))
    ),
    alertsByFillRange: Array.from(fillRangeCounts, ([range, count]) => ({
      range,
      count,
    })),
    alertsByType: Array.from(alertTypeCounts, ([alertType, count]) => ({
      alertType,
      count,
    })),
    alertsByPriority: Array.from(priorityCounts, ([priority, count]) => ({
      priority,
      count,
    })),
    avgResolutionTimeByZone: Array.from(zoneRows, ([zone, values]) => ({
      zone,
      value: weightedAverage(values),
    })),
    details: filtered.map((row, index) => ({
      id: [
        textOrEmpty(row.zona),
        textOrEmpty(row.tipoAlerta),
        textOrEmpty(row.prioridad),
        textOrEmpty(row.rangoNivelLlenado),
        index,
      ].join('-'),
      zone: textOrEmpty(row.zona) || 'SIN ZONA',
      alertType: textOrEmpty(row.tipoAlerta) || 'SIN TIPO',
      priority: textOrEmpty(row.prioridad) || 'SIN PRIORIDAD',
      fillRange: textOrEmpty(row.rangoNivelLlenado) || 'SIN RANGO',
      alerts: numberOrZero(row.cantidadAlertas),
      resolved: numberOrZero(row.cantidadResueltas),
      avgResolutionTime: numberOrZero(row.tiempoPromResolucion),
    })),
    availableZones: Array.from(
      new Set(rowsForPeriod.map((row) => textOrEmpty(row.zona)).filter(Boolean))
    ).sort(),
    availableAlertTypes: Array.from(
      new Set(rowsForPeriod.map((row) => textOrEmpty(row.tipoAlerta)).filter(Boolean))
    ).sort(),
  };
}

export async function getApiWasteAnalyticsData(
  filters: DashboardFilters
): Promise<WasteAlertMetrics> {
  return mapWasteApiData(await analyticsApi.getWaste(), filters);
}
