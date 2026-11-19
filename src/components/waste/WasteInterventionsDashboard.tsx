import { useState } from 'react';
import { Badge, Group, Select } from '@mantine/core';
import type { CrossModuleResponse } from '../../api/types';
import type { DashboardFilters, WasteInterventionMetrics } from '../../types';
import { wasteCauseLabel } from '../../services/wasteInterventionService';
import { BarChart } from '../charts/BarChart';
import { ChartCard } from '../common/ChartCard/ChartCard';
import { CausePie } from '../common/CausePie';
import { DashboardHeader } from '../common/DashboardHeader/DashboardHeader';
import { DashboardImpactCards } from '../common/DashboardImpactCards';
import { DataTable } from '../common/DataTable/DataTable';
import { FilterBar } from '../common/FilterBar/FilterBar';
import { MetricCard } from '../common/MetricCard/MetricCard';

const STATE_COLORS: Record<string, string> = { AFECTADA: '#C83E4D', PROGRAMADA: '#2563A6', CANCELADA: '#D99838', COMPLETADA: '#4F8A72' };
const stateLabel = (state: string) => state.charAt(0) + state.slice(1).toLowerCase();
const STATE_ORDER = ['AFECTADA', 'PROGRAMADA', 'CANCELADA', 'COMPLETADA'];

export function WasteInterventionsDashboard({ data, report, filters, onFilterChange }: {
  data: WasteInterventionMetrics;
  report: CrossModuleResponse | null;
  filters: DashboardFilters;
  onFilterChange: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void;
}) {
  const [state, setState] = useState<string | null>(null);
  const [affection, setAffection] = useState<string | null>(null);
  const detail = data.details.filter((row) => (!state || row.state === state) && (!affection || row.affectionCause === affection))
    .sort((a, b) => STATE_ORDER.indexOf(a.state) - STATE_ORDER.indexOf(b.state));
  const hasDetailFilters = Boolean(state || affection || data.filtered);
  const detected = detail.reduce((total, row) => total + row.interventions, 0);
  // c5 uses origenProgramacion, which the primary endpoint omits. Only use
  // the published Parte 2 metric for the same unfiltered snapshot.
  const sameCut = report?.fecha_snapshot?.slice(0, 10) === data.snapshotDate.slice(0, 10);
  const originMetric = !data.filtered && sameCut ? report?.datos.find(({ id }) => id === 'c5') : undefined;
  const caseData: CrossModuleResponse = { fecha_snapshot: data.snapshotDate,
    datos: [...data.caseMetrics, ...(originMetric ? [originMetric] : [])] };
  const cards = [
    { label: 'Total de intervenciones', value: data.total, status: 'info' as const },
    { label: 'Intervenciones programadas', value: data.scheduled, status: 'info' as const },
    { label: 'Intervenciones afectadas', value: data.affected, status: 'warning' as const },
    { label: 'Intervenciones canceladas', value: data.cancelled, status: 'warning' as const },
    { label: 'Intervenciones completadas', value: data.completed, status: 'normal' as const },
    { label: 'Tasa de finalización', value: data.completionRatePct, unit: '%', status: 'normal' as const },
  ];
  return <div>
    <DashboardHeader title="Tablero de Residuos" subtitle="Programación y afectación de intervenciones de recolección."
      aiReport={data.aiReport} filters_extra={<FilterBar filters={[
        { key: 'zone', label: 'Zona', options: data.availableZones.map((value) => ({ value, label: value })),
          value: filters.zone ?? 'all', onChange: (value) => onFilterChange('zone', value) },
        { key: 'wasteType', label: 'Causa de programación', options: data.availableSchedulingCauses.map((value) => ({ value, label: wasteCauseLabel(value) })),
          value: filters.wasteType ?? filters.category ?? 'all', onChange: (value) => { onFilterChange('wasteType', value); onFilterChange('category', value); } },
      ]} searchValue={filters.search} onSearchChange={(value) => onFilterChange('search', value)}
        searchPlaceholder="Buscar zona, estado o causa..." />} />
    <section className="section">
      <div className="metrics-grid-6">{cards.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</div>
      <div className="metrics-grid-auto"><DashboardImpactCards area="waste" data={caseData} /></div>
    </section>
    <section className="section">
      <div className="charts-grid-2">
        <CausePie title="Intervenciones por causa de programación" points={data.bySchedulingCause} unit=" intervenciones" />
        <CausePie title="Intervenciones afectadas por causa" points={data.byAffectionCause}
          description="Intervenciones con estado afectada" unit=" intervenciones" />
      </div>
    </section>
    <section className="section">
      <div className="charts-grid-2">
        <ChartCard title="Intervenciones por estado">
          <BarChart data={data.byState.map((row) => ({ ...row, label: stateLabel(row.state), color: STATE_COLORS[row.state] }))}
            xKey="label" bars={[{ key: 'count', label: 'Intervenciones' }]} colorField="color" height={320} />
        </ChartCard>
        <ChartCard title="Intervenciones por zona">
          <BarChart data={data.byZone} xKey="zone" bars={[
            { key: 'total', label: 'Total', color: '#2563A6' }, { key: 'affected', label: 'Afectadas', color: '#C83E4D' },
            { key: 'cancelled', label: 'Canceladas', color: '#D99838' },
          ]} height={360} scrollable minWidth={Math.max(600, data.byZone.length * 130)} xAxisTickAngle={-30} showLegend />
        </ChartCard>
      </div>
    </section>
    <section className="section">
      <ChartCard title={<Group gap="xs"><span>Detalle de intervenciones</span>
        {hasDetailFilters && <Badge variant="light" color="blue" role="status">{detected.toLocaleString('es-AR')} detectadas</Badge>}
      </Group>} actions={<Group gap="xs" justify="flex-end">
        <Select aria-label="Estado de intervenciones" placeholder="Todos los estados" size="xs" w={160} clearable value={state} onChange={setState}
          data={data.availableStates.map((value) => ({ value, label: stateLabel(value) }))} />
        <Select aria-label="Causa de afectación de intervenciones" placeholder="Todas las afectaciones" size="xs" w={200} clearable searchable
          value={affection} onChange={setAffection} data={data.availableAffectionCauses.map((value) => ({ value, label: wasteCauseLabel(value) }))} />
      </Group>}>
        <DataTable key={`${state}/${affection}/${filters.zone}/${filters.wasteType}/${filters.search}`} data={detail} keyField="id" pageSize={10} columns={[
          { key: 'zone', label: 'Zona' },
          { key: 'state', label: 'Estado', render: (row) => <Badge variant="light" color={STATE_COLORS[row.state]}>{stateLabel(row.state)}</Badge> },
          { key: 'schedulingCause', label: 'Causa de programación', render: (row) => wasteCauseLabel(row.schedulingCause) },
          { key: 'affectionCause', label: 'Causa de afectación', render: (row) => wasteCauseLabel(row.affectionCause) },
          { key: 'interventions', label: 'Intervenciones' },
        ]} />
      </ChartCard>
    </section>
  </div>;
}
