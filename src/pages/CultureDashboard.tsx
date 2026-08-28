// src/pages/CultureDashboard.tsx
import { DashboardHeader } from '../components/common/DashboardHeader/DashboardHeader';
import { MetricCard } from '../components/common/MetricCard/MetricCard';
import { ChartCard } from '../components/common/ChartCard/ChartCard';
import { BarChart } from '../components/charts/BarChart';
import { PieChart } from '../components/charts/PieChart';
import { DataTable } from '../components/common/DataTable/DataTable';
import { ErrorCard } from '../components/common/ErrorState/ErrorState';
import { MetricsGridSkeleton, ChartSkeleton } from '../components/common/LoadingState/LoadingState';
import { useFilters } from '../hooks/useFilters';
import { useCultureData } from '../hooks/useCultureData';
import { useResolvedUiState } from '../hooks/useUiState';

export function CultureDashboard() {
  const { filters, updateFilter } = useFilters();
  const cultureAsync = useCultureData(filters);
  const resolved = useResolvedUiState(cultureAsync);

  return (
    <div>
      <DashboardHeader
        title="Espacios Públicos y Cultura"
        subtitle="CU-C1: Ocupación de espacios públicos | CU-C2: Convocatoria de eventos comunitarios"
        filters={filters}
        onDateRangeChange={(range) => updateFilter('dateRange', range)}
      />

      {resolved.loading ? (
        <div className="section">
          <MetricsGridSkeleton count={4} />
          <ChartSkeleton />
        </div>
      ) : resolved.error ? (
        <ErrorCard message={resolved.error} onRetry={cultureAsync.refetch} />
      ) : resolved.data ? (
        <>
          {/* KPIs Principales */}
          <div className="section">
            <div className="metrics-grid-4">
              <MetricCard
                metric={{
                  label: 'Reservas Confirmadas',
                  value: resolved.data.confirmedReservations,
                  sublabel: 'CU-C1: espacios.reserva.confirmada',
                  status: 'normal',
                }}
              />
              <MetricCard
                metric={{
                  label: 'Reservas Canceladas',
                  value: resolved.data.cancelledReservations,
                  sublabel: 'espacios.reserva.cancelada',
                  status: 'warning',
                }}
              />
              <MetricCard
                metric={{
                  label: 'Tasa de Cancelación',
                  value: resolved.data.cancellationRatePct,
                  unit: '%',
                  sublabel: 'Canceladas / Total reservas',
                  status: resolved.data.cancellationRatePct > 20 ? 'critical' : 'normal',
                }}
              />
              <MetricCard
                metric={{
                  label: 'Ocupación Prom. Cupo',
                  value: resolved.data.avgOccupancyRatePct,
                  unit: '%',
                  sublabel: 'CU-C2: Inscriptos / Cupo máximo',
                  status: 'info',
                }}
              />
            </div>
          </div>

          {/* CU-C1: Ocupación de Espacios Públicos */}
          <div className="section">
            <h2 className="section-title">CU-C1 — Ocupación de Espacios Públicos</h2>
            <ChartCard
              title="Reservas Confirmadas vs Canceladas por Espacio"
              subtitle="Distribución de uso de espacios públicos"
            >
              <BarChart
                data={resolved.data.reservationsBySpace}
                xKey="space"
                bars={[
                  { key: 'confirmed', label: 'Confirmadas', color: '#4F8A72' },
                  { key: 'cancelled', label: 'Canceladas', color: '#C83E4D' },
                ]}
                showLegend={true}
                height={260}
              />
            </ChartCard>
          </div>

          {/* CU-C2: Convocatoria a Eventos Comunitarios */}
          <div className="section">
            <h2 className="section-title">CU-C2 — Convocatoria a Eventos Comunitarios</h2>
            <div className="charts-grid-2">
              <ChartCard
                title="Inscripciones por Categoría"
                subtitle="Categorías documentadas: Cultural, Deportivo, Recreativo"
              >
                <PieChart
                  data={resolved.data.inscriptionsByCategory.map((c) => ({
                    name: c.category,
                    value: c.count,
                    color:
                      c.category === 'CULTURAL'
                        ? '#8FB8D8'
                        : c.category === 'DEPORTIVO'
                        ? '#2563A6'
                        : '#4F8A72',
                  }))}
                  height={260}
                />
              </ChartCard>

              <ChartCard
                title="Detalle de Inscripciones y Ocupación de Cupo"
                subtitle="Inscriptos vs Cupo Máximo por evento"
              >
                <DataTable
                  columns={[
                    { key: 'eventTitle', label: 'Evento' },
                    { key: 'registered', label: 'Inscriptos', width: '100px' },
                    { key: 'capacity', label: 'Cupo', width: '90px' },
                    {
                      key: 'occupancyPct',
                      label: '% Ocupación',
                      width: '110px',
                      render: (row) => (
                        <span
                          style={{
                            fontWeight: 600,
                            color:
                              (row.occupancyPct as number) >= 85
                                ? '#C83E4D'
                                : (row.occupancyPct as number) >= 50
                                ? '#2563A6'
                                : '#4F8A72',
                          }}
                        >
                          {String(row.occupancyPct)}%
                        </span>
                      ),
                    },
                  ]}
                  data={resolved.data.inscriptionsByEvent}
                  keyField="eventTitle"
                />
              </ChartCard>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
