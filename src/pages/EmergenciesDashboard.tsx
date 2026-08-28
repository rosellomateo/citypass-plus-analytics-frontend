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

export function EmergenciesDashboard() {
  const { filters, updateFilter } = useFilters();
  const emergencyAsync = useEmergencyData(filters);
  const resolved = useResolvedUiState(emergencyAsync);

  return (
    <div>
      <DashboardHeader
        title="Tablero de Emergencias"
        subtitle="CU-E1: Emergencias por estado y prioridad | CU-E2: Tiempo de despacho"
        filters={filters}
        onDateRangeChange={(range) => updateFilter('dateRange', range)}
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
            </div>
          </div>

          {/* CU-E1: Emergencias por Estado y Prioridad */}
          <div className="section">
            <h2 className="section-title">CU-E1 — Emergencias por Estado y Prioridad</h2>
            <div className="charts-grid-2">
              <ChartCard
                title="Distribución por Estado"
                subtitle="PENDIENTE, VALIDADA, DESPACHADA, EN_CAMINO, RESUELTA, CERRADA, etc."
              >
                <BarChart
                  data={resolved.data.emergenciesByState}
                  xKey="state"
                  bars={[{ key: 'count', label: 'Cantidad', color: '#2563A6' }]}
                  height={260}
                />
              </ChartCard>

              <ChartCard
                title="Distribución por Prioridad"
                subtitle="ALTA, MEDIA, BAJA"
              >
                <PieChart
                  data={resolved.data.emergenciesByPriority.map((p) => ({
                    name: p.priority,
                    value: p.count,
                    color: p.priority === 'ALTA' ? '#C83E4D' : p.priority === 'MEDIA' ? '#D99838' : '#4F8A72',
                  }))}
                  height={260}
                />
              </ChartCard>
            </div>
          </div>

          {/* CU-E2: Tiempo de Despacho */}
          <div className="section">
            <h2 className="section-title">CU-E2 — Tiempo de Despacho</h2>
            <ChartCard
              title="Tiempo Promedio de Despacho por Prioridad"
              subtitle="Minutos desde EmergenciaCreada hasta EmergenciaDespachada"
            >
              <BarChart
                data={resolved.data.avgDispatchTimeByPriority}
                xKey="priority"
                bars={[{ key: 'minutes', label: 'Minutos promedio', color: '#C83E4D' }]}
                height={260}
                unit=" min"
              />
            </ChartCard>
          </div>
        </>
      ) : null}
    </div>
  );
}
