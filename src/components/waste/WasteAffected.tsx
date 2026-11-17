import { useState } from 'react';
import { Anchor, Select } from '@mantine/core';
import type { CrossModuleResponse } from '../../api/types';
import { formatTimestamp } from '../../utils/dates';
import { BarChart } from '../charts/BarChart';
import { CausePie } from '../common/CausePie';
import { ChartCard } from '../common/ChartCard/ChartCard';
import { DataTable } from '../common/DataTable/DataTable';
import { MetricCard } from '../common/MetricCard/MetricCard';

export function WasteAffectedMetric({ report }: { report: CrossModuleResponse | null }) {
  const routes = new Set([
    ...(report?.afectaciones?.recorridos_eventos ?? []),
    ...(report?.afectaciones?.recorridos_efectos ?? []),
  ].map(({ recorrido_id }) => recorrido_id));
  return <MetricCard metric={{
    label: 'Recorridos afectados por eventos',
    value: routes.size || 'Sin datos',
    sublabel: 'Recorridos distintos con afectación registrada',
    status: 'info',
  }} action={<Anchor href="#recorridos-afectados" size="sm">Ver recorridos afectados</Anchor>} />;
}

const EFFECT_NAMES: Record<string, string> = {
  LLUVIA_INTENSA: 'Lluvia intensa',
  ACCIDENTE_TRANSITO: 'Accidente de tránsito',
  CORTE_CALLE: 'Corte de calle',
  CORTE_CALLE_EVENTO: 'Corte de calle por evento',
  SEMAFORO_DANADO: 'Semáforo dañado',
  ARBOL_CAIDO: 'Árbol caído',
  INUNDACION: 'Inundación',
};

function effectName(value: string) {
  if (EFFECT_NAMES[value]) return EFFECT_NAMES[value];
  if (!/^[A-Z_]+$/.test(value)) return value;
  const words = value.toLowerCase().replaceAll('_', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function localDate(value?: string | null) {
  return value ? formatTimestamp(value) : 'Sin informar';
}

export function WasteAffected({ report, zones }: { report: CrossModuleResponse | null; zones: string[] }) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
  const interventions = report?.resumen_gold?.find(({ id }) => id === 'waste-cause');
  const alerts = report?.resumen_gold?.find(({ id }) => id === 'waste-alerts');
  const routes = report?.afectaciones?.recorridos_eventos ?? [];
  const effects = report?.afectaciones?.recorridos_efectos ?? [];
  const zoneName = (zone?: string | null) => zone || 'Sin zona informada';
  const routeZones = [...new Set(routes.map((route) => zoneName(route.zona)))].sort();
  const effectsByName = effects.map((effect) => ({ ...effect, effectLabel: effectName(effect.tipo_efecto) }));
  const effectOptions = [...new Set(effectsByName.flatMap(({ effectLabel, causa }) => [effectLabel, causa]))].sort();
  const activeZone = selectedZone && routeZones.includes(selectedZone) ? selectedZone : null;
  const activeEffect = selectedEffect && effectOptions.includes(selectedEffect) ? selectedEffect : null;
  return (
    <section className="section" id="eventos-afectados-por-residuos" aria-label="Eventos afectados por residuos">
      <h2 className="section-title">Eventos afectados por residuos</h2>
      <CausePie title="Intervenciones por causa publicada" points={interventions?.puntos ?? []}
        date={interventions?.fecha_snapshot} description="Intervenciones de todos los estados publicados"
        note="El total incluye intervenciones programadas y afectadas."
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
        <ChartCard title="Eventos que están afectando los recorridos" centerActions actions={(
          <Select aria-label="Zona de los recorridos" placeholder="Todas las zonas" data={routeZones}
            size="xs" w={165} searchable clearable value={activeZone} onChange={setSelectedZone} />
        )}>
          <DataTable key={activeZone ?? 'all'} keyField="key"
            emptyMessage="El corte no informa recorridos afectados por eventos públicos."
            data={routes.filter((route) => !activeZone || zoneName(route.zona) === activeZone)
              .sort((a, b) => zoneName(a.zona).localeCompare(zoneName(b.zona), 'es-AR'))
              .map((route) => ({ ...route, key: `${route.recorrido_id}/${route.evento_id}` }))}
            columns={[
              { key: 'nombre_evento', label: 'Evento', render: (row) => row.nombre_evento || row.evento_id },
              { key: 'recorrido', label: 'Recorrido afectado', render: (row) => row.recorrido || row.recorrido_id },
              { key: 'inicio', label: 'Inicio del evento', render: (row) => localDate(row.inicio) },
              { key: 'fin', label: 'Fin del evento', render: (row) => localDate(row.fin) },
              { key: 'zona', label: 'Zona', render: (row) => zoneName(row.zona) },
              { key: 'inicio_afectacion', label: 'Afectado desde', render: (row) => localDate(row.inicio_afectacion) },
            ]} />
        </ChartCard>
      </section>
      <section className="section" aria-label="Efectos sobre el recorrido">
        <ChartCard title="Efectos sobre el recorrido" centerActions actions={(
          <Select aria-label="Tipo de efecto" placeholder="Todos los efectos" data={effectOptions}
            size="xs" w={165} searchable clearable value={activeEffect} onChange={setSelectedEffect} />
        )}>
          <DataTable key={activeEffect ?? 'all'} keyField="id"
            emptyMessage="El corte no informa efectos sobre los recorridos para esta selección."
            data={effectsByName.filter(({ effectLabel, causa }) => !activeEffect || effectLabel === activeEffect || causa === activeEffect)}
            columns={[
              { key: 'effectLabel', label: 'Tipo de efecto' },
              { key: 'causa', label: 'Causa' },
              { key: 'recorrido', label: 'Recorrido afectado', render: (row) => row.recorrido || row.recorrido_id },
              { key: 'zona', label: 'Zona', render: (row) => zoneName(row.zona) },
              { key: 'inicio_afectacion', label: 'Afectado desde', render: (row) => localDate(row.inicio_afectacion) },
            ]} />
        </ChartCard>
      </section>
    </section>
  );
}
