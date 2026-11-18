import { DashboardImpactCards } from '../components/common/DashboardImpactCards';
import { DashboardImpactCharts } from '../components/common/DashboardImpactCharts';
import { EmergencyCausesChart } from '../components/emergencies/EmergencyCausesChart';
import { EmergencyZonePanel } from '../components/common/EmergencyZonePanel';
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
              <MetricCard
                metric={{
                  label: 'Tiempo Prom. de Despacho',
                  value: resolved.data.avgDispatchTimeMinutes,
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
              <DashboardImpactCards area="emergencies" data={impact.data} showMissing />
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
                bars={stackedPriorityBars}
                height={320}
                showLegend={true}
                scrollable={true}
              />
            </ChartCard>
          </div>}
        </>
      ) : null}
      {!resolved.loading && (resolved.error || !resolved.data) && <DashboardImpactCards area="emergencies" data={impact.data} standalone showMissing />}
      <DashboardImpactCharts area="emergencies" {...impact} emergencyData={resolved.data} />
      <EmergencyZonePanel data={impact.data} loading={impact.loading} filters={filters} />
    </div>
  );
}
