// src/pages/MobilityDashboard.tsx
import { DashboardHeader } from '../components/common/DashboardHeader/DashboardHeader';
import { MetricCard } from '../components/common/MetricCard/MetricCard';
import { ChartCard } from '../components/common/ChartCard/ChartCard';
import { BarChart } from '../components/charts/BarChart';
import { ErrorCard } from '../components/common/ErrorState/ErrorState';
import { MetricsGridSkeleton, ChartSkeleton } from '../components/common/LoadingState/LoadingState';
import { useFilters } from '../hooks/useFilters';
import { useMobilityData } from '../hooks/useMobilityData';
import { useResolvedUiState } from '../hooks/useUiState';

export function MobilityDashboard() {
  const { filters, updateFilter, updateDateRange } = useFilters();
  const mobilityAsync = useMobilityData(filters);
  const resolved = useResolvedUiState(mobilityAsync);

  return (
    <div>
      <DashboardHeader
        title="Tablero de Movilidad"
        subtitle="CU-M1: Viajes por estación y franja horaria | CU-M2: Duración promedio de viaje"
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
        <ErrorCard message={resolved.error} onRetry={mobilityAsync.refetch} />
      ) : resolved.data ? (
        <>
          {/* KPIs Principales */}
          <div className="section">
            <div className="metrics-grid-3">
              <MetricCard
                metric={{
                  label: 'Viajes Iniciados',
                  value: resolved.data.totalTripsStarted,
                  sublabel: 'CU-M1: movilidad.viaje.iniciado',
                  status: 'info',
                }}
              />
              <MetricCard
                metric={{
                  label: 'Duración Promedio de Viaje',
                  value: resolved.data.avgTripDurationMinutes,
                  unit: ' min',
                  sublabel: 'CU-M2: movilidad.viaje.finalizado',
                  status: 'normal',
                }}
              />
            </div>
          </div>

          {/* CU-M1: Viajes por Estación de Origen y Franja Horaria */}
          <div className="section">
            <h2 className="section-title">CU-M1 — Viajes por Estación y Franja Horaria</h2>
            <div className="charts-grid-2">
              <ChartCard
                title="Viajes por Estación de Origen"
                subtitle="Cantidad de viajes iniciados por estación"
              >
                <BarChart
                  data={resolved.data.tripsByOriginStation}
                  xKey="station"
                  bars={[{ key: 'count', label: 'Viajes', color: '#2563A6' }]}
                  height={260}
                />
              </ChartCard>

              <ChartCard
                title="Viajes por Franja Horaria"
                subtitle="Distribución horaria de viajes iniciados"
              >
                <BarChart
                  data={resolved.data.tripsByTimeSlot}
                  xKey="slot"
                  bars={[{ key: 'count', label: 'Viajes', color: '#8FB8D8' }]}
                  height={260}
                />
              </ChartCard>
            </div>
          </div>

          {/* CU-M2: Duración Promedio de Viaje */}
          <div className="section">
            <h2 className="section-title">CU-M2 — Duración Promedio de Viaje</h2>
            <ChartCard
              title="Distribución de Duración de Viajes"
              subtitle="Rango de tiempo de viajes finalizados"
            >
              <BarChart
                data={resolved.data.tripDurationDistribution}
                xKey="range"
                bars={[{ key: 'count', label: 'Viajes', color: '#4F8A72' }]}
                height={260}
              />
            </ChartCard>
          </div>
        </>
      ) : null}
    </div>
  );
}
