import type { CrossModuleResponse } from '../../api/types';
import { PART2_METRICS } from '../../config/crossModuleMetrics';
import { countRoadAffectedInterventions } from '../../utils/wasteInterventions';
import { BarChart } from '../charts/BarChart';
import { CausePie } from '../common/CausePie';
import { ChartCard } from '../common/ChartCard/ChartCard';
import { MetricCard } from '../common/MetricCard/MetricCard';

export function WasteIncidentMetric({ report }: { report: CrossModuleResponse | null }) {
  const metric = report?.datos.find(({ id }) => id === 'c4');
  const rawCount = report?.intervenciones
    ? countRoadAffectedInterventions(report.intervenciones)
    : undefined;
  return <MetricCard metric={{
    label: PART2_METRICS.waste[3][0],
    value: metric?.valor ?? rawCount ?? 'Sin datos',
    sublabel: 'Paradas distintas afectadas',
    status: 'warning',
  }} />;
}

export function WasteAffectedMetric({ report }: { report: CrossModuleResponse | null }) {
  const routes = new Set([
    ...(report?.afectaciones?.recorridos_eventos ?? []),
    ...(report?.afectaciones?.recorridos_efectos ?? []),
  ].map(({ recorrido_id }) => recorrido_id));
  const complete = report?.contexto_territorial
    ? report.contexto_territorial.cobertura.includes('recorrido_residuos') && (report.eventos_zona ?? []).every((event) => event.recorridos_cercanos != null)
    : report?.afectaciones?.recorridos_eventos != null || report?.afectaciones?.recorridos_efectos != null;
  return <MetricCard metric={{
    label: 'Recorridos afectados por eventos',
    value: complete ? routes.size : routes.size || 'Sin datos',
    sublabel: 'Recorridos distintos con afectación registrada',
    status: 'info',
  }} />;
}

export function WasteAffected({ report, zones }: { report: CrossModuleResponse | null; zones: string[] }) {
  const interventions = report?.resumen_gold?.find(({ id }) => id === 'waste-cause');
  const alerts = report?.resumen_gold?.find(({ id }) => id === 'waste-alerts');
  return (
    <section className="section" id="eventos-afectados-por-residuos" aria-label="Eventos afectados por residuos">
      <h2 className="section-title">Eventos afectados por residuos</h2>
      <CausePie title="Intervenciones por causa publicada" points={interventions?.puntos ?? []}
        date={interventions?.fecha_snapshot} description="Cantidad de intervenciones" unit=" intervenciones"
        filters={{
          scope: 'zona',
          options: [...zones, ...(alerts?.puntos.map(({ etiqueta }) => etiqueta) ?? [])],
          groups: report?.afectaciones?.zonas ?? [],
        }} />
      {alerts && (
        <ChartCard title="Alertas de residuos por zona" subtitle="Cantidad de alertas registradas en cada zona">
          <BarChart data={alerts.puntos} xKey="etiqueta" bars={[{ key: 'valor', label: 'Alertas' }]}
            height={300} xAxisTickAngle={-28} scrollable />
        </ChartCard>
      )}
    </section>
  );
}
