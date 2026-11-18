import type { ClaimsAnalyticsData, Metric } from '../../types';
import type { CrossModuleResponse } from '../../api/types';
import { PART2_METRICS } from '../../config/crossModuleMetrics';
import { MetricCard } from './MetricCard/MetricCard';
import { claimCauseMetrics, mobilityMetricFallbacks } from '../../utils/impactMetrics';

export function DashboardImpactCards({ area, data, standalone = false, excludeIds = [], claimCauses, showMissing = false }: {
  area: keyof typeof PART2_METRICS;
  data: CrossModuleResponse | null;
  standalone?: boolean;
  excludeIds?: readonly string[];
  claimCauses?: ClaimsAnalyticsData['claimsByCause'];
  showMissing?: boolean;
}) {
  if (!data && !showMissing && !claimCauses) return null;
  const compatible = area !== 'culture' || data?.version_cultura === 2;
  const metrics = new Map((area === 'mobility' ? mobilityMetricFallbacks(data) : []).map((metric) => [metric.id, metric]));
  for (const metric of compatible ? data?.datos ?? [] : []) metrics.set(metric.id, metric);
  if (area === 'claims') for (const metric of claimCauseMetrics(claimCauses)) metrics.set(metric.id, metric);
  const cards: Metric[] = PART2_METRICS[area].flatMap((labels, index) =>
    labels.flatMap((label, metricIndex) => {
      const id = `c${index + 1}${metricIndex === 0 ? '' : 'b'}`;
      const metric = metrics.get(id);
      if ((!metric && !showMissing) || excludeIds.includes(id)) return [];
      const detail = area === 'claims' && id === 'c2' ? 'Reclamos distintos con vínculos a otros servicios'
        : area === 'waste' && id === 'c2' ? undefined : metric?.detalle
        ?.map(({ etiqueta, valor }) => `${etiqueta}: ${valor.toLocaleString('es-AR')}`).join(' · ');
      return [{ label, value: metric?.valor ?? 'Sin datos', unit: metric?.unidad ?? undefined,
        sublabel: area === 'mobility' && id === 'c5' ? undefined : detail || undefined, status: 'info' }];
    }),
  );
  if (data?.eventos_publicos && (area === 'culture' || area === 'emergencies')) {
    cards.push({
      label: 'Eventos públicos con emergencias vinculadas',
      value: data.eventos_publicos.length,
      sublabel: 'Eventos distintos según su identificador',
      status: 'info',
    });
  }
  if (cards.length === 0) return null;
  const content = cards.map((metric) => <MetricCard key={metric.label} metric={metric} />);
  return standalone ? <div className="section"><div className="metrics-grid-3">{content}</div></div> : <>{content}</>;
}
