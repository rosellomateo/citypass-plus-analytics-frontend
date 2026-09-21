// src/pages/MobilityDashboard.tsx
import { useState, useMemo } from 'react';
import { DashboardHeader } from '../components/common/DashboardHeader/DashboardHeader';
import { MetricCard } from '../components/common/MetricCard/MetricCard';
import { ChartCard } from '../components/common/ChartCard/ChartCard';
import { BarChart } from '../components/charts/BarChart';
import { PieChart } from '../components/charts/PieChart';
import { CategorySearchFilter } from '../components/common/CategorySearchFilter/CategorySearchFilter';
import { ErrorCard } from '../components/common/ErrorState/ErrorState';
import { MetricsGridSkeleton, ChartSkeleton } from '../components/common/LoadingState/LoadingState';
import { useFilters } from '../hooks/useFilters';
import { useMobilityData } from '../hooks/useMobilityData';
import { useResolvedUiState } from '../hooks/useUiState';
import {
  getBikesStatusDistributionFiltered,
  getTripsByTimeSlotDualSeries,
  getIncidentsByTypeDistribution,
  getAvgMaintenanceHours,
  getTopProblematicBikes,
  BIKE_STATUS_LABELS,
  BIKE_STATUS_COLORS,
} from '../services/mobilityService';
import {
  mockStationsEntities,
  mockBikesEntities,
  mockIncidentTypesEntities,
  mockBikeIncidentsEntities,
  mockMaintenanceRecordsEntities,
  mockViajeIniciadoEvents,
  mockViajeFinalizadoEvents,
} from '../data/mocks/mobility.mock';
import { isWithinDateRange } from '../utils/dates';
import type { BikeStatus } from '../types';

