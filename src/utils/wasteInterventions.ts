import type { WasteInterventionEvent } from '../api/types';

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
