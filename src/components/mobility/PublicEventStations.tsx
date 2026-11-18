import { useState } from 'react';
import { Select } from '@mantine/core';
import type { CrossModuleResponse } from '../../api/types';
import { ChartCard } from '../common/ChartCard/ChartCard';
import { DataTable } from '../common/DataTable/DataTable';

export function PublicEventStations({ report }: { report: CrossModuleResponse | null }) {
  const [zone, setZone] = useState<string | null>(null);
  const rows = (report?.proximidades ?? []).filter(({ tipo }) => tipo === 'estacion');
  if (!rows.length && !report?.contexto_territorial) return null;
  const zones = [...new Set(rows.flatMap(({ zona }) => zona ? [zona] : []))].sort();
  const selected = zone && zones.includes(zone) ? zone : null;
  return <ChartCard title="Estaciones cercanas a eventos públicos" centerActions actions={zones.length ? (
    <Select aria-label="Zona de estaciones cercanas" data={zones} placeholder="Todas las zonas" size="xs" w={170}
      clearable searchable value={selected} onChange={setZone} />
  ) : undefined}>
    <DataTable key={selected ?? 'all'} data={rows.filter((row) => !selected || row.zona === selected)
      .map((row) => ({ ...row, key: `${row.recurso_id}/${row.evento_id}` }))} keyField="key" pageSize={10}
      columns={[
        { key: 'nombre', label: 'Estación', render: (row) => row.nombre || row.recurso_id },
        { key: 'nombre_evento', label: 'Evento público', render: (row) => row.nombre_evento || row.evento_id },
        { key: 'zona', label: 'Zona', render: (row) => row.zona || '' },
        { key: 'distancia_metros', label: 'Distancia', render: (row) => `${Math.round(row.distancia_metros)} m` },
        { key: 'radio_metros', label: 'Radio del evento', render: (row) => `${row.radio_metros} m` },
      ]} emptyMessage="Sin estaciones cercanas informadas." />
  </ChartCard>;
}
