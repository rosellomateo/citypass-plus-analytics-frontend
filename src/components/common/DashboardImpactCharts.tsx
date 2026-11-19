import type { CausePoint, CrossModuleResponse } from '../../api/types';
import type { ClaimsAnalyticsData, EmergencyAnalyticsData } from '../../types';
import { claimCauseMetrics } from '../../utils/impactMetrics';
import { BarChart } from '../charts/BarChart';
import { ChartCard } from './ChartCard/ChartCard';

const CLAIM_CAUSES = { c1: 'Alertas climáticas', c2: 'Afectaron a otros módulos', c3: 'Eventos masivos', c4: 'Incidentes viales', c6: 'Reservas de espacios públicos' };

export function DashboardImpactCharts({ area, data, emergencyData, claimCauses }: {
  area: 'claims' | 'emergencies';
  data: CrossModuleResponse | null;
  emergencyData?: EmergencyAnalyticsData | null;
  claimCauses?: ClaimsAnalyticsData['claimsByCause'];
}) {
  const metrics = new Map(data?.datos.map((metric) => [metric.id, metric]) ?? []);
  if (area === 'claims') for (const metric of claimCauseMetrics(claimCauses)) metrics.set(metric.id, metric);
  const charts: { title: string; unit: string; points: (CausePoint & { color?: string })[] }[] = [];
  if (area === 'claims' && (data || claimCauses)) {
    const accident = metrics.get('c5');
    charts.push({
      title: 'Reclamos vinculados a otros servicios', unit: 'Reclamos',
      points: [
        ...Object.entries(CLAIM_CAUSES).flatMap(([id, etiqueta]) => {
          const metric = metrics.get(id);
          return metric ? [{ etiqueta, valor: metric.valor, color: '#2563A6' }] : [];
        }),
        ...(accident ? [{ etiqueta: 'Accidentes en bicicleta', valor: accident.valor, color: '#8FB8D8' },
          ...(accident.detalle ?? []).map((point) => ({ ...point, etiqueta: point.etiqueta === 'Otras causas' ? 'Otros reclamos viales' : point.etiqueta, color: '#2563A6' }))] : []),
      ],
    });
  }
  if (area === 'emergencies') {
    const resources = ['c4b'].flatMap((id) => {
      const metric = metrics.get(id);
      return metric ? [{ etiqueta: 'Incidentes viales', valor: metric.valor }] : [];
    });
    if (resources.length) charts.push({ title: 'Recursos enviados por tipo de evento', unit: 'Recursos o servicios enviados', points: resources });
    // Gold repeats the same resolution mean within each cause; it is not a category-specific mean.
    // The bicycle-only c5b remains in its own card and cannot fill the other causes.
    const resolutionPoints = emergencyData?.resolutionByCause ?? [];
    if (resolutionPoints.length) charts.push({ title: 'Tiempo de resolución promedio por emergencia', unit: 'Minutos por causa con promedio publicado', points: resolutionPoints });
  }
  const visible = charts.filter(({ points }) => points.length);
  if (!visible.length) return null;
  const snapshot = data?.fecha_snapshot ?? data?.actualizado_en?.slice(0, 10);
  const period = snapshot ? `Corte del ${snapshot.split('-').reverse().join('/')}` : '';
  return (
    <section className="section" aria-label="Impacto de otros servicios">
      <div className={visible.length === 1 ? undefined : 'charts-grid-2'}>
        {visible.map(({ title, unit, points }) => (
          <ChartCard key={title} title={title} subtitle={[unit, period].filter(Boolean).join(' · ')}>
            {points.length ? <BarChart data={points} xKey="etiqueta" bars={[{ key: 'valor', label: unit }]}
              colorField="color" height={Math.max(230, 45 + points.length * 40)} horizontal />
              : <p role="status">Sin tiempos de resolución publicados.</p>}
          </ChartCard>
        ))}
      </div>
    </section>
  );
}
