import { DashboardImpactCards } from '../components/common/DashboardImpactCards';
import { Anchor } from '@mantine/core';
import { CausePie } from '../components/common/CausePie';
import { PublicEventStations } from '../components/mobility/PublicEventStations';
import { useDashboardImpact } from '../hooks/useDashboardImpact';
// src/pages/MobilityDashboard.tsx
import { useMemo } from 'react';
import { DashboardHeader } from '../components/common/DashboardHeader/DashboardHeader';
import { MetricCard } from '../components/common/MetricCard/MetricCard';
import { ChartCard } from '../components/common/ChartCard/ChartCard';
import { BarChart } from '../components/charts/BarChart';
import { PieChart } from '../components/charts/PieChart';
import { DataTable } from '../components/common/DataTable/DataTable';
import { ErrorCard } from '../components/common/ErrorState/ErrorState';
import { MetricsGridSkeleton, ChartSkeleton } from '../components/common/LoadingState/LoadingState';
import { useFilters } from '../hooks/useFilters';
import { useMobilityData } from '../hooks/useMobilityData';
import { useResolvedUiState } from '../hooks/useUiState';
import { CAUSA_NORMAL, causeLabel } from '../services/mobilityService';

// Colores por causa (los mismos tonos que usa el resto de los tableros).
const CAUSE_COLORS: Record<string, string> = {
  EVENTO_CLIMATICO: '#2563A6',
  RECLAMO: '#D99838',
  EVENTO_PUBLICO: '#7C3AED',
  INCIDENTE_VIAL: '#EF4444',
  EMERGENCIA: '#DC2626',
  RESERVA: '#10B981',
  NORMAL: '#6B7280',
};

const integerFormatter = new Intl.NumberFormat('es-AR');

