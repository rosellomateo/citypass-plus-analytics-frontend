// src/services/mobilityService.ts
import type {
  DashboardFilters,
  BackendMobilityRecord,
  MobilityLLMReport,
  MobilityAnalyticsData,
  MobilityCauseItem,
  MobilityTripsItem,
  MobilityWeeklyAnalysis,
} from '../types';
import { delay } from '../utils';
import type { CrossModuleMetric } from '../api/types';

/** causaTipo de los viajes finalizados sin incidente (base del caso 5). */
export const CAUSA_NORMAL = 'NORMAL';

/** Mismas etiquetas que usa el backend en la Parte 2 (ETIQUETAS_CAUSA). */
export const CAUSE_LABELS: Record<string, string> = {
  EVENTO_CLIMATICO: 'Clima',
  RECLAMO: 'Reclamo',
  EVENTO_PUBLICO: 'Evento público',
  INCIDENTE_VIAL: 'Incidente vial',
  ACCIDENTE_VIAL: 'Accidente vial',
  EMERGENCIA: 'Emergencia',
  RESERVA: 'Reserva',
  NORMAL: 'Operación normal',
};

export function causeLabel(causa: string | null | undefined): string {
  const key = (causa ?? '').trim().toUpperCase();
  if (!key) return 'Sin causa informada';
  return CAUSE_LABELS[key] ?? key.replaceAll('_', ' ').toLowerCase();
}

/**
 * Gold publica una sola foto acumulada por causa: si llegan filas de mas de
 * un snapshot, se usa el mas reciente. La busqueda filtra por causa.
 */
export function getFilteredMobilityRecords(
  filters: DashboardFilters,
  records: BackendMobilityRecord[]
): BackendMobilityRecord[] {
  const latest = records.reduce((max, r) => (r.fecha_snapshot > max ? r.fecha_snapshot : max), '');
  let filtered = latest ? records.filter((r) => r.fecha_snapshot === latest) : [...records];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (r) => r.causaTipo.toLowerCase().includes(q) || causeLabel(r.causaTipo).toLowerCase().includes(q)
    );
  }
  return filtered;
}

/** Afectaciones de estaciones por causa (sin la fila NORMAL, que no es una afectacion). */
export function getAffectationsByCause(records: BackendMobilityRecord[]): MobilityCauseItem[] {
  return records
    .filter((r) => r.causaTipo !== CAUSA_NORMAL && r.cantidadAfectaciones > 0)
    .map((r) => ({
      causa: r.causaTipo,
      etiqueta: causeLabel(r.causaTipo),
      afectaciones: r.cantidadAfectaciones,
      estaciones: r.estacionesAfectadasDistintas,
      bloqueadas: r.cantidadBloqueadas,
      estacionesBloqueadas: r.estacionesBloqueadasDistintas,
      preventivas: r.cantidadPreventivas,
      restauradas: r.cantidadRestauradas,
    }))
    .sort((a, b) => b.afectaciones - a.afectaciones);
}

/** Viajes por causa de interrupcion, incluida la fila NORMAL (finalizados sin incidente). */
export function getTripsByCause(records: BackendMobilityRecord[]): MobilityTripsItem[] {
  return records
    .filter((r) => r.cantidadViajesInterrumpidos > 0)
    .map((r) => ({ causa: r.causaTipo, etiqueta: r.causaTipo === CAUSA_NORMAL ? 'Finalizados normalmente' : causeLabel(r.causaTipo), viajes: r.cantidadViajesInterrumpidos }))
    .sort((a, b) => b.viajes - a.viajes);
}

/**
 * Servicio analítico principal: KPIs y series del tablero de Movilidad a partir
 * del resumen por causa de gold.
 */
export async function getMobilityAnalyticsData(
  filters: DashboardFilters,
  records: BackendMobilityRecord[],
  llmReport: MobilityLLMReport
): Promise<MobilityAnalyticsData> {
  await delay();

  const filtered = getFilteredMobilityRecords(filters, records);
  const affectationsByCause = getAffectationsByCause(filtered);
  const tripsByCause = getTripsByCause(filtered);
  const sum = (key: keyof BackendMobilityRecord) =>
    filtered.reduce((total, r) => total + (r.causaTipo === CAUSA_NORMAL ? 0 : Number(r[key]) || 0), 0);

  const totalAffectations = sum('cantidadAfectaciones');
  const totalRestored = sum('cantidadRestauradas');
  const normalTrips = filtered
    .filter((r) => r.causaTipo === CAUSA_NORMAL)
    .reduce((total, r) => total + r.cantidadViajesInterrumpidos, 0);

  const executiveReport: MobilityWeeklyAnalysis | undefined =
    llmReport && llmReport.analisis && llmReport.analisis.length > 0 ? llmReport.analisis[0] : undefined;

  // Use the delivered count for each unit: preventive affectations are not
  // distinct stations, and EMERGENCIA does not certify a bicycle accident.
  const definitions = [
    ['c1', 'EVENTO_CLIMATICO', 'estacionesBloqueadasDistintas'],
    ['c2', 'RECLAMO', 'estacionesAfectadasDistintas'],
    ['c3', 'EVENTO_PUBLICO', 'cantidadPreventivas'],
    ['c4', 'INCIDENTE_VIAL', 'estacionesAfectadasDistintas'],
    ['c5', 'EMERGENCIA', 'cantidadViajesInterrumpidos'],
    ['c5b', 'NORMAL', 'cantidadViajesInterrumpidos'],
    ['c6', 'RESERVA', 'estacionesAfectadasDistintas'],
  ] as const;
  const caseMetrics: CrossModuleMetric[] = definitions.flatMap(([id, cause, field]) => {
    const matching = filtered.filter((row) => row.causaTipo === cause);
    return matching.length ? [{ id, valor: matching.reduce((sum, row) => sum + row[field], 0) }] : [];
  });
  return {
    caseMetrics,
    totalAffectations,
    totalBlocked: sum('cantidadBloqueadas'),
    totalPreventive: sum('cantidadPreventivas'),
    totalRestored,
    restoredPct: totalAffectations > 0 ? Number(((totalRestored / totalAffectations) * 100).toFixed(1)) : 0,
    interruptedTrips: sum('cantidadViajesInterrumpidos'),
    normalTrips,
    topCause: affectationsByCause[0]?.etiqueta ?? 'N/A',
    affectationsByCause,
    tripsByCause,
    availableCauses: Array.from(new Set(records.map((r) => causeLabel(r.causaTipo)))).sort(),
    snapshotDate: filtered[0]?.fecha_snapshot ?? '',
    records: filtered,
    executiveReport,
    aiReport: llmReport,
  };
}
