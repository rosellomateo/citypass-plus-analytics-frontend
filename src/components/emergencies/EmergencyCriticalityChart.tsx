import type { EmergencyAnalyticsData } from '../../types';
import { BarChart } from '../charts/BarChart';
import { ChartCard } from '../common/ChartCard/ChartCard';

export function EmergencyCriticalityChart({ data }: { data: EmergencyAnalyticsData }) {
  const points = data.affectedCriticalityByCause?.filter(({ valor }) => valor > 0).sort((a, b) => b.valor - a.valor);
  return <section className="section" aria-label="Cambios de criticidad">
    <ChartCard title="Emergencias con criticidad afectada" subtitle="Cambios de criticidad por causa informada">
      {points?.length ? <BarChart data={points} xKey="etiqueta" bars={[{ key: 'valor', label: 'Emergencias', color: '#C83E4D' }]}
        horizontal height={Math.max(260, points.length * 42 + 45)} />
        : <p role="status">{points ? 'No hay cambios de criticidad informados.' : 'Sin datos de cambios de criticidad.'}</p>}
    </ChartCard>
  </section>;
}
