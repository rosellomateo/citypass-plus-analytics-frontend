import { DashboardImpactCharts } from '../components/common/DashboardImpactCharts';
import { EmergencyCausesChart } from '../components/emergencies/EmergencyCausesChart';
import { useDashboardImpact } from '../hooks/useDashboardImpact';
// src/pages/EmergenciesDashboard.tsx
import { DashboardHeader } from '../components/common/DashboardHeader/DashboardHeader';
import { MetricCard } from '../components/common/MetricCard/MetricCard';
import { ChartCard } from '../components/common/ChartCard/ChartCard';
import { BarChart } from '../components/charts/BarChart';
import { PieChart } from '../components/charts/PieChart';
import { ErrorCard } from '../components/common/ErrorState/ErrorState';
import { MetricsGridSkeleton, ChartSkeleton } from '../components/common/LoadingState/LoadingState';
import { useFilters } from '../hooks/useFilters';
import { useEmergencyData } from '../hooks/useEmergencyData';
import { useResolvedUiState } from '../hooks/useUiState';
const priorityColors: Record<string, string> = {
  BAJA: '#4F8A72',
  MEDIA: '#D99838',
  ALTA: '#C83E4D',
  CRITICA: '#800020',
  'SIN PRIORIDAD': '#64748B',
};

const stackedPriorityBars = [
  { key: 'BAJA', label: 'Baja', color: priorityColors.BAJA, stackId: 'a' },
  { key: 'MEDIA', label: 'Media', color: priorityColors.MEDIA, stackId: 'a' },
  { key: 'ALTA', label: 'Alta', color: priorityColors.ALTA, stackId: 'a' },
  { key: 'CRITICA', label: 'Crítica', color: priorityColors.CRITICA, stackId: 'a' },
];

export function EmergenciesDashboard() {
  const impact = useDashboardImpact('emergencies');
  const { filters } = useFilters();
  const emergencyAsync = useEmergencyData(filters);
  const resolved = useResolvedUiState(emergencyAsync);

  const avgDispatchChartData = (resolved.data?.avgDispatchTimeByPriority ?? []).map((row) => ({
    ...row, color: priorityColors[row.priority] ?? '#2563A6',
  }));
  const priorityDistChartData = (resolved.data?.emergenciesByPriority ?? []).map(({ priority, count }) => ({
    name: priority, value: count, color: priorityColors[priority],
  }));
  const categoryStackedChartData = resolved.data?.emergenciesByCategoryStacked ?? [];
  const resources = impact.data?.datos.find(({ id, valor }) => id === 'c4b' && Number.isFinite(valor));
  const bicycleResolution = impact.data?.datos.find(({ id, valor }) => id === 'c5b' && Number.isFinite(valor));
  const hasGeneralResolution = Boolean(resolved.data?.resolutionByCause?.length);

  return (
    <div>
      <DashboardHeader
        title="Tablero de Emergencias"
        subtitle="CU-E1: Emergencias por estado y prioridad | CU-E2: Tiempo de despacho"

        aiReport={resolved.data?.aiReport}

      />

      {resolved.loading ? (
        <div className="section">
          <MetricsGridSkeleton count={4} />
          <ChartSkeleton />
        </div>
      ) : resolved.error ? (
        <ErrorCard message={resolved.error} onRetry={emergencyAsync.refetch} />
      ) : resolved.data ? (
        <>
          {/* KPIs Principales */}
          <div className="section">
            <div className="metrics-grid-4">
              <MetricCard
                metric={{
                  label: 'Total Emergencias',
                  value: resolved.data.totalEmergencies,
                  sublabel: 'CU-E1: Registradas',
                  status: 'info',
                }}
              />
              <MetricCard
                metric={{
                  label: 'Emergencias Activas',
                  value: resolved.data.activeCount,
                  sublabel: 'Pendientes / En proceso',
                  status: 'warning',
                }}
              />
              <MetricCard
                metric={{
                  label: 'Emergencias Cerradas',
                  value: resolved.data.closedCount,
                  sublabel: 'Resueltas / Descartadas',
                  status: 'normal',
                }}
              />
              <MetricCard metric={{ label: 'Emergencias con circulación afectada',
                value: resolved.data.circulationAffectedCount ?? 'Sin datos', status: 'info',
                sublabel: resolved.data.circulationUnknownCount ? `${resolved.data.circulationUnknownCount} sin confirmación` : undefined }} />
              <MetricCard
                metric={{
                  label: 'Tiempo Prom. de Despacho',
                  value: resolved.data.avgDispatchTimeMinutes ?? 'Sin datos',
                  unit: ' min',
                  sublabel: 'CU-E2: EmergenciaDespachada - Creada',
                  status: 'critical',
                }}
              />
              {resolved.data.avgArrivalTimeMinutes !== undefined && <MetricCard metric={{
                label: 'Tiempo promedio de llegada',
                value: resolved.data.avgArrivalTimeMinutes,
                unit: ' min',
                sublabel: 'Promedio ponderado por cantidad de emergencias con datos',
              }} />}
              {resources && <MetricCard metric={{ label: 'Recursos enviados por incidentes viales',
                value: resources.valor, unit: resources.unidad ?? undefined, status: 'info' }} />}
              {!hasGeneralResolution && bicycleResolution && <MetricCard metric={{
                label: 'Tiempo promedio de resolución de emergencias durante viajes en bicicleta',
                value: bicycleResolution.valor, unit: bicycleResolution.unidad ?? 'min', status: 'info',
              }} />}
            </div>
          </div>

          <EmergencyCausesChart data={resolved.data} />

          {/* Layout Superior Responsive: Gráficos de Tiempo de Despacho y Distribución por Prioridad */}
          <div className="section">
            <div className="charts-grid-2">
              <ChartCard
                title="Tiempo Promedio de Despacho por Prioridad"
                subtitle="Minutos transcurridos hasta el despacho de la emergencia"
              >
                <BarChart
                  data={avgDispatchChartData}
                  xKey="priority"
                  bars={[{ key: 'minutes', label: 'Minutos promedio' }]}
                  colorField="color"
                  height={270}
                  unit=" min"
                />
              </ChartCard>

              <ChartCard
                title="Distribución por Prioridad"
                subtitle="Porcentaje y cantidad de emergencias por nivel de prioridad"
              >
                <PieChart data={priorityDistChartData} height={270} />
              </ChartCard>
            </div>
          </div>

          {categoryStackedChartData.length > 0 && <div className="section">
            <ChartCard
              title="Distribución por Categoría"
              subtitle="Cantidad de emergencias apiladas por nivel de prioridad"
            >
              <BarChart
                data={categoryStackedChartData}
                xKey="category"
                bars={[...stackedPriorityBars, ...(categoryStackedChartData.some((row) => row.SIN_PRIORIDAD) ? [
                  { key: 'SIN_PRIORIDAD', label: 'Sin prioridad clasificada', color: '#64748B', stackId: 'a' },
                ] : [])]}
                height={320}
                showLegend={true}
                scrollable={true}
                minWidth={Math.max(720, categoryStackedChartData.length * 150)}
                xAxisTickAngle={-25}
              />
            </ChartCard>
          </div>}
        </>
      ) : null}
      <DashboardImpactCharts area="emergencies" {...impact} emergencyData={resolved.data} />
    </div>
  );
}
