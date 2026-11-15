import { BarChart } from '../components/charts/BarChart';
import { PieChart } from '../components/charts/PieChart';
import { ChartCard } from '../components/common/ChartCard/ChartCard';
import { DataTable } from '../components/common/DataTable/DataTable';
import { DashboardHeader } from '../components/common/DashboardHeader/DashboardHeader';
import { EmptyState } from '../components/common/EmptyState/EmptyState';
import { ErrorCard } from '../components/common/ErrorState/ErrorState';
import { MetricsGridSkeleton } from '../components/common/LoadingState/LoadingState';
import { MetricCard } from '../components/common/MetricCard/MetricCard';
import { getDataSource } from '../dataSources/dataSource';
import { mockEdaDashboard } from '../data/mocks/teamDashboards.mock';
import { useDashboardImpact } from '../hooks/useDashboardImpact';
import { formatDate, formatTimestamp } from '../utils/dates';

const METRICS = [
  { id: 'received', label: 'Eventos recibidos', color: '#2563A6', status: 'info', sublabel: 'Ingresaron al bus' },
  { id: 'delivered', label: 'Eventos distribuidos', color: '#4F8A72', status: 'normal', sublabel: 'Entregados a los módulos' },
  { id: 'pending', label: 'Eventos pendientes', color: '#D99838', status: 'warning', sublabel: 'En espera de distribución' },
  { id: 'critical', label: 'Eventos críticos', color: '#C83E4D', status: 'critical', sublabel: 'Según la clasificación publicada' },
] as const;

export function EdaDashboard() {
  const isMock = getDataSource() === 'mock';
  const { data, loading, error, refetch } = useDashboardImpact('eda');
  const report = isMock ? mockEdaDashboard : data;
  const events = (data?.eventos_publicos ?? report?.eventos_publicos)?.map((event) => ({
    ...event, reference: event.evento_id, lastLink: formatTimestamp(event.ultimo_vinculo),
  }));
  const counts = new Map(report?.datos.map(({ id, valor }) => [id, valor]));
  const cards = METRICS.filter(({ id }) => counts.has(id));
  const distributed = METRICS.filter(({ id }) => id === 'delivered' || id === 'pending')
    .flatMap(({ id, label, color }) => counts.has(id) ? [{ name: label, value: counts.get(id)!, color }] : []);
  const date = report?.fecha_snapshot;

  return <>
    <DashboardHeader
      title="Tablero de EDA"
      subtitle={date ? `Recepción y distribución de eventos · Corte del ${formatDate(`${date}T12:00:00`)}` : 'Recepción y distribución de eventos'}
      aiReport={report?.informe ?? undefined}
    />
    {!isMock && error && <ErrorCard message={error} onRetry={refetch} />}
    {!isMock && loading && !report ? <MetricsGridSkeleton count={3} /> : (
      <>
        {(cards.length > 0 || events) && (
          <section className="section" aria-label="Indicadores de EDA">
            <div className="metrics-grid-4">
              {cards.map(({ id, label, status, sublabel }) => (
                <MetricCard key={id} metric={{ label, value: counts.get(id)!, status, sublabel }} />
              ))}
              {events && <MetricCard metric={{
                label: 'Eventos públicos con emergencias vinculadas',
                value: events.length,
                sublabel: 'Eventos distintos con un contexto de zona',
                status: 'info',
              }} />}
            </div>
          </section>
        )}
        {(distributed.length > 0 || Boolean(events?.length)) && (
          <div className="section charts-grid-2">
            {distributed.length > 0 && <ChartCard title="Estado de distribución">
              <PieChart data={distributed} height={290} />
            </ChartCard>}
            {Boolean(events?.length) && <ChartCard title="Emergencias vinculadas por evento público">
              <BarChart data={events ?? []} xKey="reference" bars={[{ key: 'emergencias', label: 'Emergencias', color: '#2563A6' }]} height={290} />
            </ChartCard>}
          </div>
        )}
        {Boolean(events?.length) && <div className="section">
          <ChartCard title="Vínculos por contexto de zona" subtitle="La prioridad de despacho depende de la vigencia del contexto.">
            <DataTable data={events ?? []} keyField="evento_id" columns={[
              { key: 'evento_id', label: 'ID del evento público' },
              { key: 'emergencias', label: 'Emergencias vinculadas' },
              { key: 'lastLink', label: 'Último vínculo' },
            ]} />
          </ChartCard>
        </div>}
        {cards.length === 0 && !events && !error && <EmptyState description="El backend aún no publicó un corte de EDA." />}
      </>
    )}
  </>;
}
