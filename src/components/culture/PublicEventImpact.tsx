import { useState } from 'react';
import { Select } from '@mantine/core';
import type { CrossModuleResponse, PublicEventZone } from '../../api/types';
import { formatTimestamp } from '../../utils/dates';
import { CausePie } from '../common/CausePie';
import { ChartCard } from '../common/ChartCard/ChartCard';
import { DataTable, type Column } from '../common/DataTable/DataTable';

export function PublicEventImpact({ report }: { report: CrossModuleResponse | null }) {
  const [chosen, setChosen] = useState<string | null>(null);
  const byId = new Map<string, PublicEventZone>();
  for (const event of report?.eventos_publicos ?? []) byId.set(event.evento_id, event);
  for (const event of report?.eventos_zona ?? []) byId.set(event.evento_id, { ...byId.get(event.evento_id), ...event });
  const events = [...byId.values()];
  const filterableEvents = events.filter((event) => Array.isArray(event.causas));
  const selected = chosen ? filterableEvents.find((event) => event.evento_id === chosen) : undefined;
  const rows = selected ? [selected] : events;
  const causes = selected ? selected.causas ?? [] : report?.resumen_gold?.find(({ id }) => id === 'culture-cause')?.puntos ?? [];
  const date = (value?: string | null) => value ? formatTimestamp(value) : '';
  const description: Column<PublicEventZone>[] = rows.some(({ descripcion_efecto }) => descripcion_efecto)
    ? [{ key: 'descripcion_efecto', label: 'Descripción', render: (row) => {
      const text = row.descripcion_efecto?.trim() ?? '';
      return <span title={text.length > 120 ? text : undefined}>{text.length > 120 ? `${text.slice(0, 117)}…` : text}</span>;
    } }] : [];

  return <section className="section" id="impacto-eventos-publicos">
    <CausePie title="Causas de afecto" points={causes} actions={
      <Select aria-label="Filtrar impacto por evento público" placeholder="Todos los eventos" size="xs" w={210}
        searchable clearable disabled={!filterableEvents.length} value={selected?.evento_id ?? null} onChange={setChosen}
        data={filterableEvents.map((event) => ({ value: event.evento_id, label: event.nombre || event.evento_id }))} />
    } />
    <ChartCard title="Eventos públicos y sus afectaciones">
      {rows.length ? <DataTable key={selected?.evento_id ?? 'all'} keyField="evento_id" data={rows} pageSize={10}
        emptyMessage="Sin eventos informados."
        columns={[
          { key: 'nombre', label: 'Evento', render: (row) => row.nombre || row.evento_id },
          { key: 'inicio', label: 'Inicio', render: (row) => date(row.inicio) },
          { key: 'fin', label: 'Fin', render: (row) => date(row.fin) },
          { key: 'efecto', label: 'Efecto', render: (row) => row.efecto || row.causas?.filter(({ valor }) => valor > 0).map(({ etiqueta }) => etiqueta).join(', ') || '' },
          ...description,
        ]} /> : <p role="status">Sin eventos informados.</p>}
    </ChartCard>
  </section>;
}
