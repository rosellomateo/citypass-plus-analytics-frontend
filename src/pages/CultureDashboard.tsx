import { DashboardImpactCards } from '../components/common/DashboardImpactCards';
import { ActivityOrganizerChart } from '../components/culture/ActivityOrganizerChart';
import { DashboardHeader } from '../components/common/DashboardHeader/DashboardHeader';
import { MetricCard } from '../components/common/MetricCard/MetricCard';
import { ChartCard } from '../components/common/ChartCard/ChartCard';
import { BarChart } from '../components/charts/BarChart';
import { EmptyState } from '../components/common/EmptyState/EmptyState';
import { ErrorCard } from '../components/common/ErrorState/ErrorState';
import { MetricsGridSkeleton, ChartSkeleton } from '../components/common/LoadingState/LoadingState';
import { useFilters } from '../hooks/useFilters';
import { useCultureData } from '../hooks/useCultureData';
import { useDashboardImpact } from '../hooks/useDashboardImpact';
import { useResolvedUiState } from '../hooks/useUiState';

export function CultureDashboard() {
  const impact = useDashboardImpact('culture');
  const { filters } = useFilters();
  const cultureAsync = useCultureData(filters);
  const resolved = useResolvedUiState(cultureAsync);
  const activities = resolved.data?.activities;
  const causes = activities?.byCause ?? impact.data?.resumen_gold?.find(({ id }) => id === 'culture-cause')?.puntos ?? [];
  const causeColors: Record<string, string> = { Clima: '#57A9DB', Reclamo: '#D99838', 'Accidente vial': '#794CAC', 'Incidente vial': '#C83E4D' };

  return <div>
    <DashboardHeader title="Espacios Públicos y Cultura" subtitle="Actividades y afectaciones en espacios públicos"
      aiReport={resolved.data?.aiReport} />
    {resolved.loading ? <section className="section"><MetricsGridSkeleton count={5} /><ChartSkeleton /></section>
      : resolved.error ? <ErrorCard message={resolved.error} onRetry={cultureAsync.refetch} />
      : activities ? <>
        <section className="section"><div className="metrics-grid-auto">
          <MetricCard metric={{ label: 'Actividades', value: activities.total }} />
          <MetricCard metric={{ label: 'Actividades masivas', value: activities.massive }} />
          <MetricCard metric={{ label: 'Actividades afectadas por clima', value: activities.affectedByClimate ?? 'Sin datos' }} />
          <MetricCard metric={{ label: 'Actividades de ciudadanos', value: activities.byOrganizer?.find(({ organizer }) => organizer === 'CIUDADANO')?.count ?? 0, status: 'info' }} />
          <MetricCard metric={{ label: 'Actividades de la ciudad', value: activities.byOrganizer?.find(({ organizer }) => organizer === 'CIUDAD')?.count ?? 0, status: 'info' }} />
        </div></section>
        <ActivityOrganizerChart activities={activities} />
      </> : <EmptyState title="Sin actividades disponibles" />}
    {!resolved.loading && <section className="section" aria-label="Casos de uso de Espacios Públicos">
      <h2 className="section-title">Casos de uso</h2>
      <div className="metrics-grid-3"><DashboardImpactCards area="culture" data={impact.data}
        calculatedMetrics={activities?.caseMetrics} showMissing /></div>
    </section>}
    {activities && <>
      <section className="section">
        <ChartCard title="Cantidad de eventos por zona">
          <BarChart data={activities.byZone ?? []} xKey="zone" bars={[{ key: 'count', label: 'Eventos', color: '#4F8A72' }]}
            horizontal height={Math.max(300, (activities.byZone?.length ?? 0) * 34 + 45)} />
        </ChartCard>
      </section>
      <section className="section">
        <ChartCard title="Actividades por categoría">
          <BarChart data={activities.byCategory} xKey="category" bars={[{ key: 'count', label: 'Actividades' }]}
            height={Math.max(280, activities.byCategory.length * 38 + 45)} horizontal />
        </ChartCard>
      </section>
    </>}
    {(activities || causes.length > 0) && <section className="section">
      <ChartCard title="Cantidad de actividades afectadas por causa">
        <BarChart data={causes.map((point) => ({ ...point, color: causeColors[point.etiqueta] ?? '#2563A6' }))}
          xKey="etiqueta" bars={[{ key: 'valor', label: 'Actividades' }]} colorField="color" horizontal height={300} />
      </ChartCard>
    </section>}
  </div>;
}
