// src/pages/MobilityDashboard.tsx
import { useState, useMemo } from 'react';
import { DashboardHeader } from '../components/common/DashboardHeader/DashboardHeader';
import { MetricCard } from '../components/common/MetricCard/MetricCard';
import { ChartCard } from '../components/common/ChartCard/ChartCard';
import { BarChart } from '../components/charts/BarChart';
import { PieChart } from '../components/charts/PieChart';
import { CategorySearchFilter } from '../components/common/CategorySearchFilter/CategorySearchFilter';
import { DataTable } from '../components/common/DataTable/DataTable';
import { ErrorCard } from '../components/common/ErrorState/ErrorState';
import { MetricsGridSkeleton, ChartSkeleton } from '../components/common/LoadingState/LoadingState';
import { useFilters } from '../hooks/useFilters';
import { useMobilityData } from '../hooks/useMobilityData';
import { useResolvedUiState } from '../hooks/useUiState';
import {
  getTripsByStation,
  getTripsByDurationBucket,
  getStationAvgDuration,
  formatStationName,
} from '../services/mobilityService';

const DURATION_COLORS: Record<string, string> = {
  '<15min': '#10B981',
  '15-30min': '#2563A6',
  '30-60min': '#F59E0B',
  '>1h': '#EF4444',
};

const DATE_RANGE_LABELS: Record<string, string> = {
  today: 'Hoy',
  '7d': 'Semana (7d)',
  '30d': 'Mes (30d)',
  custom: 'Personalizado',
};

