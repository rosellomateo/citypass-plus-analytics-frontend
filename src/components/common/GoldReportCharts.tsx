import type { GoldReportChart } from '../../api/types';
import { BarChart } from '../charts/BarChart';
import { ChartCard } from './ChartCard/ChartCard';
import { formatDate } from '../../utils/dates';

export function GoldReportCharts({ charts, title }: { charts?: GoldReportChart[]; title: string }) {
  if (!charts?.length) return null;
  return (
    <section className="section" aria-label={title}>
      <h2 className="section-title">{title}</h2>
      <div className="charts-grid-2">
        {charts.map(({ id, titulo, fecha_snapshot, puntos }) => (
          <ChartCard key={id} title={titulo} subtitle={`Al ${formatDate(`${fecha_snapshot}T12:00:00`)} · Resumen acumulado`}>
            <BarChart data={puntos} xKey="etiqueta" bars={[{ key: 'valor', label: 'Cantidad' }]}
              height={Math.max(200, 45 + puntos.length * 28)} horizontal />
          </ChartCard>
        ))}
      </div>
    </section>
  );
}
