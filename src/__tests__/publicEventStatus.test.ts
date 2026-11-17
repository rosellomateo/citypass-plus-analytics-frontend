import { expect, it } from 'vitest';
import { getPublicEventStatus } from '../utils/zoneDates';

it('actualiza un evento según su horario y respeta los estados publicados de cierre', () => {
  const event = {
    evento_id: 'evento-1',
    estado: 'EN_CURSO',
    inicio: '2026-11-13T13:00:00Z',
    fin: '2026-11-13T15:00:00Z',
  };
  expect(getPublicEventStatus(event, Date.parse('2026-11-13T12:59:00Z'))).toBe('Programado');
  expect(getPublicEventStatus(event, Date.parse('2026-11-13T14:00:00Z'))).toBe('En curso');
  expect(getPublicEventStatus(event, Date.parse('2026-11-13T15:00:00Z'))).toBe('Finalizado');
  expect(getPublicEventStatus({ ...event, estado: 'CANCELADO' }, Date.parse('2026-11-13T14:00:00Z'))).toBe('Cancelado');
  expect(getPublicEventStatus({ ...event, estado: 'SUSPENDIDA' }, Date.parse('2026-11-13T14:00:00Z'))).toBe('Suspendido');
});