export function MobilityDashboard() {
  const { filters, updateFilter, updateDateRange } = useFilters();
  const mobilityAsync = useMobilityData(filters);
  const resolved = useResolvedUiState(mobilityAsync);

  // Independent local station filter state per chart / card
  const [selectedStatusStation, setSelectedStatusStation] = useState<string>('ALL');
  const [selectedTimeSlotStation, setSelectedTimeSlotStation] = useState<string>('ALL');
  const [selectedIncidentsStation, setSelectedIncidentsStation] = useState<string>('ALL');
  const [selectedMntStation, setSelectedMntStation] = useState<string>('ALL');
  const [selectedTopBikesStation, setSelectedTopBikesStation] = useState<string>('ALL');

  // Filter trip events based on global date range filters
  const { filteredStartedEvents, filteredFinishedEvents } = useMemo(() => {
    const started = mockViajeIniciadoEvents.filter((e) => isWithinDateRange(e.metadata.occurredAt, filters));
    const finished = mockViajeFinalizadoEvents.filter((e) => isWithinDateRange(e.metadata.occurredAt, filters));
    return { filteredStartedEvents: started, filteredFinishedEvents: finished };
  }, [filters]);

  // Derived data for Chart 2: Bike status distribution (filtered by station)
  const bikeStatusChartData = useMemo(() => {
    return getBikesStatusDistributionFiltered(mockBikesEntities, mockStationsEntities, selectedStatusStation);
  }, [selectedStatusStation]);

  // Derived data for Chart 3: Trips by time slot Dual Series (Iniciados vs Finalizados, filtered by station)
  const timeSlotDualChartData = useMemo(() => {
    return getTripsByTimeSlotDualSeries(filteredStartedEvents, filteredFinishedEvents, selectedTimeSlotStation);
  }, [filteredStartedEvents, filteredFinishedEvents, selectedTimeSlotStation]);

  // Derived metric for Average Maintenance Hours (filtered by station)
  const avgMaintenanceHoursValue = useMemo(() => {
    return getAvgMaintenanceHours(mockMaintenanceRecordsEntities, mockBikesEntities, mockStationsEntities, selectedMntStation);
  }, [selectedMntStation]);

  // Derived data for Incidents by type distribution (filtered by station)
  const incidentsChartData = useMemo(() => {
    return getIncidentsByTypeDistribution(mockBikeIncidentsEntities, mockIncidentTypesEntities, mockStationsEntities, selectedIncidentsStation);
  }, [selectedIncidentsStation]);

  // Derived data for Top 5 problematic bikes (filtered by station)
  const topBikesData = useMemo(() => {
    return getTopProblematicBikes(
      mockBikesEntities,
      mockBikeIncidentsEntities,
      mockMaintenanceRecordsEntities,
      mockStationsEntities,
      selectedTopBikesStation,
      5
    );
  }, [selectedTopBikesStation]);

  return (
    <div>
      <DashboardHeader
        title="Tablero de Movilidad"
        subtitle="Gestión de Flota, Estaciones, Disponibilidad, Operaciones e Incidencias"
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
          {/* KPIs Principales */}
          <div className="section">
            <div className="metrics-grid-6">
              <MetricCard
                metric={{
                  label: 'Total de Bicicletas',
                  value: resolved.data.totalBikes,
                  sublabel: 'Flota total registrada',
                  status: 'info',
                }}
              />
              <MetricCard
                metric={{
                  label: 'Bicicletas Disponibles',
                  value: resolved.data.availableBikesCount,
                  sublabel: 'Listas en estación',
                  status: 'normal',
                }}
              />
              <MetricCard
                metric={{
                  label: 'Espacios Libres',
                  value: resolved.data.totalFreeSlots,
                  sublabel: 'Docks vacíos totales',
                  status: 'normal',
                }}
              />
              <MetricCard
                metric={{
                  label: 'Viajes Iniciados',
                  value: resolved.data.totalTripsStarted,
                  sublabel: 'CU-M1: Origen',
                  status: 'info',
                }}
              />
              <MetricCard
                metric={{
                  label: 'Viajes Finalizados',
                  value: resolved.data.totalTripsCompleted,
                  sublabel: 'CU-M1: Destino',
                  status: 'normal',
                }}
              />
              <MetricCard
                metric={{
                  label: 'Duración Prom. Viaje',
                  value: resolved.data.avgTripDurationMinutes,
                  unit: ' min',
                  sublabel: 'CU-M2: Duración real',
                  status: 'warning',
                }}
              />
            </div>
          </div>

          {/* Sección 1: Flota y Distribución por Estación */}
          <div className="section">
            <h2 className="section-title">Flota y Estado de Bicicletas</h2>
            <div className="charts-grid-2">
              <ChartCard
                title="Cantidad de Bicicletas por Estación"
                subtitle="Distribución total de bicicletas asignadas por estación"
              >
                <BarChart
                  data={resolved.data.bikesByStation}
                  xKey="station"
                  bars={[{ key: 'count', label: 'Bicicletas', color: '#2563A6' }]}
                  horizontal={true}
                  height={280}
                />
              </ChartCard>

              <ChartCard
                title="Bicicletas por Estado"
                subtitle="Disponibles, en uso, mantenimiento, fuera de servicio y robadas"
                actions={
                  <CategorySearchFilter
                    categories={resolved.data.availableStations}
                    selectedCategory={selectedStatusStation}
                    onSelectCategory={setSelectedStatusStation}
                    placeholder="Todas las estaciones"
                  />
                }
              >
                <PieChart data={bikeStatusChartData} height={280} />
              </ChartCard>
            </div>
          </div>

          {/* Sección 2: Disponibilidad y Tiempo Promedio en Mantenimiento */}
          <div className="section">
            <h2 className="section-title">Capacidad y Mantenimiento de Estaciones</h2>
            <div className="charts-grid-2">
              <ChartCard
                title="Disponibilidad u Ocupación por Estación"
                subtitle="Comparativa de bicicletas disponibles vs. espacios libres por estación"
              >
                <BarChart
                  data={resolved.data.stationAvailabilityOccupancy}
                  xKey="station"
                  bars={[
                    { key: 'availableBikes', label: 'Bicis Disponibles', color: '#10B981' },
                    { key: 'freeSlots', label: 'Espacios Libres', color: '#3B82F6' },
                  ]}
                  showLegend={true}
                  height={280}
                />
              </ChartCard>

              <ChartCard
                title="Tiempo Promedio en Mantenimiento"
                subtitle="Duración promedio que las bicicletas permanecen en reparación"
                actions={
                  <CategorySearchFilter
                    categories={resolved.data.availableStations}
                    selectedCategory={selectedMntStation}
                    onSelectCategory={setSelectedMntStation}
                    placeholder="Todas las estaciones"
                  />
                }
              >
                <div
                  style={{
                    height: '280px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '8px',
                    border: '1px solid #F3F4F6',
                    padding: '24px',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Tiempo Promedio
                  </span>
                  <div style={{ fontSize: '56px', fontWeight: 700, color: '#F59E0B', margin: '8px 0' }}>
                    {avgMaintenanceHoursValue} <span style={{ fontSize: '28px', fontWeight: 600, color: '#9CA3AF' }}>hs</span>
                  </div>
                  <span style={{ fontSize: '13px', color: '#9CA3AF', textAlign: 'center' }}>
                    {selectedMntStation && selectedMntStation !== 'ALL' && selectedMntStation !== 'Todas las estaciones'
                      ? `Filtrado para ${selectedMntStation}`
                      : 'Promedio general del sistema'}
                  </span>
                </div>
              </ChartCard>
            </div>
          </div>

          {/* Sección 3: Operaciones y Demanda por Franja Horaria */}
          <div className="section">
            <h2 className="section-title">Demanda Operativa y Flujo de Viajes</h2>
            <ChartCard
              title="Viajes por Franja Horaria (Iniciados vs. Finalizados)"
              subtitle="Distribución cronológica de viajes iniciados (origen) y finalizados (destino)"
              actions={
                <CategorySearchFilter
                  categories={resolved.data.availableStations}
                  selectedCategory={selectedTimeSlotStation}
                  onSelectCategory={setSelectedTimeSlotStation}
                  placeholder="Todas las estaciones"
                />
              }
            >
              <BarChart
                data={timeSlotDualChartData}
                xKey="slot"
                bars={[
                  { key: 'iniciados', label: 'Viajes Iniciados', color: '#2563A6' },
                  { key: 'finalizados', label: 'Viajes Finalizados', color: '#6366F1' },
                ]}
                height={300}
                showLegend={true}
                scrollable={true}
              />
            </ChartCard>
          </div>

          {/* Sección 4: Incidencias por Tipo (Extendido) */}
          <div className="section">
            <h2 className="section-title">Gestión de Incidencias</h2>
            <ChartCard
              title="Incidencias por Tipo"
              subtitle="Cantidad de reportes según el tipo de falla o problema registrado"
              actions={
                <CategorySearchFilter
                  categories={resolved.data.availableStations}
                  selectedCategory={selectedIncidentsStation}
                  onSelectCategory={setSelectedIncidentsStation}
                  placeholder="Todas las estaciones"
                />
              }
            >
              <BarChart
                data={incidentsChartData}
                xKey="typeName"
                bars={[{ key: 'count', label: 'Incidencias', color: '#EF4444' }]}
                height={300}
                scrollable={true}
              />
            </ChartCard>
          </div>

          {/* Sección 5: Ranking de Bicicletas con Mayor Incidencia o Mantenimiento (Top 5) */}
          <div className="section">
            <ChartCard
              title="Bicicletas con Mayor Incidencia o Mantenimiento"
              subtitle="Primeras 5 unidades con más incidencias o intervenciones registradas"
              actions={
                <CategorySearchFilter
                  categories={resolved.data.availableStations}
                  selectedCategory={selectedTopBikesStation}
                  onSelectCategory={setSelectedTopBikesStation}
                  placeholder="Todas las estaciones"
                />
              }
            >
              <div style={{ overflowX: 'auto' }}>
                {topBikesData.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
                    No se encontraron bicicletas con incidencias en la estación seleccionada.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: '12px', textTransform: 'uppercase' }}>
                        <th style={{ padding: '10px 14px' }}>Bicicleta</th>
                        <th style={{ padding: '10px 14px' }}>Estación Actual</th>
                        <th style={{ padding: '10px 14px' }}>Incidencias</th>
                        <th style={{ padding: '10px 14px' }}>Mantenimientos</th>
                        <th style={{ padding: '10px 14px' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topBikesData.map((bike, index) => {
                        const statusColor = BIKE_STATUS_COLORS[bike.status as BikeStatus] || '#6B7280';
                        const statusLabel = BIKE_STATUS_LABELS[bike.status as BikeStatus] || bike.status;
                        return (
                          <tr key={bike.bikeCode} style={{ borderBottom: '1px solid #F3F4F6' }}>
                            <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1A2332' }}>
                              #{index + 1} — {bike.bikeCode}
                            </td>
                            <td style={{ padding: '12px 14px', color: '#4B5563' }}>{bike.stationName}</td>
                            <td style={{ padding: '12px 14px', color: '#DC2626', fontWeight: 600 }}>{bike.incidentCount}</td>
                            <td style={{ padding: '12px 14px', color: '#D97706', fontWeight: 600 }}>{bike.maintenanceCount}</td>
                            <td style={{ padding: '12px 14px' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '3px 8px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: '#FFFFFF',
                                  backgroundColor: statusColor,
                                }}
                              >
                                {statusLabel}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </ChartCard>
          </div>
        </>
      ) : null}
    </div>
  );
}
