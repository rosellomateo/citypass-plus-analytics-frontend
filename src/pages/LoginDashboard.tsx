import { analyticsApi } from '../api/analyticsApi';
import { embeddedApi } from '../api/embeddedApi';
import type { LoginEventRecord } from '../api/types';
import { BarChart } from '../components/charts/BarChart';
import { PieChart } from '../components/charts/PieChart';
import { ChartCard } from '../components/common/ChartCard/ChartCard';
import { DashboardHeader } from '../components/common/DashboardHeader/DashboardHeader';
import { EmptyState } from '../components/common/EmptyState/EmptyState';
import { ErrorCard } from '../components/common/ErrorState/ErrorState';
import { MetricsGridSkeleton } from '../components/common/LoadingState/LoadingState';
import { MetricCard } from '../components/common/MetricCard/MetricCard';
import { getDataSource } from '../dataSources/dataSource';
import { useAsync } from '../hooks/useAsync';
import { formatDate } from '../utils/dates';

const EVENTS = [
  { type: 'com.citypass.auth.LoginExitoso', key: 'logins', label: 'Inicios de sesión exitosos', shortLabel: 'Inicios', color: '#2563A6', status: 'info', sublabel: 'Autenticaciones completadas en el corte' },
  { type: 'com.citypass.auth.TokenRenovado', key: 'renewals', label: 'Tokens renovados', shortLabel: 'Renovaciones', color: '#4F8A72', status: 'normal', sublabel: 'Renovaciones de acceso registradas' },
  { type: 'com.citypass.auth.SesionCerrada', key: 'logouts', label: 'Sesiones cerradas', shortLabel: 'Cierres', color: '#D99838', status: 'warning', sublabel: 'Cierres de sesión registrados' },
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
  const source = getDataSource();
  const { data, loading, error, refetch } = useAsync(
    () => source === 'embedded' ? embeddedApi.getLogin() : analyticsApi.getLogin(), [source],
  );
  const summary = data && summarize(data.datos);

  return (
    <>
      <DashboardHeader
        title="Tablero de Login Federado"
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
          <section className="section" aria-label="Indicadores de autenticación">
            <div className="metrics-grid-3">
              {EVENTS.map(({ key, label, status, sublabel }) => (
                <MetricCard key={key} metric={{ label, value: summary.totals[key], status, sublabel }} />
              ))}
            </div>
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
          <div className="section">
            <ChartCard title="Distribución de eventos de autenticación">
              <PieChart data={EVENTS.map(({ key, shortLabel, color }) => ({ name: shortLabel, value: summary.totals[key], color }))} height={290} />
            </ChartCard>
          </div>
        </>
      )}
    </>
  );
}
