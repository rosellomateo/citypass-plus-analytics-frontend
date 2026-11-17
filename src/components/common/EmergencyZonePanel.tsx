import { useState } from 'react';
import { Badge, SegmentedControl } from '@mantine/core';
import type { CrossModuleResponse, EmergencyZoneLink } from '../../api/types';
import { getDataSource } from '../../dataSources/dataSource';
import type { DashboardFilters } from '../../types';
import { formatTimestamp } from '../../utils/dates';
import { getZonePeriod } from '../../utils/zoneDates';
import { BarChart } from '../charts/BarChart';
import { ChartCard } from './ChartCard/ChartCard';
import { DataTable, type Column } from './DataTable/DataTable';

const PRIORITY_ORDER = { CRITICA: 4, ALTA: 3, MEDIA: 2, BAJA: 1 };
const PRIORITY_LABEL = { CRITICA: 'Crítica', ALTA: 'Alta', MEDIA: 'Media', BAJA: 'Baja' };
const PRIORITY_COLOR = { CRITICA: 'red', ALTA: 'orange', MEDIA: 'yellow', BAJA: 'teal' };
const BARS = [
  { key: 'resolved', label: 'Resueltas', color: '#4F8A72', stackId: 'sector' },
  { key: 'open', label: 'No resueltas', color: '#D99838', stackId: 'sector' },
  { key: 'discarded', label: 'Descartadas o canceladas', color: '#C83E4D', stackId: 'sector' },
  { key: 'unknown', label: 'Sin estado confirmado', color: '#8FB8D8', stackId: 'sector' },
];

function resolution(state?: string | null) {
  switch (state?.toUpperCase()) {
    case 'RESUELTA': case 'CERRADA': return 'resolved';
    case 'DESCARTADA': case 'CANCELADA': return 'discarded';
    case 'PENDIENTE': case 'DESPACHADA': case 'EN_PROCESO': case 'EN_CURSO': case 'ACTIVA': return 'open';
    default: return 'unknown';
  }
}

export function EmergencyZonePanel({ data, filters, loading }: {
  data: CrossModuleResponse | null;
  filters: DashboardFilters;
  loading: boolean;
}) {
  const [view, setView] = useState('elevated');
  if (getDataSource() === 'embedded') return null;
  const { from, to } = getZonePeriod(filters);
  const rows = (data?.emergencias_zona ?? []).filter((record) => {
    const linked = Date.parse(record.vinculada_en);
    return linked >= +from && linked <= +to;
  }).sort((a, b) =>
    (b.criticidad ? PRIORITY_ORDER[b.criticidad] : 0) - (a.criticidad ? PRIORITY_ORDER[a.criticidad] : 0) ||
    Date.parse(b.vinculada_en) - Date.parse(a.vinculada_en)
  );
  const sectors = new Map<string, { sector: string; resolved: number; open: number; discarded: number; unknown: number }>();
  const emergencies = new Set<string>();
  for (const row of rows) {
    if (emergencies.has(row.emergencia_id)) continue;
    emergencies.add(row.emergencia_id);
    const sector = row.sector || 'Sin sector informado';
    const counts = sectors.get(sector) ?? { sector, resolved: 0, open: 0, discarded: 0, unknown: 0 };
    counts[resolution(row.estado)] += 1;
    sectors.set(sector, counts);
  }
  const table = rows.filter((row) => view === 'elevated' ? row.criticidad_elevada === true : row.evento_id != null)
    .map((row) => ({ ...row, key: `${row.emergencia_id}/${row.evento_id ?? 'repeticion'}` }));
  const response: Column<typeof table[number]>[] = table.some((row) => row.respondida != null)
    ? [{ key: 'respondida', label: 'Respondida', render: (row) => row.respondida == null ? 'Sin informar' : row.respondida ? 'Sí' : 'No' }]
    : [];

  return (
    <section className="section" aria-label="Efectos sobre emergencias">
      <h2 className="section-title">Efectos sobre emergencias</h2>
      <ChartCard title={view === 'elevated' ? 'Emergencias con criticidad afectada por evento' : 'Emergencias vinculadas a eventos cercanos'}
        loading={loading && !data} actions={<SegmentedControl value={view} onChange={setView}
          data={[{ label: 'Criticidad afectada', value: 'elevated' }, { label: 'Eventos cercanos', value: 'nearby' }]} />}>
        <DataTable<EmergencyZoneLink & { key: string }>
          keyField="key"
          data={table}
          emptyMessage={view === 'elevated' ? 'El período seleccionado no tiene aumentos de criticidad confirmados.'
            : 'El período seleccionado no tiene vínculos con eventos cercanos.'}
          columns={[
            { key: 'criticidad', label: 'Criticidad', render: (row) => row.criticidad
              ? <Badge color={PRIORITY_COLOR[row.criticidad]} variant="light">{PRIORITY_LABEL[row.criticidad]}</Badge>
              : 'Sin informar' },
            { key: 'nombre_evento', label: 'Evento asociado', render: (row) => row.nombre_evento ?? row.evento_id ?? 'Sin informar' },
            { key: 'tipo', label: 'Tipo', render: (row) => row.tipo ?? 'Sin informar' },
            { key: 'criticidad_elevada', label: 'Cambio de criticidad', render: (row) => {
              if (row.criticidad_elevada == null) return 'Sin confirmar';
              if (!row.criticidad_elevada) return 'Sin aumento';
              const previous = row.criticidad_original ? `Antes ${PRIORITY_LABEL[row.criticidad_original]}` : 'Aumento confirmado';
              return row.causa_repetida ? `${previous} · Causa repetida` : previous;
            } },
            { key: 'sector', label: 'Sector', render: (row) => row.sector ?? 'Sin informar' },
            { key: 'estado', label: 'Estado', render: (row) => row.estado?.replaceAll('_', ' ') ?? 'Sin informar' },
            ...response,
            { key: 'radio_metros', label: 'Radio', render: (row) => row.radio_metros == null ? '—' : `${row.radio_metros} m` },
            { key: 'vinculada_en', label: 'Registrada el', render: (row) => formatTimestamp(row.vinculada_en) },
          ]}
        />
      </ChartCard>
      {sectors.size > 0 && (
        <ChartCard title="Emergencias resueltas y no resueltas por sector"
          subtitle="Emergencias distintas vinculadas a eventos en el período seleccionado.">
          <BarChart data={[...sectors.values()].sort((a, b) => a.sector.localeCompare(b.sector, 'es-AR'))}
            xKey="sector" bars={BARS} horizontal showLegend height={Math.max(230, 60 + sectors.size * 35)} />
        </ChartCard>
      )}
    </section>
  );
}
