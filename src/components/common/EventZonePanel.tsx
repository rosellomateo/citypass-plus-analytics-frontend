import { useEffect, useState } from 'react';
import { Group, Select } from '@mantine/core';
import type { CrossModuleResponse, PublicEventZone } from '../../api/types';
import { getDataSource } from '../../dataSources/dataSource';
import { formatTimestamp } from '../../utils/dates';
import { eventTime, getPublicEventStatus } from '../../utils/zoneDates';
import { BarChart } from '../charts/BarChart';
import { ChartCard } from './ChartCard/ChartCard';
import { EmptyState } from './EmptyState/EmptyState';
import { MetricCard } from './MetricCard/MetricCard';

const ALL_METRICS = [
  { key: 'recorridos_cercanos', fallback: undefined, label: 'Recorridos en el área', status: 'warning', color: '#D99838' },
  { key: 'emergencias_cercanas', fallback: 'emergencias', label: 'Emergencias en el área', status: 'critical', color: '#C83E4D' },
  { key: 'estaciones_cercanas', fallback: 'estaciones_afectadas', label: 'Estaciones en el área', status: 'info', color: '#2563A6' },
  { key: 'alertas_residuos', fallback: undefined, label: 'Alertas de residuos', status: 'warning', color: '#794CAC' },
  { key: 'intervenciones_residuos', fallback: undefined, label: 'Intervenciones', status: 'normal', color: '#4F8A72' },
  { key: 'reclamos_cercanos', fallback: 'reclamos', label: 'Reclamos en el área', status: 'info', color: '#378B9E' },
] as const;

function eventDate(event: PublicEventZone) {
  return eventTime(event.inicio) ?? eventTime(event.ultimo_vinculo) ?? 0;
}

export function EventZonePanel({ data, loading }: {
  data: CrossModuleResponse | null;
  loading: boolean;
}) {
  const [place, setPlace] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const embedded = getDataSource() === 'embedded';
  const [clock, setClock] = useState(Date.now);
  useEffect(() => {
    if (embedded) return;
    const timer = window.setInterval(() => setClock(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, [embedded]);

  const events = [...(data?.eventos_zona ?? [])].sort((a, b) => eventDate(b) - eventDate(a));
  const places = [...new Set(events.flatMap((event) => event.zona || event.espacio ? [event.zona || event.espacio!] : []))].sort();
  const selectedPlace = place && places.includes(place) ? place : null;
  const options = selectedPlace ? events.filter((event) => (event.zona || event.espacio) === selectedPlace) : events;
  const selected = options.find((event) => event.evento_id === eventId) ?? options[0];
  const status = selected ? getPublicEventStatus(selected, clock) : null;
  const metrics = ALL_METRICS;
  const countFor = (key: typeof ALL_METRICS[number]['key'], fallback: typeof ALL_METRICS[number]['fallback']) => selected?.[key] ?? (fallback ? selected?.[fallback] : undefined);
  const points = selected ? metrics.flatMap(({ key, fallback, label, color }) => {
    const count = countFor(key, fallback);
    return count == null ? [] : [{ label, count, color }];
  }) : [];

  return (
    <section className="section" id="impacto-eventos-zona" aria-label="Impacto por evento público">
      <ChartCard
        title="Impacto por evento público"
        loading={loading && !data}
      >
        {selected ? (
          <>
            <Group align="end" mb="md">
              <Select label="Zona" placeholder="Todas las zonas" clearable searchable
                data={places} value={selectedPlace} onChange={(value) => { setPlace(value); setEventId(null); }} />
              <Select label="Evento" searchable allowDeselect={false} data={options.map((event) => ({
                value: event.evento_id,
                label: event.nombre || event.evento_id,
              }))} value={selected.evento_id} onChange={setEventId} />
            </Group>
            <Group gap="sm" mb="xs">
              {status && <strong>{status}</strong>}
              {selected.inicio && <span>Inicio {formatTimestamp(selected.inicio)}</span>}
              {selected.fin && <span>Fin {formatTimestamp(selected.fin)}</span>}
              {(selected.radio_metros ?? selected.radios_metros?.[0]) != null && <span>Radio {selected.radio_metros ?? selected.radios_metros?.[0]} m</span>}
            </Group>
            <div className="metrics-grid-auto">
              {metrics.map(({ key, fallback, label, status }) => (
                <MetricCard key={key} metric={{ label, value: countFor(key, fallback) ?? 'Sin datos', status }} />
              ))}
            </div>
            {points.length > 0 && <div className="event-impact-chart">
              <BarChart data={points} xKey="label" bars={[{ key: 'count', label: 'Registros' }]}
                colorField="color" horizontal height={Math.max(180, points.length * 42 + 35)} />
            </div>}
          </>
        ) : (
          <EmptyState title="Sin eventos informados" />
        )}
      </ChartCard>
    </section>
  );
}
