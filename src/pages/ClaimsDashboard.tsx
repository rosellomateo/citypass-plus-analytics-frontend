// src/pages/ClaimsDashboard.tsx
import { DashboardHeader } from '../components/common/DashboardHeader/DashboardHeader';
import { MetricCard } from '../components/common/MetricCard/MetricCard';
import { ChartCard } from '../components/common/ChartCard/ChartCard';
import { BarChart } from '../components/charts/BarChart';
import { PieChart } from '../components/charts/PieChart';
import { ErrorCard } from '../components/common/ErrorState/ErrorState';
import { MetricsGridSkeleton, ChartSkeleton } from '../components/common/LoadingState/LoadingState';
import { useFilters } from '../hooks/useFilters';
import { useClaimsData } from '../hooks/useClaimsData';
import { useResolvedUiState } from '../hooks/useUiState';

export function ClaimsDashboard() {
  const { filters, updateFilter, updateDateRange } = useFilters();
  const claimsAsync = useClaimsData(filters);
  const resolved = useResolvedUiState(claimsAsync);

  return (
    <div>
      <DashboardHeader
        title="Tablero de Reclamos"
        subtitle="CU-R1: Volumen por categoría y estado | CU-R2: Tiempo de resolución"
        filters={filters}
        onDateRangeChange={(range) => updateFilter('dateRange', range)}
        onCustomDateSelect={(from, to) => updateDateRange('custom', from, to)}
      />

      {resolved.loading ? (
        <div className="section">
          <MetricsGridSkeleton count={2} />
          <ChartSkeleton />
        </div>
      ) : resolved.error ? (
        <ErrorCard message={resolved.error} onRetry={claimsAsync.refetch} />
      ) : resolved.data ? (
        <>
          {/* KPIs Principales */}
          <div className="section">
            <div className="metrics-grid-3">
              <MetricCard
                metric={{
                  label: 'Total de Reclamos',
                  value: resolved.data.totalClaims,
                  sublabel: 'CU-R1: Creados acumulados',
                  status: 'info',
                }}
              />
              <MetricCard
                metric={{
                  label: 'Tiempo Prom. de Resolución',
                  value: resolved.data.avgResolutionTimeHours,
                  unit: ' hs',
                  sublabel: 'CU-R2: occurredAt(cerrado) - occurredAt(creado)',
                  status: 'normal',
                }}
              />
            </div>
          </div>

          {/* CU-R1: Visualizaciones de Volumen y Estado */}
          <div className="section">
            <h2 className="section-title">CU-R1 — Volumen por Categoría y Estado</h2>
            <div className="charts-grid-2">
              <ChartCard
                title="Reclamos por Categoría"
                subtitle="Cantidad de reclamos creados por categoría"
              >
                <BarChart
                  data={resolved.data.claimsByCategory}
                  xKey="category"
                  bars={[{ key: 'count', label: 'Reclamos', color: '#2563A6' }]}
                  height={260}
                />
              </ChartCard>

              <ChartCard
                title="Distribución por Estado Actual"
                subtitle="Estado actual (creado, en curso, cerrado, cancelado)"
              >
                <PieChart
                  data={resolved.data.claimsByStatus.map((s) => ({
                    name: s.status,
                    value: s.count,
                    color:
                      s.status === 'CERRADO'
                        ? '#4F8A72'
                        : s.status === 'EN CURSO'
                        ? '#D99838'
                        : s.status === 'CANCELADO'
                        ? '#C83E4D'
                        : '#8FB8D8',
                  }))}
                  height={260}
                />
              </ChartCard>
            </div>
          </div>

          {/* CU-R2: Tiempo de Resolución */}
          <div className="section">
            <h2 className="section-title">CU-R2 — Tiempo de Resolución</h2>
            <ChartCard
              title="Tiempo Promedio de Resolución por Categoría"
              subtitle="Horas transcurridas hasta el cierre del reclamo"
            >
              <BarChart
                data={resolved.data.avgResolutionByCategory}
                xKey="category"
                bars={[{ key: 'hours', label: 'Horas promedio', color: '#D99838' }]}
                height={260}
                unit=" hs"
              />
            </ChartCard>
          </div>
        </>
      ) : null}
    </div>
  );
}
