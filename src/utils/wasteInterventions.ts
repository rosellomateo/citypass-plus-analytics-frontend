import type { WasteInterventionEvent } from '../api/types';

/** Programming and affection causes are separate; null in the new field is authoritative. */
export function countRoadAffectedInterventions(events: readonly WasteInterventionEvent[]): number {
  return new Set(events.filter(({ metadata, data }) => {
    const cause = data.causaTipoAfectacion !== undefined ? data.causaTipoAfectacion : data.causaTipo;
    return metadata.eventType === 'com.citypass.residuos.IntervencionActualizada' &&
      data.estadoNuevo === 'AFECTADA' && cause === 'INCIDENTE_VIAL';
  }).map(({ data }) => data.intervencionId).filter(Boolean)).size;
}

/** Replayed gateway envelopes may have different eventIds for the same stop. */
export function affectedInterventions(events: readonly WasteInterventionEvent[]) {
  const latest = new Map<string, WasteInterventionEvent['data']>();
  for (const event of events) {
    if (event.metadata.eventType !== 'com.citypass.residuos.IntervencionActualizada') continue;
    const row = event.data;
    if (!row.intervencionId || row.estadoNuevo !== 'AFECTADA') continue;
    const previous = latest.get(row.intervencionId);
    if (!previous || Date.parse(row.updatedAt) > Date.parse(previous.updatedAt)) latest.set(row.intervencionId, row);
  }
  return [...latest.values()];
}
