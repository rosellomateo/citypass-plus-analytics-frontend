// src/data/mocks/emergencies.mock.ts
import type {
  EmergenciaCreadaEvent,
  EmergenciaPriorizadaEvent,
  EmergenciaEstadoActualizadoEvent,
  EmergenciaDespachadaEvent,
  EmergenciaCerradaEvent,
} from '../../types';

const now = new Date();
function minsAgo(m: number) {
  return new Date(now.getTime() - m * 60000).toISOString();
}
function hoursAgo(h: number, m = 0) {
  return new Date(now.getTime() - (h * 3600000 + m * 60000)).toISOString();
}

export const mockEmergenciaCreadaEvents: EmergenciaCreadaEvent[] = [
  {
    metadata: {
      eventId: 'evt-em-c1',
      eventType: 'EmergenciaCreada',
      occurredAt: minsAgo(45),
      source: 'emergency-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-em-01',
      emergenciaId: 'EMG-901',
      tipo: 'Accidente de tránsito',
      origen: 'Llamada 911',
      ubicacion: 'Av. Corrientes 1200',
      estado: 'PENDIENTE',
    },
  },
  {
    metadata: {
      eventId: 'evt-em-c2',
      eventType: 'EmergenciaCreada',
      occurredAt: minsAgo(30),
      source: 'emergency-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-em-02',
      emergenciaId: 'EMG-902',
      tipo: 'Incendio estructura',
      origen: 'Sensor humo urbano',
      ubicacion: 'Palermo Soho',
      estado: 'PENDIENTE',
    },
  },
  {
    metadata: {
      eventId: 'evt-em-c3',
      eventType: 'EmergenciaCreada',
      occurredAt: minsAgo(15),
      source: 'emergency-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-em-03',
      emergenciaId: 'EMG-903',
      tipo: 'Auxilio médico',
      origen: 'Botón de pánico',
      ubicacion: 'Estación Retiro',
      estado: 'PENDIENTE',
    },
  },
  {
    metadata: {
      eventId: 'evt-em-c4',
      eventType: 'EmergenciaCreada',
      occurredAt: hoursAgo(3),
      source: 'emergency-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-em-04',
      emergenciaId: 'EMG-904',
      tipo: 'Disturbio en vía pública',
      origen: 'Cámara analítica',
      ubicacion: 'Constitución',
      estado: 'PENDIENTE',
    },
  },
  {
    metadata: {
      eventId: 'evt-em-c5',
      eventType: 'EmergenciaCreada',
      occurredAt: hoursAgo(5),
      source: 'emergency-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-em-05',
      emergenciaId: 'EMG-905',
      tipo: 'Fuga de gas',
      origen: 'Llamada vecino',
      ubicacion: 'Belgrano',
      estado: 'PENDIENTE',
    },
  },
];

export const mockEmergenciaPriorizadaEvents: EmergenciaPriorizadaEvent[] = [
  {
    metadata: {
      eventId: 'evt-em-p1',
      eventType: 'EmergenciaPriorizada',
      occurredAt: minsAgo(43),
      source: 'emergency-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-em-01',
      emergenciaId: 'EMG-901',
      prioridad: 'ALTA',
      score: 92,
    },
  },
  {
    metadata: {
      eventId: 'evt-em-p2',
      eventType: 'EmergenciaPriorizada',
      occurredAt: minsAgo(28),
      source: 'emergency-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-em-02',
      emergenciaId: 'EMG-902',
      prioridad: 'ALTA',
      score: 98,
    },
  },
  {
    metadata: {
      eventId: 'evt-em-p3',
      eventType: 'EmergenciaPriorizada',
      occurredAt: minsAgo(14),
      source: 'emergency-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-em-03',
      emergenciaId: 'EMG-903',
      prioridad: 'MEDIA',
      score: 65,
    },
  },
  {
    metadata: {
      eventId: 'evt-em-p4',
      eventType: 'EmergenciaPriorizada',
      occurredAt: hoursAgo(2, 55),
      source: 'emergency-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-em-04',
      emergenciaId: 'EMG-904',
      prioridad: 'BAJA',
      score: 30,
    },
  },
  {
    metadata: {
      eventId: 'evt-em-p5',
      eventType: 'EmergenciaPriorizada',
      occurredAt: hoursAgo(4, 55),
      source: 'emergency-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-em-05',
      emergenciaId: 'EMG-905',
      prioridad: 'ALTA',
      score: 88,
    },
  },
];

