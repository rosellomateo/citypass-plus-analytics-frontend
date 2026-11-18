import { useState } from 'react';
import { Anchor, Badge, Group, Select } from '@mantine/core';
import type { CrossModuleResponse } from '../../api/types';
import { PART2_METRICS } from '../../config/crossModuleMetrics';
import { BarChart } from '../charts/BarChart';
import { CausePie } from '../common/CausePie';
import { ChartCard } from '../common/ChartCard/ChartCard';
import { DataTable } from '../common/DataTable/DataTable';
import { MetricCard } from '../common/MetricCard/MetricCard';

export function WasteIncidentMetric({ report }: { report: CrossModuleResponse | null }) {
  const metric = report?.datos.find(({ id }) => id === 'c4');
  const rawCount = report?.intervenciones
    ? new Set(report.intervenciones.filter(({ metadata, data }) => metadata.eventType === 'com.citypass.residuos.IntervencionActualizada' && data.estadoNuevo === 'AFECTADA' && data.causaTipo === 'INCIDENTE_VIAL').map(({ data }) => data.intervencionId).filter(Boolean)).size
    : undefined;
  return <MetricCard metric={{
    label: PART2_METRICS.waste[3][0],
    value: metric?.valor ?? rawCount ?? 'Sin datos',
    sublabel: 'Paradas distintas afectadas',
    status: 'warning',
  }} />;
}

export function WasteAffectedMetric({ report }: { report: CrossModuleResponse | null }) {
  const routes = new Set([
    ...(report?.afectaciones?.recorridos_eventos ?? []),
    ...(report?.afectaciones?.recorridos_efectos ?? []),
  ].map(({ recorrido_id }) => recorrido_id));
  const complete = report?.contexto_territorial
    ? report.contexto_territorial.cobertura.includes('recorrido_residuos') && (report.eventos_zona ?? []).every((event) => event.recorridos_cercanos != null)
    : report?.afectaciones?.recorridos_eventos != null || report?.afectaciones?.recorridos_efectos != null;
  return <MetricCard metric={{
    label: 'Recorridos afectados por eventos',
    value: complete ? routes.size : routes.size || 'Sin datos',
    sublabel: 'Recorridos distintos con afectación registrada',
    status: 'info',
  }} action={<Anchor href="#recorridos-afectados" size="sm">Ver recorridos afectados</Anchor>} />;
}

export function WasteAffected({ report, zones }: { report: CrossModuleResponse | null; zones: string[] }) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const interventions = report?.resumen_gold?.find(({ id }) => id === 'waste-cause');
  const alerts = report?.resumen_gold?.find(({ id }) => id === 'waste-alerts');
  const catalog = new Map([
    ...(report?.eventos_publicos ?? []), ...(report?.eventos_zona ?? []),
  ].map((event) => [event.evento_id, event.nombre]));
  const routes = [...new Map((report?.afectaciones?.recorridos_eventos ?? []).map((route) => [
    `${route.recorrido_id}/${route.evento_id}`, { ...route, key: `${route.recorrido_id}/${route.evento_id}` },
  ])).values()];
  const routeZones = [...new Set(routes.flatMap(({ zona }) => zona ? [zona] : []))].sort();
  const activeZone = selectedZone && routeZones.includes(selectedZone) ? selectedZone : null;
  const visibleRoutes = routes.filter((route) => !activeZone || route.zona === activeZone);
  const eventCount = new Set(visibleRoutes.map(({ evento_id }) => evento_id)).size;
  const routeCount = new Set(visibleRoutes.map(({ recorrido_id }) => recorrido_id)).size;
  return (
    <section className="section" id="eventos-afectados-por-residuos" aria-label="Eventos afectados por residuos">
      <h2 className="section-title">Eventos afectados por residuos</h2>
      <CausePie title="Intervenciones por causa publicada" points={interventions?.puntos ?? []}
        date={interventions?.fecha_snapshot} description="Cantidad de intervenciones" unit=" intervenciones"
        filters={{
          scope: 'zona',
          options: [...zones, ...(alerts?.puntos.map(({ etiqueta }) => etiqueta) ?? [])],
          groups: report?.afectaciones?.zonas ?? [],
        }} />
      {alerts && (
        <ChartCard title="Alertas de residuos por zona" subtitle="Cantidad de alertas registradas en cada zona">
          <BarChart data={alerts.puntos} xKey="etiqueta" bars={[{ key: 'valor', label: 'Alertas' }]}
            height={300} xAxisTickAngle={-28} scrollable />
        </ChartCard>
      )}
      <section id="recorridos-afectados" className="section" aria-label="Eventos que están afectando los recorridos">
        <ChartCard title="Eventos que están afectando los recorridos" centerActions actions={routes.length ? (
          <Group gap="xs">
            <Badge variant="light" color="blue">{eventCount} {eventCount === 1 ? 'evento' : 'eventos'}</Badge>
            <Badge variant="light" color="teal">{routeCount} {routeCount === 1 ? 'recorrido' : 'recorridos'}</Badge>
            {routeZones.length > 0 && <Select aria-label="Zona de los recorridos" placeholder="Todas las zonas" data={routeZones}
              size="xs" w={165} searchable clearable value={activeZone} onChange={setSelectedZone} />}
          </Group>
        ) : undefined}>
          {routes.length ? <DataTable key={activeZone ?? 'all'} keyField="key" pageSize={10}
            emptyMessage="Sin eventos informados."
            data={visibleRoutes}
            columns={[
              { key: 'nombre_evento', label: 'Evento', render: (row) => row.nombre_evento || catalog.get(row.evento_id) || row.evento_id },
              { key: 'recorrido', label: 'Recorrido afectado', render: (row) => row.recorrido || row.recorrido_id },
              ...(routeZones.length ? [{ key: 'zona', label: 'Zona' }] : []),
              ...(routes.some((row) => row.distancia_metros != null) ? [{ key: 'distancia_metros', label: 'Distancia al evento',
                render: (row: typeof routes[number]) => row.distancia_metros == null ? '' : `${Math.round(row.distancia_metros)} m` }] : []),
            ]} /> : <p role="status">Sin eventos informados.</p>}
        </ChartCard>
      </section>
    </section>
  );
}
