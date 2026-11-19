import { analyticsApi } from '../api/analyticsApi';
import { embeddedApi } from '../api/embeddedApi';
import { getDataSource } from './dataSource';
import type {
  ClaimApiRecord,
  CultureActivityApiRecord,
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
  WasteDashboardData,
} from '../types';
import { isWithinDateRange } from '../utils/dates';
import { activityCategory, activityOrganizer, emergencyCause, emergencyPriority } from '../utils/categories';
import { isInterventionResponse, mapWasteInterventions } from '../services/wasteInterventionService';

export type ClaimsDataSourceData = ClaimsAnalyticsData & {
  records: BackendAnalyticsRecord[];
};

function getAnalyticsApi(): Pick<typeof analyticsApi,
  'getClaims' | 'getEmergencies' | 'getMobility' | 'getCulture' | 'getWaste'> {
  return getDataSource() === 'embedded' ? embeddedApi : analyticsApi;
}

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
    causaTipo: row.causaTipo,
    vinculadoEmergenciaBici: row.vinculadoEmergenciaBici,
    afectaOtrosModulos: row.afectaOtrosModulos,
    row_count: numberOrZero(row.row_count),
    tiempo_prom_hasta_estado_actual: row.tiempo_prom_hasta_estado_actual,
    fecha_snapshot: textOrEmpty(row.fecha_snapshot),
  };
}

export async function getApiClaimsAnalyticsData(
  filters: DashboardFilters
): Promise<ClaimsDataSourceData> {
  const respuesta = await getAnalyticsApi().getClaims();

  const records = respuesta.datos.map(mapClaimRecord);
  const analytics = await calculateClaimsAnalyticsData(filters, records);

  return {
    ...analytics,
    records,
    aiReport: respuesta.informe,
  };
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
    const state = textOrEmpty(row.estado_actual).trim() || 'SIN ESTADO';
    const priority = emergencyPriority(row.prioridad);
    stateCounts.set(state, (stateCounts.get(state) ?? 0) + count);
    priorityCounts.set(priority, (priorityCounts.get(priority) ?? 0) + count);
  });

  const closedStates = new Set([
    'cancelada',
    'cerrada',
    'cerrado',
    'resuelta',
    'descartada',
    'rechazado',
  ]);
  let closedCount = 0;
  let activeCount = 0;
  let unknownStateCount = 0;
  stateCounts.forEach((count, state) => {
    if (state.trim().replaceAll('_', ' ').toUpperCase() === 'SIN ESTADO') unknownStateCount += count;
    else if (closedStates.has(state.toLowerCase())) closedCount += count;
    else activeCount += count;
  });
  const caseMetrics: NonNullable<EmergencyAnalyticsData['caseMetrics']> = [];
  if (filtered.every((row) => row.causaTipo !== undefined)) {
    const incidents = filtered.filter((row) => row.causaTipo?.trim().toUpperCase() === 'INCIDENTE_VIAL');
    const count = incidents.reduce((total, row) => total + numberOrZero(row.cantidadEmergencias), 0);
    caseMetrics.push({ id: 'c4', valor: count });
    // No linked emergencies implies no incident-linked dispatches. With incidents present,
    // current state alone cannot establish how many distinct resources were sent.
    if (count === 0) caseMetrics.push({ id: 'c4b', valor: 0 });
    if (filtered.every((row) => row.categoria !== undefined)) caseMetrics.push({ id: 'c3', valor: filtered
      .filter((row) => row.categoria?.trim().toUpperCase() === 'PREVENTIVA' && row.causaTipo?.trim().toUpperCase() === 'EVENTO_PUBLICO')
      .reduce((total, row) => total + numberOrZero(row.cantidadEmergencias), 0) });
  }

  const categories = new Map<string, EmergencyAnalyticsData['emergenciesByCategoryStacked'][number]>();
  for (const row of filtered) {
    const category = textOrEmpty(row.categoria ?? null).trim() || 'Sin categoría informada';
    const priority = emergencyPriority(row.prioridad);
    const counts = categories.get(category) ?? { category, BAJA: 0, MEDIA: 0, ALTA: 0, CRITICA: 0, total: 0 };
    const count = numberOrZero(row.cantidadEmergencias);
    if (priority === 'BAJA' || priority === 'MEDIA' || priority === 'ALTA' || priority === 'CRITICA') counts[priority] += count;
    else counts.SIN_PRIORIDAD = (counts.SIN_PRIORIDAD ?? 0) + count;
    counts.total += count;
    categories.set(category, counts);
  }
  const dispatchRows = filtered.filter(({ tiempoPromRespuestaDespacho, cantidadEmergencias }) =>
    tiempoPromRespuestaDespacho != null && Number.isFinite(tiempoPromRespuestaDespacho) && tiempoPromRespuestaDespacho >= 0 && (cantidadEmergencias ?? 0) > 0).map((row) => ({
    priority: emergencyPriority(row.prioridad),
    value: numberOrZero(row.tiempoPromRespuestaDespacho),
    weight: numberOrZero(row.cantidadEmergencias),
  }));
  const dispatchByPriority = new Map<string, Array<{ value: number; weight: number }>>();
  dispatchRows.forEach(({ priority, value, weight }) => {
    const values = dispatchByPriority.get(priority) ?? [];
    values.push({ value, weight });
    dispatchByPriority.set(priority, values);
  });
  const arrivalRows = filtered.flatMap(({ tiempoPromRespuestaLugar, cantidadEmergencias }) =>
    tiempoPromRespuestaLugar != null && Number.isFinite(tiempoPromRespuestaLugar) && tiempoPromRespuestaLugar >= 0 && cantidadEmergencias != null && cantidadEmergencias > 0
      ? [{ value: tiempoPromRespuestaLugar, weight: cantidadEmergencias }]
      : [],
  );

  const causes = new Map<string, number>([[emergencyCause('INCIDENTE_VIAL'), 0]]);
  const resolutions = new Map<string, Array<{ value: number; weight: number }>>();
  for (const row of filtered) {
    const label = emergencyCause(row.causaTipo);
    causes.set(label, (causes.get(label) ?? 0) + numberOrZero(row.cantidadEmergencias));
    if (row.tiempoPromResolucion != null && Number.isFinite(row.tiempoPromResolucion) &&
        row.tiempoPromResolucion >= 0 && (row.cantidadEmergencias ?? 0) > 0) {
      const values = resolutions.get(label) ?? [];
      values.push({ value: row.tiempoPromResolucion, weight: row.cantidadEmergencias! });
      resolutions.set(label, values);
    }
  }

  return {
    affectedCriticalityCount: filtered.every((row) => typeof row.criticidadAfectada === 'number' && Number.isFinite(row.criticidadAfectada) && row.criticidadAfectada >= 0)
      ? filtered.reduce((sum, row) => sum + row.criticidadAfectada!, 0) : undefined,
    circulationAffectedCount: filtered.some((row) => typeof row.afectaCirculacion === 'boolean') || filtered.length === 0
      ? filtered.filter((row) => row.afectaCirculacion === true).reduce((sum, row) => sum + numberOrZero(row.cantidadEmergencias), 0) : undefined,
    circulationUnknownCount: filtered.filter((row) => typeof row.afectaCirculacion !== 'boolean').reduce((sum, row) => sum + numberOrZero(row.cantidadEmergencias), 0),
    totalEmergencies: activeCount + closedCount + unknownStateCount,
    activeCount,
    unknownStateCount,
    caseMetrics,
    closedCount,
    emergenciesByState: Array.from(stateCounts, ([state, count]) => ({ state, count })),
    emergenciesByPriority: Array.from(priorityCounts, ([priority, count]) => ({
      priority,
      count,
    })),
    avgDispatchTimeMinutes: dispatchRows.length ? weightedAverage(dispatchRows) : undefined,
    avgArrivalTimeMinutes: arrivalRows.length > 0 ? weightedAverage(arrivalRows) : undefined,
    avgDispatchTimeByPriority: Array.from(
      dispatchByPriority,
      ([priority, values]) => ({ priority, minutes: weightedAverage(values) })
    ),
    emergenciesByCategoryStacked: [...categories.values()],
    availableCategories: [...categories.keys()],
    emergenciesByCause: [...causes].map(([etiqueta, valor]) => ({ etiqueta, valor })),
    resolutionByCause: [...resolutions].map(([etiqueta, values]) => ({ etiqueta, valor: weightedAverage(values) })),
  };
}