export const mockEmergenciaEstadoActualizadoEvents: EmergenciaEstadoActualizadoEvent[] = [
  {
    metadata: {
      eventId: 'evt-em-st1',
      eventType: 'EmergenciaEstadoActualizado',
      occurredAt: minsAgo(40),
      source: 'emergency-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-em-01',
      emergenciaId: 'EMG-901',
      estadoAnterior: 'PENDIENTE',
      estadoNuevo: 'VALIDADA',
    },
  },
  {
    metadata: {
      eventId: 'evt-em-st2',
      eventType: 'EmergenciaEstadoActualizado',
      occurredAt: minsAgo(35),
      source: 'emergency-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-em-01',
      emergenciaId: 'EMG-901',
      estadoAnterior: 'VALIDADA',
      estadoNuevo: 'DESPACHADA',
    },
  },
  {
    metadata: {
      eventId: 'evt-em-st3',
      eventType: 'EmergenciaEstadoActualizado',
      occurredAt: minsAgo(22),
      source: 'emergency-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-em-02',
      emergenciaId: 'EMG-902',
      estadoAnterior: 'PENDIENTE',
      estadoNuevo: 'DESPACHADA',
    },
  },
  {
    metadata: {
      eventId: 'evt-em-st4',
      eventType: 'EmergenciaEstadoActualizado',
      occurredAt: hoursAgo(2, 45),
      source: 'emergency-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-em-04',
      emergenciaId: 'EMG-904',
      estadoAnterior: 'PENDIENTE',
      estadoNuevo: 'DESPACHADA',
    },
  },
  {
    metadata: {
      eventId: 'evt-em-st5',
      eventType: 'EmergenciaEstadoActualizado',
      occurredAt: hoursAgo(2),
      source: 'emergency-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-em-04',
      emergenciaId: 'EMG-904',
      estadoAnterior: 'DESPACHADA',
      estadoNuevo: 'CERRADA',
    },
  },
];

export const mockEmergenciaDespachadaEvents: EmergenciaDespachadaEvent[] = [
  {
    metadata: {
      eventId: 'evt-em-d1',
      eventType: 'EmergenciaDespachada',
      occurredAt: minsAgo(35), // 10 mins despues de creada
      source: 'emergency-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-em-01',
      emergenciaId: 'EMG-901',
      recursoId: 'AMB-402',
    },
  },
  {
    metadata: {
      eventId: 'evt-em-d2',
      eventType: 'EmergenciaDespachada',
      occurredAt: minsAgo(22), // 8 mins despues de creada
      source: 'emergency-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-em-02',
      emergenciaId: 'EMG-902',
      recursoId: 'BOMB-108',
    },
  },
  {
    metadata: {
      eventId: 'evt-em-d3',
      eventType: 'EmergenciaDespachada',
      occurredAt: hoursAgo(2, 45), // 15 mins despues de creada
      source: 'emergency-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-em-04',
      emergenciaId: 'EMG-904',
      recursoId: 'PAT-201',
    },
  },
  {
    metadata: {
      eventId: 'evt-em-d4',
      eventType: 'EmergenciaDespachada',
      occurredAt: hoursAgo(4, 50), // 10 mins despues de creada
      source: 'emergency-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-em-05',
      emergenciaId: 'EMG-905',
      recursoId: 'DEF-012',
    },
  },
];

export const mockEmergenciaCerradaEvents: EmergenciaCerradaEvent[] = [
  {
    metadata: {
      eventId: 'evt-em-z1',
      eventType: 'EmergenciaCerrada',
      occurredAt: hoursAgo(2),
      source: 'emergency-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-em-04',
      emergenciaId: 'EMG-904',
      resultado: 'RESUELTA',
    },
  },
  {
    metadata: {
      eventId: 'evt-em-z2',
      eventType: 'EmergenciaCerrada',
      occurredAt: hoursAgo(4),
      source: 'emergency-service',
      version: '1',
    },
    data: {
      correlationId: 'corr-em-05',
      emergenciaId: 'EMG-905',
      resultado: 'RESUELTA',
    },
  },
];
