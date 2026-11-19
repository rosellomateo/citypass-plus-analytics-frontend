import type { WasteApiRecord } from '../api/types';
import type { DashboardFilters, WasteInterventionMetrics } from '../types';
import { causeLabel } from './mobilityService';

const STATES = ['AFECTADA', 'PROGRAMADA', 'CANCELADA', 'COMPLETADA'];
const key = (value: string | null) => (value ?? '').trim().toUpperCase();
const count = (value: number | null) => value != null && Number.isFinite(value) && value >= 0 ? value : 0;

/** Backend residuos_service.intervenciones_a_residuos uses intervention states
 * in prioridad. Genuine alert priorities (ALTA/MEDIA/BAJA) retain the old view. */
export function isInterventionResponse(rows: WasteApiRecord[]): boolean {
  return rows.length > 0 && rows.every((row) => STATES.includes(key(row.prioridad)));
}

export function wasteCauseLabel(value: string): string {
  if (value === 'SIN CAUSA EXTERNA') return 'Sin causa externa';
  if (value === 'SIN AFECTACION') return 'No informada';
  return causeLabel(value);
}

export function mapWasteInterventions(rows: WasteApiRecord[], filters: DashboardFilters): WasteInterventionMetrics {
  // Snapshots are cumulative. Do not add the same population from older cuts.
  const snapshotDate = rows.reduce((latest, row) => row.fecha_snapshot && row.fecha_snapshot > latest ? row.fecha_snapshot : latest, '');
  const snapshot = snapshotDate ? rows.filter((row) => row.fecha_snapshot === snapshotDate) : rows;
  // Exact mapping verified against the backend. Do not read unexposed Gold columns.
  const details = snapshot.map((row, index) => ({
    id: String(index), zone: row.zona?.trim() || 'Sin zona informada',
    state: key(row.prioridad), schedulingCause: key(row.tipoAlerta) || 'SIN CAUSA EXTERNA',
    affectionCause: key(row.rangoNivelLlenado) || 'SIN AFECTACION',
    interventions: count(row.cantidadAlertas), completed: count(row.cantidadResueltas),
  }));
  const cause = filters.wasteType || filters.category;
  const search = filters.search?.trim().toLocaleLowerCase('es-AR');
  const filtered = details.filter((row) => (!filters.zone || filters.zone === 'all' || row.zone.toLowerCase() === filters.zone.toLowerCase())
    && (!cause || cause === 'all' || row.schedulingCause === key(cause))
    && (!search || [row.zone, row.state, wasteCauseLabel(row.schedulingCause), wasteCauseLabel(row.affectionCause)]
      .some((text) => text.toLocaleLowerCase('es-AR').includes(search))));
  const sum = (selected = filtered) => selected.reduce((total, row) => total + row.interventions, 0);
  const affected = filtered.filter((row) => row.state === 'AFECTADA');
  const grouped = (selected: typeof details, field: 'schedulingCause' | 'affectionCause') => {
    const groups = new Map<string, number>();
    for (const row of selected) groups.set(row[field], (groups.get(row[field]) ?? 0) + row.interventions);
    return [...groups].map(([value, valor]) => ({ etiqueta: wasteCauseLabel(value), valor }));
  };
  const total = sum();
  const completed = filtered.reduce((total, row) => total + row.completed, 0);
  const zones = [...new Set(filtered.map((row) => row.zone))].sort();
  return {
    mode: 'interventions', snapshotDate, total, completed,
    affected: sum(affected), scheduled: sum(filtered.filter((row) => row.state === 'PROGRAMADA')),
    cancelled: sum(filtered.filter((row) => row.state === 'CANCELADA')),
    completionRatePct: total ? Number((100 * completed / total).toFixed(2)) : 0,
    byState: STATES.map((state) => ({ state, count: sum(filtered.filter((row) => row.state === state)) })),
    bySchedulingCause: grouped(filtered, 'schedulingCause'), byAffectionCause: grouped(affected, 'affectionCause'),
    byZone: zones.map((zone) => ({ zone, total: sum(filtered.filter((row) => row.zone === zone)),
      affected: sum(affected.filter((row) => row.zone === zone)),
      cancelled: sum(filtered.filter((row) => row.zone === zone && row.state === 'CANCELADA')) })),
    caseMetrics: [
      { id: 'c1', valor: sum(affected.filter((row) => row.affectionCause === 'EVENTO_CLIMATICO')) },
      { id: 'c2', valor: sum(filtered.filter((row) => row.schedulingCause === 'RECLAMO')) },
      { id: 'c3', valor: sum(filtered.filter((row) => row.schedulingCause === 'EVENTO_PUBLICO')) },
      { id: 'c4', valor: sum(affected.filter((row) => row.affectionCause === 'INCIDENTE_VIAL')) },
      { id: 'c6', valor: sum(filtered.filter((row) => row.schedulingCause === 'RESERVA')) },
    ],
    details: filtered,
    availableZones: [...new Set(details.map((row) => row.zone))].sort(),
    availableSchedulingCauses: [...new Set(details.map((row) => row.schedulingCause))].sort(),
    availableAffectionCauses: [...new Set(details.map((row) => row.affectionCause))].sort(),
    availableStates: STATES.filter((state) => details.some((row) => row.state === state)),
    filtered: Boolean((filters.zone && filters.zone !== 'all') || (cause && cause !== 'all') || search),
  };
}
