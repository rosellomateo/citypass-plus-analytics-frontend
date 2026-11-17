import { DashboardImpactCards } from '../components/common/DashboardImpactCards';
import { CausePie } from '../components/common/CausePie';
import { EventZonePanel } from '../components/common/EventZonePanel';
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
  const { filters, updateFilter, updateDateRange } = useFilters();
  const cultureAsync = useCultureData(filters);
  const resolved = useResolvedUiState(cultureAsync);
  const location = useLocation();
  const gold = impact.data?.resumen_gold;
  const causes = gold?.find(({ id }) => id === 'culture-cause');
  const massActivities = gold?.find(({ id }) => id === 'culture-mass');
  const organizers = gold?.find(({ id }) => id === 'culture-organizer')?.puntos;
  const activities = resolved.data?.activities;
  const affectedCard = <MetricCard metric={{
    label: 'Espacios públicos afectados',
    value: impact.data?.afectaciones?.espacios_publicos ?? 'Sin datos',
    sublabel: 'Espacios distintos con afectación registrada',
    status: 'warning',
  }} action={<Anchor href="#espacios-publicos-afectados" size="sm">Ver espacios afectados</Anchor>} />;
  const organizerCards = <>
    <MetricCard metric={{ label: 'Actividades de ciudadanos',
      value: organizers?.find(({ etiqueta }) => etiqueta === 'CIUDADANO')?.valor ?? 'Sin datos', status: 'info' }} />
    <MetricCard metric={{ label: 'Actividades de la ciudad',
      value: organizers?.find(({ etiqueta }) => etiqueta === 'CIUDAD')?.valor ?? 'Sin datos', status: 'info' }} />
  </>;

  useEffect(() => {
    if (!resolved.loading && new URLSearchParams(location.search).get('tab') === 'events') {
      document.getElementById('cultura-eventos-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location.search, resolved.loading]);

  return (
    <div>
      <DashboardHeader
        title="Espacios Públicos y Cultura"
        subtitle={activities ? 'Actividades y afectaciones en espacios públicos' : 'CU-C1: Ocupación de espacios públicos | CU-C2: Convocatoria de eventos comunitarios'}
        filters={filters}
        aiReport={resolved.data?.aiReport}
        onDateRangeChange={(range) => updateFilter('dateRange', range)}
        onCustomDateSelect={(from, to) => updateDateRange('custom', from, to)}
        actions={<Group gap="sm">
          {resolved.data && <Anchor href="#cultura-eventos-section" size="sm">Ver eventos</Anchor>}
          {impact.data?.eventos_zona?.length ? <Anchor href="#impacto-eventos-zona" size="sm">Ver impacto por evento</Anchor> : null}
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
            {affectedCard}
            {organizerCards}
          </div></section>
          <section className="section" id="cultura-eventos-section">
            <ChartCard title="Actividades por categoría">
              <BarChart data={activities.byCategory} xKey="category" bars={[{ key: 'count', label: 'Actividades' }]} horizontal />
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
              {affectedCard}
              {organizerCards}
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
      <section className="section" id="espacios-publicos-afectados" aria-label="Espacios públicos afectados">
        <h2 className="section-title">Espacios públicos afectados</h2>
        <DashboardImpactCards area="culture" data={impact.data} standalone />
        <div className="charts-grid-2">
          <CausePie title="Causas de afecto" date={causes?.fecha_snapshot}
            description="Actividades por causa publicada" points={causes?.puntos ?? []}
            note={<div className="chart-source-note">
              <div>Incidente vial corresponde a un incidente registrado por Movilidad.</div>
              <div>Accidente vial indica que un accidente obligó a modificar una actividad.</div>
            </div>} />
          {massActivities && (
            <ChartCard title="Actividades masivas por barrio">
              <BarChart data={massActivities.puntos} xKey="etiqueta" bars={[{ key: 'valor', label: 'Actividades masivas' }]}
                height={Math.max(320, 45 + massActivities.puntos.length * 24)} horizontal />
            </ChartCard>
          )}
        </div>
      </section>
      <EventZonePanel data={impact.data} loading={impact.loading} filters={filters} />
    </div>
  );
}