export function MobilityDashboard() {
  const impact = useDashboardImpact('mobility');
  const { filters } = useFilters();
  const mobilityAsync = useMobilityData(filters);
  const resolved = useResolvedUiState(mobilityAsync);

  const data = resolved.data;
  const records = useMemo(() => data?.records ?? [], [data]);

  // Gráfico 1: afectaciones, bloqueos y restauraciones por causa.
  const affectationsByCause = data?.affectationsByCause ?? [];

  // Gráfico 2: viajes interrumpidos por causa vs. finalizados normalmente (caso 5).
  const tripsByCauseData = useMemo(() => {
    // El PieChart ya muestra el porcentaje de cada porción.
    return (data?.tripsByCause ?? []).map((item) => ({
      name: item.etiqueta,
      value: item.viajes,
      color: CAUSE_COLORS[item.causa] || '#6B7280',
    }));
  }, [data]);

  const snapshotLabel = data?.snapshotDate ? `Corte ${data.snapshotDate.slice(0, 10)}` : 'Último corte publicado';
  const caseReport = data ? { fecha_snapshot: data.snapshotDate, datos: data.caseMetrics } : impact.data;

  return (
    <div>
      <DashboardHeader
        title="Tablero de Movilidad Urbana"
        subtitle="Afectaciones de estaciones y viajes por causa (casos de uso de la Parte 2)"

        aiReport={resolved.data?.aiReport}

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
          {/* KPIs principales: totales del resumen por causa de gold */}
          <div className="section">
            <div className="metrics-grid-6">
              <MetricCard
                metric={{
                  label: 'Afectaciones de estaciones',
                  value: resolved.data.totalAffectations,
                  sublabel: snapshotLabel,
                  status: 'info',
                }}
              />
              <MetricCard
                metric={{
                  label: 'Bloqueos',
                  value: resolved.data.totalBlocked,
                  sublabel: 'Afectaciones que bloquearon la estación',
                  status: 'warning',
                }}
              />
              <MetricCard
                metric={{
                  label: 'Afectaciones preventivas',
                  value: resolved.data.totalPreventive,
                  sublabel: 'Afectaciones registradas como preventivas',
                  status: 'normal',
                }}
              />
              <MetricCard
                metric={{
                  label: 'Restauraciones de afectaciones',
                  value: resolved.data.totalRestored,
                  sublabel: `${resolved.data.restoredPct}% de las afectaciones`,
                  status: 'normal',
                }}
              />
              <MetricCard
                metric={{
                  label: 'Causa principal',
                  value: resolved.data.topCause,
                  sublabel: 'Causa con más afectaciones',
                  status: 'info',
                }}
              />
              <MetricCard
                metric={{
                  label: 'Viajes interrumpidos',
                  value: resolved.data.interruptedTrips,
                  sublabel: `Frente a ${integerFormatter.format(resolved.data.normalTrips)} finalizados normalmente`,
                  status: 'warning',
                }}
                action={<Anchor href="#viajes-afectados" size="sm">Ver viajes afectados</Anchor>}
              />
            </div>
            <div className="metrics-grid-4">
              <DashboardImpactCards area="mobility" data={caseReport} showMissing />
            </div>
          </div>

          {/* Sección de Visualizaciones */}
          <div className="section">
            <div className="charts-grid-2">
              <ChartCard
                title="Afectaciones de estaciones por causa"
                subtitle="Afectaciones, bloqueos y restauraciones por causa"
              >
                <BarChart
                  data={affectationsByCause}
                  xKey="etiqueta"
                  bars={[
                    { key: 'afectaciones', label: 'Afectaciones', color: '#2563A6' },
                    { key: 'bloqueadas', label: 'Bloqueos', color: '#EF4444' },
                    { key: 'restauradas', label: 'Restauradas', color: '#10B981' },
                    { key: 'preventivas', label: 'Preventivas', color: '#F59E0B' },
                  ]}
                  height={350} showLegend scrollable minWidth={Math.max(600, affectationsByCause.length * 130)}
                />
              </ChartCard>

              <ChartCard
                title="Viajes interrumpidos y finalizados normalmente"
                subtitle="Interrumpidos por causa frente a finalizados normalmente"
              >
                <PieChart data={tripsByCauseData} height={280} />
              </ChartCard>
            </div>
          </div>

          <div className="section">
            <ChartCard
              title="Estaciones distintas afectadas por causa"
              subtitle="Una estación afectada varias veces por la misma causa cuenta una vez"
            >
              <BarChart
                data={affectationsByCause}
                xKey="etiqueta"
                bars={[
                  { key: 'estaciones', label: 'Estaciones afectadas', color: '#7C3AED' },
                  { key: 'estacionesBloqueadas', label: 'Estaciones bloqueadas', color: '#EF4444' },
                ]}
                height={350} showLegend scrollable minWidth={Math.max(600, affectationsByCause.length * 130)}
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
                Detalle por causa
              </h3>

              <DataTable
                columns={[
                  { key: 'causa', label: 'Causa', render: (row: any) => row.causa },
                  { key: 'cantidadAfectaciones', label: 'Afectaciones', width: '120px' },
                  { key: 'estacionesAfectadasDistintas', label: 'Estaciones distintas', width: '150px' },
                  { key: 'cantidadBloqueadas', label: 'Bloqueos', width: '100px' },
                  { key: 'estacionesBloqueadasDistintas', label: 'Estaciones distintas bloqueadas', width: '150px' },
                  { key: 'cantidadPreventivas', label: 'Preventivas', width: '110px' },
                  { key: 'cantidadRestauradas', label: 'Restauradas', width: '110px' },
                  { key: 'cantidadViajesInterrumpidos', label: 'Viajes', width: '90px',
                    render: (row: any) => <span title={row.causaTipo === CAUSA_NORMAL ? 'Viajes finalizados normalmente' : 'Viajes interrumpidos por esta causa'}>{row.cantidadViajesInterrumpidos}</span> },
                ]}
                data={records.map((r) => ({ ...r, causa: causeLabel(r.causaTipo), _id: r.causaTipo || 'SIN_CAUSA' }))}
                keyField="_id"
                pageSize={10}
              />
            </div>
          </div>
        </>
      ) : null}
      {!resolved.loading && (resolved.error || !resolved.data) && <DashboardImpactCards area="mobility" data={impact.data} standalone showMissing />}
      {data && <section className="section" id="viajes-afectados" aria-label="Viajes afectados">
        <h2 className="section-title">Viajes afectados</h2>
        <CausePie title="Estaciones afectadas por causa" date={data.snapshotDate.slice(0, 10)}
            description="Estaciones distintas dentro de cada causa" unit=" estaciones"
            points={affectationsByCause.map(({ etiqueta, estaciones }) => ({ etiqueta, valor: estaciones }))} />
        <PublicEventStations report={impact.data} />
      </section>}
    </div>
  );
}
