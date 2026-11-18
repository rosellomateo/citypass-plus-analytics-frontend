import type { EmergencyAnalyticsData } from '../../types';
import { BarChart } from '../charts/BarChart';
import { ChartCard } from '../common/ChartCard/ChartCard';

const COLORS = ['#2563A6', '#4F8A72', '#D99838', '#C83E4D', '#8FB8D8', '#8064A2', '#66758A'];

export function EmergencyCausesChart({ data }: { data: EmergencyAnalyticsData }) {
  const points = (data.emergenciesByCause ?? []).map((point, index) => ({ ...point, color: COLORS[index % COLORS.length] }));
  return <section className="section" aria-label="Emergencias por causa">
    <ChartCard title="Emergencias por causa" subtitle="Cantidad de emergencias por causaTipo">
      {points.length ? <BarChart data={points} xKey="etiqueta" bars={[{ key: 'valor', label: 'Emergencias' }]}
        colorField="color" horizontal height={Math.max(280, points.length * 40 + 45)} />
        : <p role="status">Sin causas informadas.</p>}
    </ChartCard>
  </section>;
}
