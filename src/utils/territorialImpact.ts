import distance from '@turf/distance';
import pointToLineDistance from '@turf/point-to-line-distance';
import type { CrossModuleResponse, EmergencyZoneLink, PublicEventZone, RouteAffectation } from '../api/types';
import type { GeoPosition, TerritorialEvent, TerritorialMatch, TerritorialResource, TerritorialResourceType } from '../types/territorial';

const PUBLIC_TYPES = new Set(['EVENTO_PUBLICO', 'EVENTO_ESPACIO_PUBLICO']);
const INACTIVE = new Set(['CANCELADA', 'CANCELADO', 'CANCELLED', 'SUSPENDIDA', 'SUSPENDIDO']);
const PRIORITIES = { BAJA: 1, MEDIA: 2, ALTA: 3, CRITICA: 4 };
const RESOURCE_FIELDS = {
  emergencia: 'emergencias_cercanas', recorrido_residuos: 'recorridos_cercanos', estacion: 'estaciones_cercanas',
  alerta_residuos: 'alertas_residuos', intervencion_residuos: 'intervenciones_residuos', reclamo: 'reclamos_cercanos',
} as const;

export function validPosition(value: unknown): value is GeoPosition {
  return Array.isArray(value) && value.length === 2 && value.every((part) => typeof part === 'number' && Number.isFinite(part))
    && Math.abs(value[0]) <= 180 && Math.abs(value[1]) <= 90;
}

