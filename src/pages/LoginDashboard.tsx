import { analyticsApi } from '../api/analyticsApi';
import type { LoginEventRecord } from '../api/types';
import { BarChart } from '../components/charts/BarChart';
import { ChartCard } from '../components/common/ChartCard/ChartCard';
import { DashboardHeader } from '../components/common/DashboardHeader/DashboardHeader';
import { EmptyState } from '../components/common/EmptyState/EmptyState';
import { ErrorCard } from '../components/common/ErrorState/ErrorState';
import { MetricsGridSkeleton } from '../components/common/LoadingState/LoadingState';
import { MetricCard } from '../components/common/MetricCard/MetricCard';
import { getDataSource } from '../dataSources/dataSource';
import { mockLoginDashboard } from '../data/mocks/teamDashboards.mock';
import { useAsync } from '../hooks/useAsync';
import { formatDate } from '../utils/dates';

const EVENTS = [
  { type: 'com.citypass.auth.LoginExitoso', key: 'logins', label: 'Inicios de sesión exitosos', color: '#2563A6' },
  { type: 'com.citypass.auth.TokenRenovado', key: 'renewals', label: 'Tokens renovados', color: '#4F8A72' },
  { type: 'com.citypass.auth.SesionCerrada', key: 'logouts', label: 'Sesiones cerradas', color: '#A86B32' },
] as const;

function summarize(records: LoginEventRecord[]) {
  const date = records.reduce<string | null>((latest, { fecha_snapshot }) =>
    fecha_snapshot && (!latest || fecha_snapshot > latest) ? fecha_snapshot : latest, null);
  const totals = { logins: 0, renewals: 0, logouts: 0 };
  const departments = new Map<string, typeof totals>();

  for (const row of records) {
    if (row.fecha_snapshot !== date) continue;
    const event = EVENTS.find(({ type }) => type === row.event_type);
    if (!event || row.cantidadEventos === null) continue;
    const department = row.department || 'Sin departamento';
    const counts = departments.get(department) ?? { logins: 0, renewals: 0, logouts: 0 };
    counts[event.key] += row.cantidadEventos;
    totals[event.key] += row.cantidadEventos;
    departments.set(department, counts);
  }

  return {
    date,
    totals,
    byDepartment: [...departments].map(([department, counts]) => ({ department, ...counts }))
      .sort((a, b) => a.department.localeCompare(b.department, 'es')),
  };
}

export function LoginDashboard() {
  const isMock = getDataSource() === 'mock';
  const { data, loading, error, refetch } = useAsync(
    () => isMock ? Promise.resolve(mockLoginDashboard) : analyticsApi.getLogin(), [isMock],
  );
  const summary = data && summarize(data.datos);

  return (
    <>
      <DashboardHeader
        title="Login"
        subtitle={summary?.date
          ? `Actividad de autenticación · Corte del ${formatDate(`${summary.date}T12:00:00`)}`
          : 'Actividad de autenticación por departamento'}
        aiReport={data?.informe ?? undefined}
      />
      {loading ? <MetricsGridSkeleton count={3} /> : error ? (
        <ErrorCard message={error} onRetry={refetch} />
      ) : !summary?.byDepartment.length ? (
        <EmptyState description="El último corte no tiene eventos de autenticación disponibles." />
      ) : (
        <>
          <section className="section metrics-grid-3" aria-label="Indicadores de autenticación">
            {EVENTS.map(({ key, label }) => <MetricCard key={key} metric={{ label, value: summary.totals[key] }} />)}
          </section>
          <ChartCard title="Actividad por departamento">
            <BarChart
              data={summary.byDepartment}
              xKey="department"
              bars={EVENTS.map(({ key, label, color }) => ({ key, label, color }))}
              showLegend
              scrollable
              minWidth={Math.max(650, summary.byDepartment.length * 145)}
              height={320}
            />
          </ChartCard>
        </>
      )}
    </>
  );
}
