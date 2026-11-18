import type { CultureAnalyticsData } from '../../types';
import { BarChart } from '../charts/BarChart';
import { ChartCard } from '../common/ChartCard/ChartCard';

export function ActivityOrganizerChart({ activities }: { activities: NonNullable<CultureAnalyticsData['activities']> }) {
  if (!activities.byOrganizer) return null;
  const citizens = activities.byOrganizer.find(({ organizer }) => organizer === 'CIUDADANO')?.count ?? 0;
  const city = activities.byOrganizer.find(({ organizer }) => organizer === 'CIUDAD')?.count ?? 0;
  const points = [
    { etiqueta: 'Ciudadanos', valor: citizens, color: '#4F8A72' },
    { etiqueta: 'Ciudad', valor: city, color: '#D99838' },
    { etiqueta: 'Eventos totales', valor: activities.total, color: '#2563A6' },
  ];
  return <section className="section" aria-label="Actividades por organizador">
    <ChartCard title="Actividades de ciudadanos vs. eventos totales" subtitle="Actividades de ciudadanos y de la ciudad comparadas con el total publicado">
      <BarChart data={points} xKey="etiqueta" bars={[{ key: 'valor', label: 'Actividades' }]}
        colorField="color" horizontal height={260} />
    </ChartCard>
  </section>;
}
