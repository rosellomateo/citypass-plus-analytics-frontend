import type { CrossModuleMetric, CrossModuleResponse } from '../api/types';
import type { ClaimsAnalyticsData } from '../types';

function labelKey(value: string) {
  return value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[_\s]+/g, ' ');
}

/** Only the normal-trips detail has a known matching unit. The legacy
 * mobility-stations chart counts affectations, not distinct stations. */
export function mobilityMetricFallbacks(report: CrossModuleResponse | null): CrossModuleMetric[] {
  const metrics: CrossModuleMetric[] = [];
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

/** The old c5 used EMERGENCIA as a proxy and compared it with all claims.
 * Only an explicit bicycle link can establish the audited population. */
export function auditedClaimsImpact(report: CrossModuleResponse | null, comparison: ClaimsAnalyticsData['bicycleComparison']): CrossModuleResponse | null {
  if (!report && !comparison) return null;
  const datos = (report?.datos ?? []).filter(({ id }) => id !== 'c5');
  if (comparison) datos.push({ id: 'c5', valor: comparison.linked,
    detalle: [{ etiqueta: 'Otros reclamos viales', valor: comparison.otherRoad }] });
  return { ...report, fecha_snapshot: report?.fecha_snapshot ?? null, datos,
    resumen_gold: report?.resumen_gold?.map((chart) => ({ ...chart, puntos: chart.puntos.filter(({ etiqueta }) => labelKey(etiqueta) !== 'TEXTO') })) };
}
