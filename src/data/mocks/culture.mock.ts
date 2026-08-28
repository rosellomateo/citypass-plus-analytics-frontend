// src/data/mocks/culture.mock.ts
import type {
  ReservaConfirmadaEvent,
  ReservaCanceladaEvent,
  EventoPublicadoEvent,
  InscripcionConfirmadaEvent,
  InscripcionCanceladaEvent,
  EventoCanceladoEvent,
} from '../../types';

const now = new Date();
function daysAgo(d: number) {
  return new Date(now.getTime() - d * 86400000).toISOString();
}
function daysFromNow(d: number) {
  return new Date(now.getTime() + d * 86400000).toISOString();
}

export const mockReservaConfirmadaEvents: ReservaConfirmadaEvent[] = [
  {
    metadata: {
      eventId: 'evt-res-c1',
      eventType: 'espacios.reserva.confirmada',
      occurredAt: daysAgo(3),
      source: 'culture-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-res-01',
      reservaId: 'RES-101',
      espacioId: 'Parque Central',
      tipoEspacio: 'parque',
      zona: 'Centro',
      franjaHoraria: '10:00 - 12:00',
      cantidadAsistentesEstim: 45,
      ciudadanoId: 'usr-anon-1001',
    },
  },
  {
    metadata: {
      eventId: 'evt-res-c2',
      eventType: 'espacios.reserva.confirmada',
      occurredAt: daysAgo(2),
      source: 'culture-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-res-02',
      reservaId: 'RES-102',
      espacioId: 'Centro Cultural Sur',
      tipoEspacio: 'centro_cultural',
      zona: 'Sur',
      franjaHoraria: '14:00 - 18:00',
      cantidadAsistentesEstim: 120,
      ciudadanoId: 'usr-anon-1002',
    },
  },
  {
    metadata: {
      eventId: 'evt-res-c3',
      eventType: 'espacios.reserva.confirmada',
      occurredAt: daysAgo(1),
      source: 'culture-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-res-03',
      reservaId: 'RES-103',
      espacioId: 'Plaza San Martín',
      tipoEspacio: 'plaza',
      zona: 'Centro',
      franjaHoraria: '16:00 - 20:00',
      cantidadAsistentesEstim: 300,
      ciudadanoId: 'usr-anon-1003',
    },
  },
  {
    metadata: {
      eventId: 'evt-res-c4',
      eventType: 'espacios.reserva.confirmada',
      occurredAt: daysAgo(1),
      source: 'culture-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-res-04',
      reservaId: 'RES-104',
      espacioId: 'Cancha Municipal Norte',
      tipoEspacio: 'cancha_deportiva',
      zona: 'Norte',
      franjaHoraria: '18:00 - 21:00',
      cantidadAsistentesEstim: 80,
      ciudadanoId: 'usr-anon-1004',
    },
  },
];

export const mockReservaCanceladaEvents: ReservaCanceladaEvent[] = [
  {
    metadata: {
      eventId: 'evt-res-x1',
      eventType: 'espacios.reserva.cancelada',
      occurredAt: daysAgo(1),
      source: 'culture-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-res-02',
      reservaId: 'RES-102',
      espacioId: 'Centro Cultural Sur',
      franjaHoraria: '14:00 - 18:00',
    },
  },
];

export const mockEventoPublicadoEvents: EventoPublicadoEvent[] = [
  {
    metadata: {
      eventId: 'evt-ev-p1',
      eventType: 'espacios.evento.publicado',
      occurredAt: daysAgo(5),
      source: 'culture-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-ev-01',
      eventoId: 'EVT-701',
      titulo: 'Festival de Música Urbana',
      categoria: 'cultural',
      espacioId: 'Parque Central',
      zona: 'Centro',
      fechaHoraEvento: daysFromNow(2),
      cupoMaximo: 200,
      requiereInscripcion: true,
      organizadorId: 'org-01',
    },
  },
  {
    metadata: {
      eventId: 'evt-ev-p2',
      eventType: 'espacios.evento.publicado',
      occurredAt: daysAgo(4),
      source: 'culture-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-ev-02',
      eventoId: 'EVT-702',
      titulo: 'Torneo Barrio Activo',
      categoria: 'deportivo',
      espacioId: 'Cancha Municipal Norte',
      zona: 'Norte',
      fechaHoraEvento: daysFromNow(4),
      cupoMaximo: 100,
      requiereInscripcion: true,
      organizadorId: 'org-02',
    },
  },
  {
    metadata: {
      eventId: 'evt-ev-p3',
      eventType: 'espacios.evento.publicado',
      occurredAt: daysAgo(3),
      source: 'culture-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-ev-03',
      eventoId: 'EVT-703',
      titulo: 'Jornada de Reciclaje Recreativo',
      categoria: 'recreativo',
      espacioId: 'Plaza San Martín',
      zona: 'Centro',
      fechaHoraEvento: daysFromNow(5),
      cupoMaximo: 50,
      requiereInscripcion: true,
      organizadorId: 'org-03',
    },
  },
];

export const mockInscripcionConfirmadaEvents: InscripcionConfirmadaEvent[] = [
  // Evento 701: 170 inscriptos
  ...Array.from({ length: 170 }, (_, i) => ({
    metadata: {
      eventId: `evt-ins-c-${i + 1}`,
      eventType: 'espacios.inscripcion.confirmada',
      occurredAt: daysAgo(2),
      source: 'culture-service',
      version: '1',
    },
    data: {
      correlationId: `corr-ins-${i + 1}`,
      inscripcionId: `INS-${i + 1}`,
      eventoId: 'EVT-701',
      ciudadanoId: `usr-anon-${2000 + i}`,
    },
  })),
  // Evento 702: 85 inscriptos
  ...Array.from({ length: 85 }, (_, i) => ({
    metadata: {
      eventId: `evt-ins-c2-${i + 1}`,
      eventType: 'espacios.inscripcion.confirmada',
      occurredAt: daysAgo(1),
      source: 'culture-service',
      version: '1',
    },
    data: {
      correlationId: `corr-ins2-${i + 1}`,
      inscripcionId: `INS2-${i + 1}`,
      eventoId: 'EVT-702',
      ciudadanoId: `usr-anon-${3000 + i}`,
    },
  })),
  // Evento 703: 30 inscriptos
  ...Array.from({ length: 30 }, (_, i) => ({
    metadata: {
      eventId: `evt-ins-c3-${i + 1}`,
      eventType: 'espacios.inscripcion.confirmada',
      occurredAt: daysAgo(1),
      source: 'culture-service',
      version: '1',
    },
    data: {
      correlationId: `corr-ins3-${i + 1}`,
      inscripcionId: `INS3-${i + 1}`,
      eventoId: 'EVT-703',
      ciudadanoId: `usr-anon-${4000 + i}`,
    },
  })),
];

export const mockInscripcionCanceladaEvents: InscripcionCanceladaEvent[] = [
  {
    metadata: {
      eventId: 'evt-ins-x1',
      eventType: 'espacios.inscripcion.cancelada',
      occurredAt: daysAgo(1),
      source: 'culture-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-ins-1',
      inscripcionId: 'INS-1',
      eventoId: 'EVT-701',
    },
  },
];

export const mockEventoCanceladoEvents: EventoCanceladoEvent[] = [];