function time(value?: string) {
  const parsed = value ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

/** Half-open event windows: start included, end excluded. Unknown times never match. */
function coincides(event: TerritorialEvent, resource: TerritorialResource, now: number): boolean | null {
  const start = time(event.inicio), end = time(event.fin);
  if (start == null || end == null || end <= start) return null;
  if (resource.tipo === 'recorrido_residuos' || resource.desde != null || resource.hasta != null) {
    const from = time(resource.desde), to = time(resource.hasta);
    if (from == null || to == null || to <= from) return null;
    return from < end && to > start;
  }
  if (resource.tipo === 'estacion') return now >= start && now < end;
  const created = time(resource.creado_en);
  return created == null ? null : created >= start && created < end;
}

/** A route is compared against its whole line, never just its endpoints or truck position. */
export function resourceDistance(event: TerritorialEvent, resource: TerritorialResource): number | null {
  if (!validPosition(event.coordenadas)) return null;
  if (resource.tipo === 'recorrido_residuos') {
    if (!Array.isArray(resource.trazado) || resource.trazado.length < 2 || !resource.trazado.every(validPosition)) return null;
    return pointToLineDistance(event.coordenadas, { type: 'LineString', coordinates: resource.trazado }, { units: 'meters', method: 'geodesic' });
  }
  return validPosition(resource.coordenadas) ? distance(event.coordenadas, resource.coordenadas, { units: 'meters' }) : null;
}

function mergeBy<T>(computed: T[], published: T[], key: (row: T) => string): T[] {
  const rows = new Map(computed.map((row) => [key(row), row]));
  for (const row of published) rows.set(key(row), { ...rows.get(key(row)), ...row });
  return [...rows.values()];
}

/** Derives display relations only. It never changes a service's priority, route or station state. */
export function resolveTerritorialImpact(report: CrossModuleResponse, now = Date.now()): CrossModuleResponse {
  const context = report.contexto_territorial;
  if (!context || !Array.isArray(context.eventos) || !Array.isArray(context.recursos)) return report;
  const events = [...new Map(context.eventos.filter((event) => event.evento_id && (!event.tipo || PUBLIC_TYPES.has(event.tipo)))
    .map((event) => [event.evento_id, event])).values()];
  const resources = [...new Map(context.recursos.filter((row) => row.recurso_id)
    .map((row) => [`${row.tipo}/${row.recurso_id}`, row])).values()];
  const coverage = new Set(Array.isArray(context.cobertura) ? context.cobertura : []);
  const matches: TerritorialMatch[] = [];
  const summaries: PublicEventZone[] = [];
  const routes: RouteAffectation[] = [];
  const emergencies: EmergencyZoneLink[] = [];

  for (const event of events) {
    const radius = event.radio_metros ?? 500;
    const valid = validPosition(event.coordenadas) && time(event.inicio) != null && time(event.fin) != null
      && Date.parse(event.fin) > Date.parse(event.inicio) && Number.isFinite(radius) && radius > 0;
    const inactive = INACTIVE.has(event.estado?.toUpperCase() ?? '');
    const unknown = new Set<TerritorialResourceType>();
    const counts = new Map<TerritorialResourceType, Set<string>>();
    for (const resource of resources) {
      if (!valid || inactive) continue;
      const temporal = coincides(event, resource, now);
      if (temporal === false) continue;
      const meters = resourceDistance(event, resource);
      if (temporal == null || meters == null || !Number.isFinite(meters)) { unknown.add(resource.tipo); continue; }
      // Compare before rounding; <= includes the boundary itself.
      if (meters > radius + 1e-7) continue;
      const ids = counts.get(resource.tipo) ?? new Set<string>();
      ids.add(resource.recurso_id); counts.set(resource.tipo, ids);
      matches.push({ evento_id: event.evento_id, recurso_id: resource.recurso_id, tipo: resource.tipo,
        nombre: resource.nombre, nombre_evento: event.nombre, zona: resource.zona,
        distancia_metros: meters, radio_metros: radius });
      if (resource.tipo === 'recorrido_residuos') routes.push({
        recorrido_id: resource.recurso_id, recorrido: resource.nombre, evento_id: event.evento_id, nombre_evento: event.nombre,
        zona: resource.zona, inicio: event.inicio, fin: event.fin, inicio_afectacion: resource.desde,
        distancia_metros: meters, criterio: 'proximidad',
      });
      if (resource.tipo === 'emergencia') {
        const original = resource.criticidad_original, current = resource.criticidad;
        const elevated = resource.criticidad_elevada ?? (original && current && original in PRIORITIES && current in PRIORITIES ? PRIORITIES[current] > PRIORITIES[original] : undefined);
        emergencies.push({ emergencia_id: resource.recurso_id, evento_id: event.evento_id, nombre_evento: event.nombre,
          vinculada_en: resource.creado_en ?? resource.desde ?? event.inicio, radio_metros: radius,
          tipo: resource.nombre, sector: resource.zona, criticidad: current, criticidad_original: original,
          criticidad_elevada: elevated, estado: resource.estado, respondida: resource.respondida,
          distancia_metros: meters, criterio: 'proximidad' });
      }
    }
    const summary: PublicEventZone = { evento_id: event.evento_id, nombre: event.nombre, espacio: event.zona,
      zona: event.zona, inicio: event.inicio, fin: event.fin, estado: event.estado, radio_metros: radius, radios_metros: [radius] };
    for (const [kind, field] of Object.entries(RESOURCE_FIELDS)) {
      const type = kind as TerritorialResourceType;
      summary[field] = valid && coverage.has(type) && !unknown.has(type) ? counts.get(type)?.size ?? 0 : null;
    }
    summaries.push(summary);
  }
  // Published effects have priority over estimates; the original JSON is never mutated.
  const publishedEvents = (report.eventos_zona ?? []).map((row) => Object.fromEntries(Object.entries(row).filter(([, value]) => value != null)) as unknown as PublicEventZone);
  return { ...report,
    eventos_zona: mergeBy(summaries, publishedEvents, (row) => row.evento_id),
    emergencias_zona: mergeBy(emergencies, report.emergencias_zona ?? [], (row) => `${row.emergencia_id}/${row.evento_id}`),
    proximidades: mergeBy(matches, report.proximidades ?? [], (row) => `${row.tipo}/${row.recurso_id}/${row.evento_id}`),
    afectaciones: { fecha_snapshot: report.fecha_snapshot ?? '', ...report.afectaciones,
      recorridos_eventos: mergeBy(routes, report.afectaciones?.recorridos_eventos ?? [], (row) => `${row.recorrido_id}/${row.evento_id}`) },
  };
}
