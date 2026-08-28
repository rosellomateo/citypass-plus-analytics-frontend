// src/data/mocks/mobility.mock.ts
import type { ViajeIniciadoEvent, ViajeFinalizadoEvent } from '../../types';

const now = new Date();
function minsAgo(m: number) {
  return new Date(now.getTime() - m * 60000).toISOString();
}
function hoursAgo(h: number) {
  return new Date(now.getTime() - h * 3600000).toISOString();
}

export const mockViajeIniciadoEvents: ViajeIniciadoEvent[] = [
  {
    metadata: {
      eventId: 'evt-m-i1',
      eventType: 'movilidad.viaje.iniciado',
      occurredAt: hoursAgo(8), // 08:00
      source: 'mobility-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-m-01',
      viajeId: 'VJ-301',
      bicicletaId: 'BK-102',
      estacionOrigenId: 'Estación Universidad',
      usuarioId: 'usr-anon-9988',
    },
  },
  {
    metadata: {
      eventId: 'evt-m-i2',
      eventType: 'movilidad.viaje.iniciado',
      occurredAt: hoursAgo(8), // 08:00
      source: 'mobility-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-m-02',
      viajeId: 'VJ-302',
      bicicletaId: 'BK-145',
      estacionOrigenId: 'Estación Palermo',
      usuarioId: 'usr-anon-3344',
    },
  },
  {
    metadata: {
      eventId: 'evt-m-i3',
      eventType: 'movilidad.viaje.iniciado',
      occurredAt: hoursAgo(12), // 12:00
      source: 'mobility-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-m-03',
      viajeId: 'VJ-303',
      bicicletaId: 'BK-201',
      estacionOrigenId: 'Estación Universidad',
      usuarioId: 'usr-anon-5566',
    },
  },
  {
    metadata: {
      eventId: 'evt-m-i4',
      eventType: 'movilidad.viaje.iniciado',
      occurredAt: hoursAgo(17), // 17:00
      source: 'mobility-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-m-04',
      viajeId: 'VJ-304',
      bicicletaId: 'BK-089',
      estacionOrigenId: 'Estación Retiro',
      usuarioId: 'usr-anon-1122',
    },
  },
  {
    metadata: {
      eventId: 'evt-m-i5',
      eventType: 'movilidad.viaje.iniciado',
      occurredAt: hoursAgo(18), // 18:00
      source: 'mobility-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-m-05',
      viajeId: 'VJ-305',
      bicicletaId: 'BK-304',
      estacionOrigenId: 'Estación San Telmo',
      usuarioId: 'usr-anon-7788',
    },
  },
  {
    metadata: {
      eventId: 'evt-m-i6',
      eventType: 'movilidad.viaje.iniciado',
      occurredAt: minsAgo(40),
      source: 'mobility-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-m-06',
      viajeId: 'VJ-306',
      bicicletaId: 'BK-412',
      estacionOrigenId: 'Estación Palermo',
      usuarioId: 'usr-anon-9900',
    },
  },
];

export const mockViajeFinalizadoEvents: ViajeFinalizadoEvent[] = [
  {
    metadata: {
      eventId: 'evt-m-f1',
      eventType: 'movilidad.viaje.finalizado',
      occurredAt: hoursAgo(7, 45), // duracion ~15m (900s)
      source: 'mobility-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-m-01',
      viajeId: 'VJ-301',
      bicicletaId: 'BK-102',
      estacionDestinoId: 'Estación Microcentro',
      duracionSegundos: 900,
    },
  },
  {
    metadata: {
      eventId: 'evt-m-f2',
      eventType: 'movilidad.viaje.finalizado',
      occurredAt: hoursAgo(7, 36), // duracion ~24m (1440s)
      source: 'mobility-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-m-02',
      viajeId: 'VJ-302',
      bicicletaId: 'BK-145',
      estacionDestinoId: 'Estación Retiro',
      duracionSegundos: 1440,
    },
  },
  {
    metadata: {
      eventId: 'evt-m-f3',
      eventType: 'movilidad.viaje.finalizado',
      occurredAt: hoursAgo(11, 48), // duracion ~12m (720s)
      source: 'mobility-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-m-03',
      viajeId: 'VJ-303',
      bicicletaId: 'BK-201',
      estacionDestinoId: 'Estación San Telmo',
      duracionSegundos: 720,
    },
  },
  {
    metadata: {
      eventId: 'evt-m-f4',
      eventType: 'movilidad.viaje.finalizado',
      occurredAt: hoursAgo(16, 42), // duracion ~18m (1080s)
      source: 'mobility-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-m-04',
      viajeId: 'VJ-304',
      bicicletaId: 'BK-089',
      estacionDestinoId: 'Estación Palermo',
      duracionSegundos: 1080,
    },
  },
  {
    metadata: {
      eventId: 'evt-m-f5',
      eventType: 'movilidad.viaje.finalizado',
      occurredAt: hoursAgo(17, 30), // duracion ~30m (1800s)
      source: 'mobility-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-m-05',
      viajeId: 'VJ-305',
      bicicletaId: 'BK-304',
      estacionDestinoId: 'Estación Constitución',
      duracionSegundos: 1800,
    },
  },
];
