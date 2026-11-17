import { useEffect, useState } from 'react';
import { Group, Select } from '@mantine/core';
import type { CrossModuleResponse, PublicEventZone } from '../../api/types';
import { getDataSource } from '../../dataSources/dataSource';
import type { DashboardFilters } from '../../types';
import { formatTimestamp } from '../../utils/dates';
import { eventTime, getPublicEventStatus, getZonePeriod } from '../../utils/zoneDates';
import { BarChart } from '../charts/BarChart';
import { ChartCard } from './ChartCard/ChartCard';
import { EmptyState } from './EmptyState/EmptyState';
import { MetricCard } from './MetricCard/MetricCard';

const WASTE_METRICS = [
  { key: 'alertas_residuos', label: 'Alertas de residuos', status: 'warning', color: '#D99838' },
  { key: 'intervenciones_residuos', label: 'Intervenciones', status: 'normal', color: '#4F8A72' },
] as const;
const ALL_METRICS = [
  { key: 'emergencias', label: 'Emergencias', status: 'critical', color: '#C83E4D' },
  ...WASTE_METRICS,
  { key: 'estaciones_afectadas', label: 'Estaciones afectadas', status: 'info', color: '#2563A6' },
  { key: 'estaciones_bloqueadas', label: 'Estaciones bloqueadas', status: 'warning', color: '#794CAC' },
  { key: 'reclamos', label: 'Reclamos', status: 'info', color: '#378B9E' },
] as const;

function eventDate(event: PublicEventZone) {
  return eventTime(event.inicio) ?? eventTime(event.ultimo_vinculo) ?? 0;
}

export function EventZonePanel({ data, filters, loading }: {
  data: CrossModuleResponse | null;
  filters: DashboardFilters;
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
  if (embedded) return null;

  const { now, from, to } = getZonePeriod(filters);
  const events = (data?.eventos_zona ?? []).filter((event) => {
    const start = eventTime(event.inicio);
    const publishedEnd = eventTime(event.fin);
    const end = publishedEnd ?? start;
    const linked = eventTime(event.ultimo_vinculo);
    const inPeriod = start !== undefined && end !== undefined && start <= +to && end >= +from;
    return inPeriod || (linked !== undefined && linked >= +from && linked <= +to) ||
      (event.estado === 'EN_CURSO' && +now >= +from && +now <= +to && publishedEnd === undefined);
  }).sort((a, b) => eventDate(b) - eventDate(a));
  const places = [...new Set(events.flatMap(({ espacio }) => espacio ? [espacio] : []))].sort();
  const selectedPlace = place && places.includes(place) ? place : null;
  const options = selectedPlace ? events.filter((event) => event.espacio === selectedPlace) : events;
  const selected = options.find((event) => event.evento_id === eventId) ?? options[0];
  const status = selected ? getPublicEventStatus(selected, clock) : null;
  const metrics = ALL_METRICS;
  const points = selected ? metrics.flatMap(({ key, label, color }) => {
    const count = selected[key];
    return count == null ? [] : [{ label, count, color }];
  }) : [];

  return (
    <section className="section" id="impacto-eventos-zona" aria-label="Impacto por evento público">
      <ChartCard
        title="Impacto por evento público"
        subtitle="Registros vinculados al evento o ubicados dentro de su radio y horario."
        loading={loading && !data}
      >
        {selected ? (
          <>
            <Group align="end" mb="md">
              <Select label="Lugar" placeholder="Todos los lugares" clearable searchable
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
            </Group>
            <div className="metrics-grid-auto">
              {metrics.map(({ key, label, status }) => (
                <MetricCard key={key} metric={{ label, value: selected[key] ?? 'Sin datos', status }} />
              ))}
            </div>
            {points.length > 0 && <div className="event-impact-chart">
              <BarChart data={points} xKey="label" bars={[{ key: 'count', label: 'Registros' }]}
                colorField="color" horizontal height={Math.max(180, points.length * 42 + 35)} />
            </div>}
          </>
        ) : (
          <EmptyState title="Sin eventos para el período"
            description="Elegí otro período o revisá que el corte incluya eventos públicos y sus vínculos." />
        )}
      </ChartCard>
    </section>
  );
}