export function MobilityDashboard() {
  const { filters, updateFilter, updateDateRange } = useFilters();
  const mobilityAsync = useMobilityData(filters);
  const resolved = useResolvedUiState(mobilityAsync);

  // Filtros locales independientes por gráfico
  const [selectedStationChart2, setSelectedStationChart2] = useState<string>('ALL');

  // Registros planos filtrados
  const records = useMemo(() => resolved.data?.records || [], [resolved.data]);

  // Gráfico 1: Viajes por Estación de Inicio (con nombres formateados)
  const tripsByStationData = useMemo(() => {
    return getTripsByStation(records);
  }, [records]);

  // Gráfico 2: Distribución por Duración de Viaje (PieChart sin solapamiento de etiquetas)
  const tripsByDurationData = useMemo(() => {
    const raw = getTripsByDurationBucket(records, selectedStationChart2);
    return raw.map((item) => ({
      name: `${item.bucket} (${item.porcentaje}%)`,
      value: item.cantidadViajes,
      color: DURATION_COLORS[item.bucket] || '#6B7280',
    }));
  }, [records, selectedStationChart2]);

  // Gráfico 3: Duración Promedio Ponderada por Estación (sin filtro por estación)
  const stationAvgDurationData = useMemo(() => {
    return getStationAvgDuration(records);
  }, [records]);

  const activeRangeLabel = DATE_RANGE_LABELS[filters.dateRange || '7d'] || 'Período seleccionado';

  return (
    <div>
      <DashboardHeader
        title="Tablero de Movilidad Urbana"
        subtitle="Analítica de Viajes, Demanda Estacional y Trazabilidad por Estación"
        filters={filters}
        onDateRangeChange={(range) => updateFilter('dateRange', range)}
        onCustomDateSelect={(from, to) => updateDateRange('custom', from, to)}
      />

      {resolved.loading ? (
        <div className="section">
          <MetricsGridSkeleton count={6} />
          <ChartSkeleton />
        </div>
      ) : resolved.error ? (
        <ErrorCard message={resolved.error} onRetry={mobilityAsync.refetch} />
      ) : resolved.data ? (
        <>
          {/* KPIs Principales (Calculados 100% dinámicamente según el filtro activo) */}
          <div className="section">
            <div className="metrics-grid-6">
              <MetricCard
                metric={{
                  label: 'Viajes Acumulados',
                  value: resolved.data.totalTrips,
                  sublabel: `Total del período (${activeRangeLabel})`,
                  status: 'info',
                }}
              />
              <MetricCard
                metric={{
                  label: 'Altas del Período',
                  value: resolved.data.weeklyTrips,
                  sublabel: `Filtro: ${activeRangeLabel}`,
                  status: 'normal',
                }}
              />
              <MetricCard
                metric={{
                  label: 'Duración Total',
                  value: resolved.data.totalDurationMinutes,
                  unit: ' min',
                  sublabel: `≈ ${(resolved.data.totalDurationMinutes / 60).toFixed(0)} horas en período`,
                  status: 'normal',
                }}
              />
              <MetricCard
                metric={{
                  label: 'Duración Prom. Ponderada',
                  value: resolved.data.weightedAvgDurationMinutes,
                  unit: ' min',
                  sublabel: 'SUM(minutos) / SUM(viajes)',
                  status: 'warning',
                }}
              />
              <MetricCard
                metric={{
                  label: 'Estación Top Inicios',
                  value: resolved.data.topStationName,
                  sublabel: 'Mayor concentrador de viajes',
                  status: 'info',
                }}
              />
              <MetricCard
                metric={{
                  label: 'Franja Predominante',
                  value: resolved.data.predominantDurationBucket,
                  sublabel: 'Rango de duración líder',
                  status: 'normal',
                }}
              />
            </div>
          </div>

          {/* Sección de Visualizaciones */}
          <div className="section">
            <div className="charts-grid-2">
              {/* Gráfico 1: Cantidad de Viajes por Estación de Inicio */}
              <ChartCard
                title="Cantidad de Viajes por Estación de Inicio"
                subtitle="SUM(cantidadViajes) agrupado por estación"
              >
                <BarChart
                  data={tripsByStationData}
                  xKey="station"
                  bars={[{ key: 'cantidadViajes', label: 'Viajes Iniciados', color: '#2563A6' }]}
                  horizontal={true}
                  height={280}
                />
              </ChartCard>

              {/* Gráfico 2: Distribución por Duración de Viaje */}
              <ChartCard
                title="Distribución por Duración de Viaje"
                subtitle="Participación por rango (<15min, 15-30min, 30-60min, >1h)"
                actions={
                  <CategorySearchFilter
                    categories={resolved.data.availableStations}
                    selectedCategory={selectedStationChart2}
                    onSelectCategory={setSelectedStationChart2}
                    placeholder="Todas las estaciones"
                  />
                }
              >
                <PieChart data={tripsByDurationData} height={280} />
              </ChartCard>
            </div>
          </div>

          <div className="section">
            {/* Gráfico 3: Duración Promedio Ponderada por Estación (sin filtro por estación) */}
            <ChartCard
              title="Duración Promedio Ponderada por Estación"
              subtitle="SUM(duracionTotalViajes) / SUM(cantidadViajes)"
            >
              <BarChart
                data={stationAvgDurationData}
                xKey="station"
                bars={[{ key: 'promDuracionPonderada', label: 'Minutos Promedio', color: '#F59E0B' }]}
                height={280}
              />
            </ChartCard>
          </div>

          {/* Sección Registros */}
          <div className="section">
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                padding: '20px',
              }}
            >
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '16px',
                  marginTop: 0,
                }}
              >
                Registros
              </h3>

              <DataTable
                columns={[
                  { key: 'fechaInicio', label: 'Fecha Viaje', width: '130px' },
                  {
                    key: 'estacionInicioFormatted',
                    label: 'Estación Inicio',
                    render: (r: any) => r.estacionInicioFormatted,
                  },
                  { key: 'duracionViaje', label: 'Rango Duración', width: '140px' },
                  { key: 'cantidadViajes', label: 'Cantidad Viajes', width: '140px' },
                  { key: 'duracionTotalViajes', label: 'Duración Total (min)', width: '170px' },
                  { key: 'promDuracion', label: 'Promedio Fila (min)', width: '160px' },
                  { key: 'fecha_snapshot', label: 'Fecha Snapshot', width: '140px' },
                ]}
                data={records.map((r, idx) => ({
                  ...r,
                  estacionInicioFormatted: formatStationName(r.estacionInicio),
                  _id: `${r.fechaInicio}-${r.estacionInicio}-${r.duracionViaje}-${idx}`,
                }))}
                keyField="_id"
                pageSize={10}
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
