// src/data/mocks/claims.mock.ts
import type { ClaimCreatedEvent, ClaimUpdatedEvent } from '../../types';

const now = new Date();
function minsAgo(m: number) {
  return new Date(now.getTime() - m * 60000).toISOString();
}
function hoursAgo(h: number) {
  return new Date(now.getTime() - h * 3600000).toISOString();
}

export const mockClaimCreatedEvents: ClaimCreatedEvent[] = [
  {
    metadata: {
      eventId: 'evt-c-001',
      eventType: 'reclamos.creado',
      occurredAt: hoursAgo(24),
      source: 'claims-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-c-001',
      reclamoId: 'CL-101',
      categoria: 'alumbrado',
      estado: 'creado',
      zona: 'Centro',
      ciudadanoId: 'usr-anon-8812',
    },
  },
  {
    metadata: {
      eventId: 'evt-c-002',
      eventType: 'reclamos.creado',
      occurredAt: hoursAgo(18),
      source: 'claims-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-c-002',
      reclamoId: 'CL-102',
      categoria: 'residuos',
      estado: 'creado',
      zona: 'Sur',
      ciudadanoId: 'usr-anon-4412',
    },
  },
  {
    metadata: {
      eventId: 'evt-c-003',
      eventType: 'reclamos.creado',
      occurredAt: hoursAgo(12),
      source: 'claims-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-c-003',
      reclamoId: 'CL-103',
      categoria: 'calles',
      estado: 'creado',
      zona: 'Norte',
      ciudadanoId: 'usr-anon-9901',
    },
  },
  {
    metadata: {
      eventId: 'evt-c-004',
      eventType: 'reclamos.creado',
      occurredAt: hoursAgo(8),
      source: 'claims-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-c-004',
      reclamoId: 'CL-104',
      categoria: 'transito',
      estado: 'creado',
      zona: 'Centro',
      ciudadanoId: 'usr-anon-1102',
    },
  },
  {
    metadata: {
      eventId: 'evt-c-005',
      eventType: 'reclamos.creado',
      occurredAt: hoursAgo(6),
      source: 'claims-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-c-005',
      reclamoId: 'CL-105',
      categoria: 'espacios_publicos',
      estado: 'creado',
      zona: 'Oeste',
      ciudadanoId: 'usr-anon-3320',
    },
  },
  {
    metadata: {
      eventId: 'evt-c-006',
      eventType: 'reclamos.creado',
      occurredAt: hoursAgo(4),
      source: 'claims-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-c-006',
      reclamoId: 'CL-106',
      categoria: 'ruido',
      estado: 'creado',
      zona: 'Centro',
      ciudadanoId: 'usr-anon-7714',
    },
  },
  {
    metadata: {
      eventId: 'evt-c-007',
      eventType: 'reclamos.creado',
      occurredAt: minsAgo(90),
      source: 'claims-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-c-007',
      reclamoId: 'CL-107',
      categoria: 'alumbrado',
      estado: 'creado',
      zona: 'Norte',
      ciudadanoId: 'usr-anon-5511',
    },
  },
];

export const mockClaimUpdatedEvents: ClaimUpdatedEvent[] = [
  {
    metadata: {
      eventId: 'evt-u-001',
      eventType: 'reclamos.actualizado',
      occurredAt: hoursAgo(20),
      source: 'claims-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-c-001',
      reclamoId: 'CL-101',
      estadoAnterior: 'creado',
      estadoNuevo: 'en curso',
    },
  },
  {
    metadata: {
      eventId: 'evt-u-002',
      eventType: 'reclamos.actualizado',
      occurredAt: hoursAgo(10),
      source: 'claims-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-c-001',
      reclamoId: 'CL-101',
      estadoAnterior: 'en curso',
      estadoNuevo: 'cerrado',
      motivo: 'Luminaria reemplazada con éxito',
    },
  },
  {
    metadata: {
      eventId: 'evt-u-003',
      eventType: 'reclamos.actualizado',
      occurredAt: hoursAgo(14),
      source: 'claims-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-c-002',
      reclamoId: 'CL-102',
      estadoAnterior: 'creado',
      estadoNuevo: 'en curso',
    },
  },
  {
    metadata: {
      eventId: 'evt-u-004',
      eventType: 'reclamos.actualizado',
      occurredAt: hoursAgo(6),
      source: 'claims-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-c-002',
      reclamoId: 'CL-102',
      estadoAnterior: 'en curso',
      estadoNuevo: 'cerrado',
    },
  },
  {
    metadata: {
      eventId: 'evt-u-005',
      eventType: 'reclamos.actualizado',
      occurredAt: hoursAgo(5),
      source: 'claims-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-c-004',
      reclamoId: 'CL-104',
      estadoAnterior: 'creado',
      estadoNuevo: 'cancelado',
      motivo: 'Reporte duplicado',
    },
  },
  {
    metadata: {
      eventId: 'evt-u-006',
      eventType: 'reclamos.actualizado',
      occurredAt: hoursAgo(2),
      source: 'claims-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-c-005',
      reclamoId: 'CL-105',
      estadoAnterior: 'creado',
      estadoNuevo: 'en curso',
    },
  },
];
