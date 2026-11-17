import type { CausePoint, CrossModuleResponse } from '../../api/types';
import { BarChart } from '../charts/BarChart';
import { ChartCard } from './ChartCard/ChartCard';

const GROUPS = {
  claims: [{
    title: 'Reclamos vinculados a otros servicios', unit: 'Reclamos',
    labels: { c1: 'Alertas climáticas', c2: 'Afectaron a otros módulos', c3: 'Eventos masivos', c4: 'Incidentes programados', c6: 'Eventos ciudadanos' },
  }],
  emergencies: [
    {
      title: 'Emergencias vinculadas a otros servicios', unit: 'Emergencias',
      labels: { c1: 'Criticidad por clima', c2: 'Reclamos', c4: 'Incidentes programados', c5: 'Viajes en bicicleta', c6: 'Eventos ciudadanos' },
    },
    {
      title: 'Recursos enviados por tipo de evento', unit: 'Recursos o servicios enviados',
      labels: { c3: 'Eventos masivos', c4b: 'Incidentes programados' },
    },
  ],
};

export function DashboardImpactCharts({ area, data }: {
  area: keyof typeof GROUPS;
  data: CrossModuleResponse | null;
}) {
  if (!data) return null;
  const metrics = new Map(data.datos.map((metric) => [metric.id, metric]));
  const charts: { title: string; unit: string; points: CausePoint[] }[] = GROUPS[area].map(({ title, unit, labels }) => ({
    title,
    unit,
    points: Object.entries(labels).flatMap(([id, etiqueta]) => {
      const metric = metrics.get(id);
      return metric && etiqueta ? [{ etiqueta, valor: metric.valor }] : [];
    }),
  }));
  const accident = metrics.get('c5');
  if (area === 'claims' && accident) {
    charts.push({
      title: 'Reclamos viales por accidente en bicicleta y por otras causas',
      unit: 'Reclamos viales',
      points: [{ etiqueta: 'Por accidente en bici', valor: accident.valor }, ...(accident.detalle ?? [])],
    });
  }
  if (area === 'emergencies') {
    const resolution = metrics.get('c5b');
    if (resolution) {
      charts.push({
        title: 'Tiempo de resolución de emergencias en viajes en bicicleta',
        unit: resolution.unidad ?? 'Tiempo promedio',
        points: [{ etiqueta: 'Promedio', valor: resolution.valor }],
      });
    }
  }
  const visible = charts.filter(({ points }) => points.length > 0);
  if (visible.length === 0) return null;
  const snapshot = data.fecha_snapshot ?? data.actualizado_en?.slice(0, 10);
  const period = snapshot ? `Corte de eventos del ${snapshot.split('-').reverse().join('/')}` : 'Corte de eventos';
  return (
    <section className="section" aria-label="Impacto de otros servicios">
      <div className="charts-grid-2">
        {visible.map(({ title, unit, points }) => (
          <ChartCard key={title} title={title} subtitle={`${unit} · ${period}`}>
            <BarChart data={points} xKey="etiqueta" bars={[{ key: 'valor', label: 'Valor' }]}
              height={Math.max(180, 40 + points.length * 32)} horizontal />
          </ChartCard>
        ))}
      </div>
    </section>
  );
}
