// src/pages/EmergenciesDashboard.tsx
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
import { useEmergencyData } from '../hooks/useEmergencyData';
import { useResolvedUiState } from '../hooks/useUiState';
import {
  getPriorityDistribution,
  getAvgDispatchTimeByPriority,
  getCategoryPriorityDistribution,
} from '../services/emergencyService';
import {
  mockEmergenciaCreadaEvents,
  mockEmergenciaPriorizadaEvents,
  mockEmergenciaEstadoActualizadoEvents,
} from '../data/mocks/emergencies.mock';
import type { EmergencyPriority, EmergencyState } from '../types';
import { isWithinDateRange } from '../utils/dates';

const statePillOptions = [
  { value: 'Todos', label: 'Todos' },
  { value: 'Recibido', label: 'Recibido' },
  { value: 'En revisión', label: 'En revisión' },
  { value: 'Asignado', label: 'Asignado' },
  { value: 'En proceso', label: 'En proceso' },
  { value: 'Cerrado', label: 'Cerrado' },
  { value: 'Rechazado', label: 'Rechazado' },
];

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
  const { filters, updateFilter, updateDateRange } = useFilters();
  const emergencyAsync = useEmergencyData(filters);
  const resolved = useResolvedUiState(emergencyAsync);

  // Independent local state per chart
  const [selectedCategoryAvgDispatch, setSelectedCategoryAvgDispatch] = useState<string>('ALL');
  const [selectedCategoryPriorityDist, setSelectedCategoryPriorityDist] = useState<string>('ALL');
  const [selectedCategoryStacked, setSelectedCategoryStacked] = useState<string>('ALL');
  const [selectedStatePill, setSelectedStatePill] = useState<string>('Todos');

  // Compute filtered dataset for local charts based on date filters and maps
  const { createdMap, priorityMap, currentStateMap, filteredCreated } = useMemo(() => {
    const created = mockEmergenciaCreadaEvents.filter((e) => isWithinDateRange(e.metadata.occurredAt, filters));
    const cMap = new Map(created.map((e) => [e.data.emergenciaId, e]));

    const pMap = new Map<string, EmergencyPriority>();
    mockEmergenciaPriorizadaEvents.forEach((e) => pMap.set(e.data.emergenciaId, e.data.prioridad));

    const sMap = new Map<string, EmergencyState>();
    created.forEach((e) => sMap.set(e.data.emergenciaId, e.data.estado));

    const stateUpdatesSorted = [...mockEmergenciaEstadoActualizadoEvents].sort(
      (a, b) => new Date(a.metadata.occurredAt).getTime() - new Date(b.metadata.occurredAt).getTime()
    );
    stateUpdatesSorted.forEach((u) => sMap.set(u.data.emergenciaId, u.data.estadoNuevo));

    return {
      createdMap: cMap,
      priorityMap: pMap,
      currentStateMap: sMap,
      filteredCreated: created,
    };
  }, [filters]);

  // Derived data for Chart 1: Average Dispatch Time by Priority (locally filtered by category)
  const avgDispatchChartData = useMemo(() => {
    const raw = getAvgDispatchTimeByPriority(createdMap, priorityMap, selectedCategoryAvgDispatch);
    return raw.map((item) => ({
      ...item,
      color: priorityColors[item.priority] || '#2563A6',
    }));
  }, [createdMap, priorityMap, selectedCategoryAvgDispatch]);

  // Derived data for Chart 2: Priority Distribution (locally filtered by category)
  const priorityDistChartData = useMemo(() => {
    const raw = getPriorityDistribution(filteredCreated, priorityMap, selectedCategoryPriorityDist);
    return raw.map((p) => ({
      name: p.priority,
      value: p.count,
      color: priorityColors[p.priority] || '#2563A6',
    }));
  }, [filteredCreated, priorityMap, selectedCategoryPriorityDist]);

  // Derived data for Chart 3: Category Distribution Stacked by Priority (locally filtered by category & state pill)
  const categoryStackedChartData = useMemo(() => {
    return getCategoryPriorityDistribution(
      filteredCreated,
      priorityMap,
      currentStateMap,
      selectedStatePill,
      selectedCategoryStacked
    );
  }, [filteredCreated, priorityMap, currentStateMap, selectedStatePill, selectedCategoryStacked]);

  return (
    <div>
      <DashboardHeader
        title="Tablero de Emergencias"
        subtitle="CU-E1: Emergencias por estado y prioridad | CU-E2: Tiempo de despacho"
        filters={filters}
        aiReport={resolved.data?.aiReport}
        onDateRangeChange={(range) => updateFilter('dateRange', range)}
        onCustomDateSelect={(from, to) => updateDateRange('custom', from, to)}
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

          {/* Layout Superior Responsive: Gráficos de Tiempo de Despacho y Distribución por Prioridad */}
          <div className="section">
            <div className="charts-grid-2">
              <ChartCard
                title="Tiempo Promedio de Despacho por Prioridad"
                subtitle="Minutos transcurridos hasta el despacho de la emergencia"
                actions={
                  <CategorySearchFilter
                    categories={resolved.data.availableCategories}
                    selectedCategory={selectedCategoryAvgDispatch}
                    onSelectCategory={setSelectedCategoryAvgDispatch}
                  />
                }
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
                actions={
                  <CategorySearchFilter
                    categories={resolved.data.availableCategories}
                    selectedCategory={selectedCategoryPriorityDist}
                    onSelectCategory={setSelectedCategoryPriorityDist}
                  />
                }
              >
                <PieChart data={priorityDistChartData} height={270} />
              </ChartCard>
            </div>
          </div>

          {/* Sección Inferior: Distribución por Categoría Apilada por Prioridad */}
          <div className="section">
            <ChartCard
              title="Distribución por Categoría"
              subtitle="Cantidad de emergencias apiladas por nivel de prioridad"
              actions={
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                  <CategorySearchFilter
                    categories={resolved.data.availableCategories}
                    selectedCategory={selectedCategoryStacked}
                    onSelectCategory={setSelectedCategoryStacked}
                  />
                  <PillFilter
                    options={statePillOptions}
                    selectedValue={selectedStatePill}
                    onChange={setSelectedStatePill}
                    ariaLabel="Filtrar por estado"
                  />
                </div>
              }
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
          </div>
        </>
      ) : null}
    </div>
  );
}
