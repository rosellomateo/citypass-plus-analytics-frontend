import type { CrossModuleMetric, CrossModuleResponse } from '../api/types';
import type { ClaimsAnalyticsData } from '../types';

function labelKey(value: string) {
  return value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[_\s]+/g, ' ');
}

/** These published points are counts per cause, not a list of stations to deduplicate again. */
export function mobilityMetricFallbacks(report: CrossModuleResponse | null): CrossModuleMetric[] {
  const points = report?.resumen_gold?.find(({ id }) => id === 'mobility-stations')?.puntos;
  const metrics: CrossModuleMetric[] = [];
  for (const [id, label] of [['c2', 'RECLAMO'], ['c3', 'EVENTO PUBLICO'], ['c4', 'INCIDENTE VIAL'], ['c6', 'RESERVA']]) {
    const point = points?.find(({ etiqueta }) => labelKey(etiqueta) === label);
    if (point) metrics.push({ id, valor: point.valor });
  }
  const completed = report?.datos.find(({ id }) => id === 'c5')?.detalle
    ?.find(({ etiqueta }) => labelKey(etiqueta) === 'VIAJES FINALIZADOS NORMALMENTE');
  const normal = report?.resumen_gold?.find(({ id }) => id === 'mobility-interruptions')?.puntos
    .find(({ etiqueta }) => labelKey(etiqueta) === 'OPERACION NORMAL');
  if (completed || normal) metrics.push({ id: 'c5b', valor: (completed ?? normal)!.valor });
  return metrics;
}

/** For the requested claim metrics, the criterion is the received causaTipo, not incident scheduling. */
export function claimCauseMetrics(causes: ClaimsAnalyticsData['claimsByCause']): CrossModuleMetric[] {
  if (!causes) return [];
  return [['c4', 'INCIDENTE_VIAL'], ['c6', 'RESERVA']].map(([id, cause]) => ({
    id, valor: causes.find((row) => row.cause === cause)?.count ?? 0,
  }));
}
