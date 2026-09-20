// src/pages/ClaimsDashboard.tsx
import { useState, useMemo } from 'react';
import { DashboardHeader } from '../components/common/DashboardHeader/DashboardHeader';
import { MetricCard } from '../components/common/MetricCard/MetricCard';
import { ChartCard } from '../components/common/ChartCard/ChartCard';
import { BarChart } from '../components/charts/BarChart';
import { PieChart } from '../components/charts/PieChart';
import { CategorySearchFilter } from '../components/common/CategorySearchFilter/CategorySearchFilter';
import { PillFilter } from '../components/common/PillFilter/PillFilter';
import { ErrorCard } from '../components/common/ErrorState/ErrorState';
import { MetricsGridSkeleton, ChartSkeleton } from '../components/common/LoadingState/LoadingState';
import { useFilters } from '../hooks/useFilters';
import { useClaimsData } from '../hooks/useClaimsData';
import { useResolvedUiState } from '../hooks/useUiState';
import {
  getFilteredClaimRecords,
  getClaimsByStatusFiltered,
  getClaimsByCategoryFiltered,
} from '../services/claimsService';

const claimStatusPillOptions = [
  { value: 'Todos', label: 'Todos' },
  { value: 'creado', label: 'Creado' },
  { value: 'en curso', label: 'En curso' },
  { value: 'cerrado', label: 'Cerrado' },
];

export function ClaimsDashboard() {
  const { filters, updateFilter, updateDateRange } = useFilters();
  const claimsAsync = useClaimsData(filters);
  const resolved = useResolvedUiState(claimsAsync);

  // Independent local filters per chart
  const [selectedCategoryStatusDist, setSelectedCategoryStatusDist] = useState<string>('ALL');
  const [selectedStatusPillCategoryDist, setSelectedStatusPillCategoryDist] = useState<string>('Todos');

  // Compute dataset for local interactive filtering based on date range & global search
  const recordsFiltered = useMemo(() => {
    return getFilteredClaimRecords(filters);
  }, [filters]);

  // Derived data for Chart 2: Status distribution (locally filtered by category)
  const statusDistChartData = useMemo(() => {
    const raw = getClaimsByStatusFiltered(recordsFiltered, selectedCategoryStatusDist);
    return raw.map((s) => ({
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
    }));
  }, [recordsFiltered, selectedCategoryStatusDist]);

  // Derived data for Chart 3: Claims by category (locally filtered by status pill, excluding canceled)
  const categoryChartData = useMemo(() => {
    return getClaimsByCategoryFiltered(recordsFiltered, selectedStatusPillCategoryDist);
  }, [recordsFiltered, selectedStatusPillCategoryDist]);

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
                  sublabel: 'CU-R2: Tiempo hasta estado actual (hs)',
                  status: 'normal',
                }}
              />
            </div>
          </div>

          {/* Sección Superior: Tiempo Promedio (Horizontal) + Distribución por Estado (con Filtro por Categoría) */}
          <div className="section">
            <div className="charts-grid-2">
              <ChartCard
                title="Tiempo Promedio de Resolución por Categoría"
                subtitle="Horas transcurridas hasta el cierre del reclamo (hs)"
              >
                <BarChart
                  data={resolved.data.avgResolutionByCategory}
                  xKey="category"
                  bars={[{ key: 'hours', label: 'Horas promedio', color: '#D99838' }]}
                  horizontal={true}
                  height={270}
                  unit=" hs"
                />
              </ChartCard>

              <ChartCard
                title="Distribución por Estado Actual"
                subtitle="Estado actual (creado, en curso, cerrado, cancelado)"
                actions={
                  <CategorySearchFilter
                    categories={resolved.data.availableCategories}
                    selectedCategory={selectedCategoryStatusDist}
                    onSelectCategory={setSelectedCategoryStatusDist}
                  />
                }
              >
                <PieChart data={statusDistChartData} height={270} />
              </ChartCard>
            </div>
          </div>

          {/* Sección Inferior: Reclamos por Categoría (con Filtro por Estado Píldora, Excluyendo Cancelados) */}
          <div className="section">
            <ChartCard
              title="Reclamos por Categoría"
              subtitle="Cantidad de reclamos por categoría (excluye reclamos cancelados)"
              actions={
                <PillFilter
                  options={claimStatusPillOptions}
                  selectedValue={selectedStatusPillCategoryDist}
                  onChange={setSelectedStatusPillCategoryDist}
                  ariaLabel="Filtrar por estado"
                />
              }
            >
              <BarChart
                data={categoryChartData}
                xKey="category"
                bars={[{ key: 'count', label: 'Reclamos', color: '#2563A6' }]}
                height={280}
                scrollable={true}
              />
            </ChartCard>
          </div>
        </>
      ) : null}
    </div>
  );
}
