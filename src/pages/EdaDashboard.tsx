import { BarChart } from '../components/charts/BarChart';
import { PieChart } from '../components/charts/PieChart';
import { ChartCard } from '../components/common/ChartCard/ChartCard';
import { DataTable } from '../components/common/DataTable/DataTable';
import { DashboardHeader } from '../components/common/DashboardHeader/DashboardHeader';
import { EmptyState } from '../components/common/EmptyState/EmptyState';
import { ErrorCard } from '../components/common/ErrorState/ErrorState';
import { MetricsGridSkeleton } from '../components/common/LoadingState/LoadingState';
import { MetricCard } from '../components/common/MetricCard/MetricCard';
import { useDashboardImpact } from '../hooks/useDashboardImpact';
import { formatDate, formatTimestamp } from '../utils/dates';

const METRICS = [
  { id: 'received', label: 'Eventos recibidos', color: '#2563A6', status: 'info', sublabel: 'Ingresaron al bus' },
  { id: 'delivered', label: 'Eventos distribuidos', color: '#4F8A72', status: 'normal', sublabel: 'Entregados a los módulos' },
  { id: 'pending', label: 'Eventos pendientes', color: '#D99838', status: 'warning', sublabel: 'En espera de distribución' },
  { id: 'critical', label: 'Eventos críticos', color: '#C83E4D', status: 'critical', sublabel: 'Según la clasificación publicada' },
] as const;

export function EdaDashboard() {
  const { data, loading, error, refetch } = useDashboardImpact('eda');
  const report = data;
  const topics = data?.tipos_recibidos ?? [];
  const events = (data?.eventos_publicos ?? report?.eventos_publicos)?.map((event) => ({
    ...event, reference: event.nombre || event.evento_id, lastLink: formatTimestamp(event.ultimo_vinculo),
  })).sort((a, b) => b.emergencias - a.emergencias);
  const counts = new Map(report?.datos.map(({ id, valor }) => [id, valor]));
  if (!counts.has('received') && topics.length) {
    counts.set('received', topics.reduce((total, point) => total + point.valor, 0));
  }
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
    {error && <ErrorCard message={error} onRetry={refetch} />}
    {loading && !report ? <MetricsGridSkeleton count={3} /> : (
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
        {events && <section className="section" aria-label="Emergencias vinculadas por evento público">
          <ChartCard title="Emergencias vinculadas por evento público" subtitle="Emergencias distintas por evento, ordenadas por cantidad">
            {events.length > 0 ? (
              <BarChart data={events} xKey="reference" bars={[{ key: 'emergencias', label: 'Emergencias' }]}
                height={Math.max(180, 45 + events.length * 34)} horizontal />
            ) : <EmptyState description="El corte no incluye vínculos con eventos públicos." />}
          </ChartCard>
          {events.length > 0 && <ChartCard title="Vínculos por contexto de zona">
            <DataTable data={events} keyField="evento_id" columns={[
              { key: 'reference', label: 'Evento público' },
              { key: 'emergencias', label: 'Emergencias vinculadas' },
              { key: 'lastLink', label: 'Último vínculo' },
            ]} />
          </ChartCard>}
        </section>}
        {distributed.length > 0 && <div className="section">
          <ChartCard title="Estado de distribución">
            <PieChart data={distributed} height={290} />
          </ChartCard>
        </div>}
        {topics.length > 0 && <div className="section">
          <ChartCard title="Eventos recibidos por tipo"
            subtitle="Eventos distintos en el corte de EDA">
            <BarChart data={topics.map(({ etiqueta, valor }) => ({
              tipo: etiqueta.split('.').slice(etiqueta.endsWith('.v3') ? -2 : -1).join('.'),
              cantidad: valor,
            }))} xKey="tipo" bars={[{ key: 'cantidad', label: 'Eventos' }]} horizontal
              height={Math.max(230, 45 + topics.length * 29)} />
          </ChartCard>
        </div>}
        {cards.length === 0 && !events && !error && <EmptyState description="El backend aún no publicó un corte de EDA." />}
      </>
    )}
  </>;
}
