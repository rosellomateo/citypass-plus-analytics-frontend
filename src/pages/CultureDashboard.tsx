import { DashboardImpactCards } from '../components/common/DashboardImpactCards';
import { EventZonePanel } from '../components/common/EventZonePanel';
import { PublicEventImpact } from '../components/culture/PublicEventImpact';
import { ActivityOrganizerChart } from '../components/culture/ActivityOrganizerChart';
import { useDashboardImpact } from '../hooks/useDashboardImpact';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Anchor, Group } from '@mantine/core';
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
  const impact = useDashboardImpact('culture');
  const { filters } = useFilters();
  const cultureAsync = useCultureData(filters);
  const resolved = useResolvedUiState(cultureAsync);
  const location = useLocation();
  const gold = impact.data?.resumen_gold;
  const massActivities = gold?.find(({ id }) => id === 'culture-mass');
  const organizers = gold?.find(({ id }) => id === 'culture-organizer')?.puntos;
  const activities = resolved.data?.activities;
  const organizerCards = <>
    <MetricCard metric={{ label: 'Actividades de ciudadanos',
      value: activities?.byOrganizer ? activities.byOrganizer.find(({ organizer }) => organizer === 'CIUDADANO')?.count ?? 0
        : organizers?.find(({ etiqueta }) => etiqueta === 'CIUDADANO')?.valor ?? 'Sin datos', status: 'info' }} />
    <MetricCard metric={{ label: 'Actividades de la ciudad',
      value: activities?.byOrganizer ? activities.byOrganizer.find(({ organizer }) => organizer === 'CIUDAD')?.count ?? 0
        : organizers?.find(({ etiqueta }) => etiqueta === 'CIUDAD')?.valor ?? 'Sin datos', status: 'info' }} />
  </>;

  useEffect(() => {
    if (!resolved.loading && new URLSearchParams(location.search).get('tab') === 'events') {
      document.getElementById('impacto-eventos-publicos')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location.search, resolved.loading]);

  return (
    <div>
      <DashboardHeader
        title="Espacios Públicos y Cultura"
        subtitle={activities ? 'Actividades y afectaciones en espacios públicos' : 'CU-C1: Ocupación de espacios públicos | CU-C2: Convocatoria de eventos comunitarios'}

        aiReport={resolved.data?.aiReport}

        actions={<Group gap="sm">
          {resolved.data && <Anchor href="#impacto-eventos-publicos" size="sm">Ver eventos</Anchor>}
        </Group>}
      />

      {resolved.loading ? (
        <div className="section">
          <MetricsGridSkeleton count={4} />
          <ChartSkeleton />
        </div>
      ) : resolved.error ? (
        <ErrorCard message={resolved.error} onRetry={cultureAsync.refetch} />
      ) : activities ? (
        <>
          <section className="section"><div className="metrics-grid-auto">
            <MetricCard metric={{ label: 'Actividades', value: activities.total }} />
            <MetricCard metric={{ label: 'Actividades masivas', value: activities.massive }} />
            <MetricCard metric={{ label: 'Actividades afectadas por clima', value: activities.affectedByClimate ?? 'Sin datos' }} />
            {organizerCards}
            <DashboardImpactCards area="culture" data={impact.data} />
          </div></section>
          <ActivityOrganizerChart activities={activities} />
          <section className="section">
            <ChartCard title="Cantidad de eventos por zona">
              <BarChart data={activities.byZone ?? []} xKey="zone" bars={[{ key: 'count', label: 'Eventos', color: '#4F8A72' }]}
                horizontal height={Math.max(300, (activities.byZone?.length ?? 0) * 34 + 45)} />
            </ChartCard>
          </section>
          <section className="section" id="cultura-eventos-section">
            <ChartCard title="Actividades por categoría">
              <BarChart data={activities.byCategory} xKey="category" bars={[{ key: 'count', label: 'Actividades' }]} height={Math.max(280, activities.byCategory.length * 38 + 45)} horizontal />
            </ChartCard>
          </section>
        </>
      ) : resolved.data ? (
        <>
          {/* KPIs Principales */}
          <div className="section">
            <div className="metrics-grid-auto">
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
                {organizerCards}
            <DashboardImpactCards area="culture" data={impact.data} />
            </div>
          </div>

          {/* CU-C1: Ocupación de Espacios Públicos */}
          <div id="espacios-publicos-section" className="section">
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
                height={300}
                scrollable={true}
                minWidth={Math.max(800, resolved.data.reservationsBySpace.length * 125)}
                xAxisTickAngle={-35}
                xAxisTickFormatter={(value) => {
                  const label = String(value);
                  return label.length > 18 ? `${label.slice(0, 18)}…` : label;
                }}
              />
            </ChartCard>
          </div>

          {/* CU-C2: Convocatoria a Eventos Comunitarios */}
          <div id="cultura-eventos-section" className="section">
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
      {!resolved.loading && (resolved.error || !resolved.data) && <DashboardImpactCards area="culture" data={impact.data} standalone />}
      <PublicEventImpact report={impact.data} />
      {massActivities && <section className="section">
        <ChartCard title="Actividades masivas por barrio">
          <BarChart data={massActivities.puntos} xKey="etiqueta" bars={[{ key: 'valor', label: 'Actividades masivas' }]}
            height={Math.max(320, 45 + massActivities.puntos.length * 24)} horizontal />
        </ChartCard>
      </section>}
      <EventZonePanel data={impact.data} loading={impact.loading} />
    </div>
  );
}