export async function getApiEmergencyAnalyticsData(
  filters: DashboardFilters
): Promise<EmergencyAnalyticsData> {
  const respuesta = await getAnalyticsApi().getEmergencies();
  const analytics = mapEmergencyApiData(respuesta.datos, filters);

  return {
    ...analytics,
    aiReport: respuesta.informe,
  };
}

export async function mapMobilityApiData(
  rows: MobilityApiRecord[],
  filters: DashboardFilters
): Promise<MobilityAnalyticsData> {
  const records: BackendMobilityRecord[] = rows.map((row) => ({
    causaTipo: textOrEmpty(row.causaTipo),
    cantidadAfectaciones: numberOrZero(row.cantidadAfectaciones),
    estacionesAfectadasDistintas: numberOrZero(row.estacionesAfectadasDistintas),
    cantidadBloqueadas: numberOrZero(row.cantidadBloqueadas),
    estacionesBloqueadasDistintas: numberOrZero(row.estacionesBloqueadasDistintas),
    cantidadPreventivas: numberOrZero(row.cantidadPreventivas),
    cantidadRestauradas: numberOrZero(row.cantidadRestauradas),
    cantidadViajesInterrumpidos: numberOrZero(row.cantidadViajesInterrumpidos),
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
  const respuesta = await getAnalyticsApi().getMobility();
  const analytics = await mapMobilityApiData(respuesta.datos, filters);

  return {
    ...analytics,
    aiReport: respuesta.informe,
  };
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
  const { datos, informe } = await getAnalyticsApi().getCulture();
  const first = datos[0];
  if (first && 'cantidadActividades' in first) {
    const rows = rowsInRange(datos as CultureActivityApiRecord[], filters);
    const categories = new Map<string, number>();
    let total = 0;
    let massive = 0;
    let affectedByClimate: number | null = null;
    const organizers = new Map<string, number>();
    const zones = new Map<string, number>();
    const causes = new Map<string, number>();
    for (const row of rows) {
      const count = numberOrZero(row.cantidadActividades);
      const category = activityCategory(row.categoria);
      categories.set(category, (categories.get(category) ?? 0) + count);
      const organizer = activityOrganizer(row.organizadorTipo);
      if (organizer) organizers.set(organizer, (organizers.get(organizer) ?? 0) + count);
      const zone = row.zona?.trim() || row.barrio?.trim() || 'Sin zona informada';
      zones.set(zone, (zones.get(zone) ?? 0) + count);
      total += count;
      const cause = row.causaTipo?.trim().toUpperCase();
      if (cause) causes.set(cause, (causes.get(cause) ?? 0) + count);
      massive += numberOrZero(row.cantidadMasivas);
      if (row.cantidadAfectadasPorClima != null) affectedByClimate = (affectedByClimate ?? 0) + row.cantidadAfectadasPorClima;
    }
    const citizens = organizers.get('CIUDADANO') ?? 0;
    const city = organizers.get('CIUDAD') ?? 0;
    const caseMetrics: NonNullable<NonNullable<CultureAnalyticsData['activities']>['caseMetrics']> = [
      { id: 'c3', valor: massive },
      { id: 'c6', valor: citizens, detalle: [{ etiqueta: 'Total de actividades', valor: total },
        { etiqueta: 'Organizadas por la ciudad', valor: city },
        { etiqueta: 'Sin organizador informado', valor: total - [...organizers.values()].reduce((sum, value) => sum + value, 0) }] },
    ];
    if (rows.every((row) => row.causaTipo !== undefined)) {
      for (const [id, cause] of [['c2', 'RECLAMO'], ['c4', 'INCIDENTE_VIAL'], ['c5', 'ACCIDENTE_VIAL']]) {
        caseMetrics.push({ id, valor: causes.get(cause) ?? 0 });
      }
      if (rows.every((row) => row.estado_actual !== undefined)) caseMetrics.push({ id: 'c1', valor: rows
        .filter((row) => row.categoria?.trim().toUpperCase() === 'CULTURAL' && row.causaTipo?.trim().toUpperCase() === 'EVENTO_CLIMATICO'
          && ['CANCELADA', 'SUSPENDIDA'].includes(row.estado_actual?.trim().toUpperCase() ?? ''))
        .reduce((sum, row) => sum + numberOrZero(row.cantidadActividades), 0) });
    }
    const causeLabels: Record<string, string> = { EVENTO_CLIMATICO: 'Clima', RECLAMO: 'Reclamo', INCIDENTE_VIAL: 'Incidente vial', ACCIDENTE_VIAL: 'Accidente vial' };
    const cumulativeCauseChanges = ([['totalVecesEventoClimatico', 'Clima'], ['totalVecesReclamo', 'Reclamo'],
      ['totalVecesIncidenteVial', 'Incidente vial'], ['totalVecesAccidenteVial', 'Accidente vial']] as const).flatMap(([field, etiqueta]) =>
      rows.every((row) => typeof row[field] === 'number' && Number.isFinite(row[field]) && row[field]! >= 0)
        ? [{ etiqueta, valor: rows.reduce((sum, row) => sum + row[field]!, 0) }] : []);
    return {
      ...mapCultureApiData([], filters),
      activities: { total, massive, affectedByClimate, caseMetrics, cumulativeCauseChanges,
        byCause: rows.every((row) => row.causaTipo !== undefined) ? [...causes].map(([cause, valor]) => ({ etiqueta: causeLabels[cause] ?? cause, valor })) : undefined,
        byOrganizer: [...organizers].map(([organizer, count]) => ({ organizer, count })),
        byZone: [...zones].map(([zone, count]) => ({ zone, count })),
        byCategory: [...categories].map(([category, count]) => ({ category, count })) },
      aiReport: informe,
    };
  }
  return { ...mapCultureApiData(datos as CultureApiRecord[], filters), aiReport: informe };
}

export function mapWasteApiData(
  rows: WasteApiRecord[],
  filters: DashboardFilters
): WasteDashboardData {
  if (isInterventionResponse(rows)) return mapWasteInterventions(rows, filters);
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
): Promise<WasteDashboardData> {
  const respuesta = await getAnalyticsApi().getWaste();
  const analytics = mapWasteApiData(respuesta.datos, filters);

  return {
    ...analytics,
    aiReport: respuesta.informe,
  };
}
