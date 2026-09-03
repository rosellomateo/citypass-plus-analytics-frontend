// src/pages/WasteDashboard.tsx
import { DashboardHeader } from '../components/common/DashboardHeader/DashboardHeader';
import { MetricCard } from '../components/common/MetricCard/MetricCard';
import { ChartCard } from '../components/common/ChartCard/ChartCard';
import { BarChart } from '../components/charts/BarChart';
import { PieChart } from '../components/charts/PieChart';
import { DataTable } from '../components/common/DataTable/DataTable';
import { ErrorCard } from '../components/common/ErrorState/ErrorState';
import { EmptyState } from '../components/common/EmptyState/EmptyState';
import { MetricsGridSkeleton, ChartSkeleton } from '../components/common/LoadingState/LoadingState';
import { FilterBar } from '../components/common/FilterBar/FilterBar';
import { useFilters } from '../hooks/useFilters';
import { useWasteData } from '../hooks/useWasteData';
import { useResolvedUiState } from '../hooks/useUiState';

const ZONE_OPTIONS = [
  { value: 'Centro', label: 'Centro' },
  { value: 'Palermo', label: 'Palermo' },
  { value: 'Belgrano', label: 'Belgrano' },
  { value: 'Caballito', label: 'Caballito' },
  { value: 'San Telmo', label: 'San Telmo' },
  { value: 'Recoleta', label: 'Recoleta' },
];

const WASTE_TYPE_OPTIONS = [
  { value: 'Orgánico', label: 'Orgánico' },
  { value: 'Reciclable', label: 'Reciclable' },
  { value: 'Peligroso', label: 'Peligroso' },
  { value: 'Voluminoso', label: 'Voluminoso' },
];

const STATUS_COLORS: Record<string, string> = {
  NORMAL: '#4F8A72',
  MEDIO: '#D99838',
  CRÍTICO: '#C83E4D',
  DESBORDADO: '#C83E4D',
};

export function WasteDashboard() {
  const { filters, updateFilter, updateDateRange } = useFilters();
  const wasteAsync = useWasteData(filters);
  const resolved = useResolvedUiState(wasteAsync);

  return (
    <div>
      <DashboardHeader
        title="Tablero de Residuos"
        subtitle="Seguimiento analítico de vaciado, volumen recolectado y contenedores críticos."
        filters={filters}
        onDateRangeChange={(range) => updateFilter('dateRange', range)}
        onCustomDateSelect={(from, to) => updateDateRange('custom', from, to)}
        filters_extra={
          <FilterBar
            filters={[
              {
                key: 'zone',
                label: 'Zona',
                options: ZONE_OPTIONS,
                value: filters.zone ?? 'all',
                onChange: (val) => updateFilter('zone', val),
              },
              {
                key: 'wasteType',
                label: 'Tipo de Residuo',
                options: WASTE_TYPE_OPTIONS,
                value: filters.wasteType ?? filters.category ?? 'all',
                onChange: (val) => {
                  updateFilter('wasteType', val);
                  updateFilter('category', val);
                },
              },
            ]}
            searchValue={filters.search}
            onSearchChange={(val) => updateFilter('search', val)}
            searchPlaceholder="Buscar por contenedor, zona..."
          />
        }
      />

      {resolved.loading ? (
        <div className="section">
          <MetricsGridSkeleton count={4} />
          <ChartSkeleton />
        </div>
      ) : resolved.error ? (
        <ErrorCard message={resolved.error} onRetry={wasteAsync.refetch} />
      ) : resolved.isEmpty || !resolved.data ? (
        <div className="section">
          <EmptyState description="No se encontraron registros de residuos para los filtros seleccionados." />
        </div>
      ) : (
        <>
          {/* KPIs Principales */}
          <div className="section">
            <div className="metrics-grid-4">
              <MetricCard
                metric={{
                  label: 'Total Residuos Recolectados',
                  value: resolved.data.totalCollectedTons,
                  unit: ' ton',
                  sublabel: 'Volumen acumulado en el período',
                  status: 'info',
                }}
              />
              <MetricCard
                metric={{
                  label: 'Contenedores Críticos',
                  value: resolved.data.criticalContainersCount,
                  sublabel: 'Llenado > 80% o Desbordados',
                  status: resolved.data.criticalContainersCount > 0 ? 'critical' : 'normal',
                }}
              />
              <MetricCard
                metric={{
                  label: 'Tasa de Recolección a Tiempo',
                  value: resolved.data.onTimeCollectionRatePct,
                  unit: '%',
                  sublabel: 'Vaciados antes de desbordar',
                  status: 'normal',
                }}
              />
              <MetricCard
                metric={{
                  label: 'Tiempo Prom. de Vaciado',
                  value: resolved.data.avgCollectionTimeHours,
                  unit: ' hs',
                  sublabel: 'Horas desde alerta de llenado',
                  status: 'warning',
                }}
              />
            </div>
          </div>

          {/* Gráficos Principales */}
          <div className="section">
            <div className="charts-grid-2">
              <ChartCard
                title="Estado de Llenado de Contenedores"
                subtitle="Distribución por nivel de capacidad (NORMAL, MEDIO, CRÍTICO, DESBORDADO)"
              >
                <PieChart
                  data={resolved.data.containersByStatus.map((s) => ({
                    name: s.status,
                    value: s.count,
                    color: STATUS_COLORS[s.status] || '#8FB8D8',
                  }))}
                  height={260}
                />
              </ChartCard>

              <ChartCard
                title="Volumen Recolectado por Tipo de Residuo"
                subtitle="Comparativa de toneladas recolectadas por categoría"
              >
                <BarChart
                  data={resolved.data.volumeByWasteType}
                  xKey="wasteType"
                  bars={[{ key: 'tons', label: 'Toneladas', color: '#4F8A72' }]}
                  height={260}
                  unit=" ton"
                />
              </ChartCard>
            </div>
          </div>

          {/* Tiempo Promedio por Zona */}
          <div className="section">
            <ChartCard
              title="Tiempo Promedio de Vaciado por Zona"
              subtitle="Horas transcurridas entre la emisión de alerta y el vaciado efectivo por zona"
            >
              <BarChart
                data={resolved.data.avgCollectionTimeByZone}
                xKey="zone"
                bars={[{ key: 'hours', label: 'Horas promedio', color: '#2563A6' }]}
                height={260}
                unit=" hs"
              />
            </ChartCard>
          </div>

          {/* Tabla de Puntos Críticos */}
          <div className="section">
            <ChartCard
              title="Puntos Críticos de Atenciones Pendientes"
              subtitle="Contenedores con nivel de llenado superior al 80% ordenados descendentemente"
            >
              <DataTable
                columns={[
                  { key: 'containerId', label: 'Contenedor', width: '130px' },
                  { key: 'zone', label: 'Zona', width: '140px' },
                  { key: 'wasteType', label: 'Tipo de Residuo', width: '160px' },
                  {
                    key: 'fillLevelPct',
                    label: 'Nivel de Llenado',
                    width: '150px',
                    render: (row) => (
                      <span
                        style={{
                          fontWeight: 600,
                          color: (row.fillLevelPct as number) >= 95 ? '#C83E4D' : '#D99838',
                        }}
                      >
                        {String(row.fillLevelPct)}%
                      </span>
                    ),
                  },
                  {
                    key: 'hoursOverfilled',
                    label: 'Horas en Estado Crítico',
                    width: '180px',
                    render: (row) => <span>{String(row.hoursOverfilled)} hs</span>,
                  },
                ]}
                data={resolved.data.criticalContainersDetail}
                keyField="containerId"
              />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
