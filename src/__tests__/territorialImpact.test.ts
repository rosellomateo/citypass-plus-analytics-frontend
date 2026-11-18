import { describe, expect, it } from 'vitest';
import type { CrossModuleResponse } from '../api/types';
import type { TerritorialContext, TerritorialEvent, TerritorialResource } from '../types/territorial';
import { resolveTerritorialImpact, validPosition } from '../utils/territorialImpact';

const now = Date.parse('2026-11-18T15:00:00Z');
const event: TerritorialEvent = { evento_id: 'festival', nombre: 'Festival', zona: 'Centro',
  tipo: 'EVENTO_PUBLICO', coordenadas: [0, 0], inicio: '2026-11-18T14:00:00Z', fin: '2026-11-18T18:00:00Z', radio_metros: 500 };
const emergency: TerritorialResource = { recurso_id: 'e1', tipo: 'emergencia', coordenadas: [0.001, 0],
  creado_en: '2026-11-18T15:00:00Z', criticidad: 'MEDIA', estado: 'PENDIENTE' };
const route: TerritorialResource = { recurso_id: 'r1', nombre: 'Circuito', tipo: 'recorrido_residuos',
  trazado: [[-0.01, 0], [0.01, 0]], desde: '2026-11-18T15:00:00Z', hasta: '2026-11-18T16:00:00Z' };
function report(recursos: TerritorialResource[], eventos = [event], cobertura: TerritorialContext['cobertura'] = ['emergencia','recorrido_residuos','estacion']) : CrossModuleResponse {
  return { fecha_snapshot: '2026-11-18', datos: [], contexto_territorial: { eventos, recursos, cobertura } };
}

describe('public-event proximity', () => {
  it('uses actual positions rather than assigning the whole zone to the radius', () => {
    const input = report([emergency, { ...emergency, recurso_id: 'far', zona: 'Centro', coordenadas: [0.01, 0] }]);
    const original = structuredClone(input);
    const result = resolveTerritorialImpact(input, now);
    expect(result.eventos_zona?.[0].emergencias_cercanas).toBe(1);
    expect(result.emergencias_zona?.map(x=>x.emergencia_id)).toEqual(['e1']);
    expect(input).toEqual(original);
  });

  it('includes exactly 500 metres but excludes a slightly farther point before rounding', () => {
    const longitude = (meters: number) => meters / 6371008.8 * 180 / Math.PI;
    const result = resolveTerritorialImpact(report([
      { ...emergency, recurso_id: 'edge', coordenadas: [longitude(500), 0] },
      { ...emergency, recurso_id: 'beyond', coordenadas: [longitude(500.02), 0] },
    ]), now);
    expect(result.emergencias_zona?.map(x=>x.emergencia_id)).toEqual(['edge']);
  });

  it('finds a crossing route even when both endpoints are more than 500 metres away', () => {
    const result = resolveTerritorialImpact(report([route]), now);
    expect(result.afectaciones?.recorridos_eventos).toHaveLength(1);
    expect(result.afectaciones?.recorridos_eventos?.[0].distancia_metros).toBeLessThan(0.1);
    expect(result.eventos_zona?.[0].recorridos_cercanos).toBe(1);
  });

  it('requires matching times; the event end is excluded', () => {
    const result = resolveTerritorialImpact(report([
      { ...emergency, creado_en: event.fin },
      { ...route, desde: '2026-11-18T12:00:00Z', hasta: event.inicio },
    ]), now);
    expect(result.emergencias_zona).toEqual([]);
    expect(result.afectaciones?.recorridos_eventos).toEqual([]);
    expect(result.eventos_zona?.[0].emergencias_cercanas).toBe(0);
  });

  it('does not invent coordinates, a route geometry, missing times or missing coverage', () => {
    const result = resolveTerritorialImpact(report([
      { ...emergency, coordenadas: undefined }, { ...route, trazado: undefined },
    ]), now);
    expect(result.eventos_zona?.[0].emergencias_cercanas).toBeNull();
    expect(result.eventos_zona?.[0].recorridos_cercanos).toBeNull();
    expect(resolveTerritorialImpact(report([], [event], []), now).eventos_zona?.[0].estaciones_cercanas).toBeNull();
    expect(resolveTerritorialImpact(report([{ ...emergency, creado_en: undefined }]), now).emergencias_zona).toEqual([]);
    expect(validPosition([0, 91])).toBe(false);
    expect(validPosition(['0', 0])).toBe(false);
    expect(validPosition([0, 0])).toBe(true);
  });

  it('ignores cancelled/suspended public events and never uses a road incident as a public event', () => {
    for (const estado of ['CANCELADA', 'SUSPENDIDA']) {
      expect(resolveTerritorialImpact(report([emergency], [{ ...event, estado }]), now).emergencias_zona).toEqual([]);
    }
    expect(resolveTerritorialImpact(report([emergency], [{ ...event, tipo: 'INCIDENTE_VIAL' }]), now).eventos_zona).toEqual([]);
  });

  it('deduplicates IDs and preserves separate relations for two overlapping public events', () => {
    const result = resolveTerritorialImpact(report([emergency, emergency, route, route], [event, event, { ...event, evento_id: 'other' }]), now);
    expect(result.eventos_zona).toHaveLength(2);
    expect(result.eventos_zona?.map(x=>x.emergencias_cercanas)).toEqual([1, 1]);
    expect(result.afectaciones?.recorridos_eventos).toHaveLength(2);
    expect(new Set(result.afectaciones?.recorridos_eventos?.map(x=>x.recorrido_id)).size).toBe(1);
  });

  it('detects a nearby emergency without raising its priority or claiming a confirmed increase', () => {
    const result = resolveTerritorialImpact(report([emergency]), now);
    expect(result.emergencias_zona?.[0]).toMatchObject({ criticidad: 'MEDIA', criterio: 'proximidad' });
    expect(result.emergencias_zona?.[0].criticidad_elevada).toBeUndefined();
    const changed = resolveTerritorialImpact(report([{ ...emergency, criticidad_original: 'BAJA', criticidad: 'ALTA' }]), now);
    expect(changed.emergencias_zona?.[0].criticidad_elevada).toBe(true);
  });

  it('preserves published relations over calculated data, including an explicit false', () => {
    const input = report([emergency]);
    input.emergencias_zona = [{ emergencia_id: 'e1', evento_id: 'festival', vinculada_en: emergency.creado_en!, criticidad: 'BAJA', criticidad_elevada: false }];
    const result = resolveTerritorialImpact(input, now);
    expect(result.emergencias_zona).toHaveLength(1);
    expect(result.emergencias_zona?.[0]).toMatchObject({ criticidad: 'BAJA', criticidad_elevada: false });
  });

  it('uses the current time for stations with no published availability interval', () => {
    const input = report([{ recurso_id: 'station', tipo: 'estacion', coordenadas: [0.001, 0] }]);
    expect(resolveTerritorialImpact(input, now).eventos_zona?.[0].estaciones_cercanas).toBe(1);
    expect(resolveTerritorialImpact(input, Date.parse(event.fin)).eventos_zona?.[0].estaciones_cercanas).toBe(0);
  });
});
