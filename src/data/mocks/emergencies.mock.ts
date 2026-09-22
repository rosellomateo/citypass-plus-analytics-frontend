import type {
  EmergenciaCreadaEvent,
  EmergenciaPriorizadaEvent,
  EmergenciaEstadoActualizadoEvent,
  EmergenciaDespachadaEvent,
  EmergenciaCerradaEvent,
  AIAnalysisReport,
} from '../../types';
import rawEmergenciesSummary from '../../../testingDatos/emergencies_summary.json';

const now = new Date();
function minsAgo(m: number) {
  return new Date(now.getTime() - m * 60000).toISOString();
}
function hoursAgo(h: number, m = 0) {
  return new Date(now.getTime() - (h * 3600000 + m * 60000)).toISOString();
}

export const mockEmergenciaCreadaEvents: EmergenciaCreadaEvent[] = [
  {
    metadata: { eventId: 'evt-em-c1', eventType: 'EmergenciaCreada', occurredAt: minsAgo(45), source: 'emergency-service', version: '1' },
    data: { correlationId: 'corr-em-01', emergenciaId: 'EMG-901', tipo: 'Accidente de tránsito', categoria: 'Accidente de tránsito', origen: 'Llamada 911', ubicacion: 'Av. Corrientes 1200', estado: 'RECIBIDO' },
  },
  {
    metadata: { eventId: 'evt-em-c2', eventType: 'EmergenciaCreada', occurredAt: minsAgo(30), source: 'emergency-service', version: '1' },
    data: { correlationId: 'corr-em-02', emergenciaId: 'EMG-902', tipo: 'Incendio estructura', categoria: 'Incendio estructura', origen: 'Sensor humo urbano', ubicacion: 'Palermo Soho', estado: 'EN_REVISION' },
  },
  {
    metadata: { eventId: 'evt-em-c3', eventType: 'EmergenciaCreada', occurredAt: minsAgo(15), source: 'emergency-service', version: '1' },
    data: { correlationId: 'corr-em-03', emergenciaId: 'EMG-903', tipo: 'Auxilio médico', categoria: 'Auxilio médico', origen: 'Botón de pánico', ubicacion: 'Estación Retiro', estado: 'ASIGNADO' },
  },
  {
    metadata: { eventId: 'evt-em-c4', eventType: 'EmergenciaCreada', occurredAt: hoursAgo(3), source: 'emergency-service', version: '1' },
    data: { correlationId: 'corr-em-04', emergenciaId: 'EMG-904', tipo: 'Disturbio en vía pública', categoria: 'Disturbio en vía pública', origen: 'Cámara analítica', ubicacion: 'Constitución', estado: 'EN_PROCESO' },
  },
  {
    metadata: { eventId: 'evt-em-c5', eventType: 'EmergenciaCreada', occurredAt: hoursAgo(5), source: 'emergency-service', version: '1' },
    data: { correlationId: 'corr-em-05', emergenciaId: 'EMG-905', tipo: 'Fuga de gas', categoria: 'Fuga de gas', origen: 'Llamada vecino', ubicacion: 'Belgrano', estado: 'CERRADA' },
  },
  {
    metadata: { eventId: 'evt-em-c6', eventType: 'EmergenciaCreada', occurredAt: hoursAgo(6), source: 'emergency-service', version: '1' },
    data: { correlationId: 'corr-em-06', emergenciaId: 'EMG-906', tipo: 'Accidente de tránsito', categoria: 'Accidente de tránsito', origen: 'Llamada 911', ubicacion: 'Av. 9 de Julio 500', estado: 'EN_PROCESO' },
  },
  {
    metadata: { eventId: 'evt-em-c7', eventType: 'EmergenciaCreada', occurredAt: hoursAgo(8), source: 'emergency-service', version: '1' },
    data: { correlationId: 'corr-em-07', emergenciaId: 'EMG-907', tipo: 'Incendio estructura', categoria: 'Incendio estructura', origen: 'Alerta vecinal', ubicacion: 'San Telmo', estado: 'RECHAZADO' },
  },
  {
    metadata: { eventId: 'evt-em-c8', eventType: 'EmergenciaCreada', occurredAt: hoursAgo(10), source: 'emergency-service', version: '1' },
    data: { correlationId: 'corr-em-08', emergenciaId: 'EMG-908', tipo: 'Auxilio médico', categoria: 'Auxilio médico', origen: 'Llamada 911', ubicacion: 'Caballito', estado: 'RECIBIDO' },
  },
  {
    metadata: { eventId: 'evt-em-c9', eventType: 'EmergenciaCreada', occurredAt: hoursAgo(12), source: 'emergency-service', version: '1' },
    data: { correlationId: 'corr-em-09', emergenciaId: 'EMG-909', tipo: 'Fuga de gas', categoria: 'Fuga de gas', origen: 'Sensor ambiental', ubicacion: 'Recoleta', estado: 'EN_REVISION' },
  },
  {
    metadata: { eventId: 'evt-em-c10', eventType: 'EmergenciaCreada', occurredAt: hoursAgo(14), source: 'emergency-service', version: '1' },
    data: { correlationId: 'corr-em-10', emergenciaId: 'EMG-910', tipo: 'Alumbrado público', categoria: 'Alumbrado público', origen: 'Reclamo ciudadano', ubicacion: 'Villa Urquiza', estado: 'ASIGNADO' },
  },
  {
    metadata: { eventId: 'evt-em-c11', eventType: 'EmergenciaCreada', occurredAt: hoursAgo(18), source: 'emergency-service', version: '1' },
    data: { correlationId: 'corr-em-11', emergenciaId: 'EMG-911', tipo: 'Derrumbe', categoria: 'Derrumbe', origen: 'Llamada 911', ubicacion: 'La Boca', estado: 'EN_PROCESO' },
  },
  {
    metadata: { eventId: 'evt-em-c12', eventType: 'EmergenciaCreada', occurredAt: hoursAgo(20), source: 'emergency-service', version: '1' },
    data: { correlationId: 'corr-em-12', emergenciaId: 'EMG-912', tipo: 'Inundación', categoria: 'Inundación', origen: 'Pluviómetro urbano', ubicacion: 'Flores', estado: 'CERRADA' },
  },
];

export const mockEmergenciaPriorizadaEvents: EmergenciaPriorizadaEvent[] = [
  { metadata: { eventId: 'evt-em-p1', eventType: 'EmergenciaPriorizada', occurredAt: minsAgo(43), source: 'emergency-service', version: '1' }, data: { correlationId: 'corr-em-01', emergenciaId: 'EMG-901', prioridad: 'ALTA', score: 92 } },
  { metadata: { eventId: 'evt-em-p2', eventType: 'EmergenciaPriorizada', occurredAt: minsAgo(28), source: 'emergency-service', version: '1' }, data: { correlationId: 'corr-em-02', emergenciaId: 'EMG-902', prioridad: 'CRITICA', score: 99 } },
  { metadata: { eventId: 'evt-em-p3', eventType: 'EmergenciaPriorizada', occurredAt: minsAgo(14), source: 'emergency-service', version: '1' }, data: { correlationId: 'corr-em-03', emergenciaId: 'EMG-903', prioridad: 'MEDIA', score: 65 } },
  { metadata: { eventId: 'evt-em-p4', eventType: 'EmergenciaPriorizada', occurredAt: hoursAgo(2, 55), source: 'emergency-service', version: '1' }, data: { correlationId: 'corr-em-04', emergenciaId: 'EMG-904', prioridad: 'BAJA', score: 30 } },
  { metadata: { eventId: 'evt-em-p5', eventType: 'EmergenciaPriorizada', occurredAt: hoursAgo(4, 55), source: 'emergency-service', version: '1' }, data: { correlationId: 'corr-em-05', emergenciaId: 'EMG-905', prioridad: 'ALTA', score: 88 } },
  { metadata: { eventId: 'evt-em-p6', eventType: 'EmergenciaPriorizada', occurredAt: hoursAgo(5, 55), source: 'emergency-service', version: '1' }, data: { correlationId: 'corr-em-06', emergenciaId: 'EMG-906', prioridad: 'CRITICA', score: 97 } },
  { metadata: { eventId: 'evt-em-p7', eventType: 'EmergenciaPriorizada', occurredAt: hoursAgo(7, 55), source: 'emergency-service', version: '1' }, data: { correlationId: 'corr-em-07', emergenciaId: 'EMG-907', prioridad: 'BAJA', score: 20 } },
  { metadata: { eventId: 'evt-em-p8', eventType: 'EmergenciaPriorizada', occurredAt: hoursAgo(9, 55), source: 'emergency-service', version: '1' }, data: { correlationId: 'corr-em-08', emergenciaId: 'EMG-908', prioridad: 'MEDIA', score: 58 } },
  { metadata: { eventId: 'evt-em-p9', eventType: 'EmergenciaPriorizada', occurredAt: hoursAgo(11, 55), source: 'emergency-service', version: '1' }, data: { correlationId: 'corr-em-09', emergenciaId: 'EMG-909', prioridad: 'CRITICA', score: 95 } },
  { metadata: { eventId: 'evt-em-p10', eventType: 'EmergenciaPriorizada', occurredAt: hoursAgo(13, 55), source: 'emergency-service', version: '1' }, data: { correlationId: 'corr-em-10', emergenciaId: 'EMG-910', prioridad: 'BAJA', score: 15 } },
  { metadata: { eventId: 'evt-em-p11', eventType: 'EmergenciaPriorizada', occurredAt: hoursAgo(17, 55), source: 'emergency-service', version: '1' }, data: { correlationId: 'corr-em-11', emergenciaId: 'EMG-911', prioridad: 'CRITICA', score: 100 } },
  { metadata: { eventId: 'evt-em-p12', eventType: 'EmergenciaPriorizada', occurredAt: hoursAgo(19, 55), source: 'emergency-service', version: '1' }, data: { correlationId: 'corr-em-12', emergenciaId: 'EMG-912', prioridad: 'ALTA', score: 84 } },
];

export const mockEmergenciaEstadoActualizadoEvents: EmergenciaEstadoActualizadoEvent[] = [
  { metadata: { eventId: 'evt-em-st1', eventType: 'EmergenciaEstadoActualizado', occurredAt: minsAgo(40), source: 'emergency-service', version: '1' }, data: { correlationId: 'corr-em-01', emergenciaId: 'EMG-901', estadoAnterior: 'RECIBIDO', estadoNuevo: 'EN_REVISION' } },
  { metadata: { eventId: 'evt-em-st2', eventType: 'EmergenciaEstadoActualizado', occurredAt: minsAgo(35), source: 'emergency-service', version: '1' }, data: { correlationId: 'corr-em-01', emergenciaId: 'EMG-901', estadoAnterior: 'EN_REVISION', estadoNuevo: 'ASIGNADO' } },
  { metadata: { eventId: 'evt-em-st3', eventType: 'EmergenciaEstadoActualizado', occurredAt: minsAgo(22), source: 'emergency-service', version: '1' }, data: { correlationId: 'corr-em-02', emergenciaId: 'EMG-902', estadoAnterior: 'RECIBIDO', estadoNuevo: 'EN_REVISION' } },
  { metadata: { eventId: 'evt-em-st4', eventType: 'EmergenciaEstadoActualizado', occurredAt: hoursAgo(2, 45), source: 'emergency-service', version: '1' }, data: { correlationId: 'corr-em-04', emergenciaId: 'EMG-904', estadoAnterior: 'ASIGNADO', estadoNuevo: 'EN_PROCESO' } },
  { metadata: { eventId: 'evt-em-st5', eventType: 'EmergenciaEstadoActualizado', occurredAt: hoursAgo(2), source: 'emergency-service', version: '1' }, data: { correlationId: 'corr-em-05', emergenciaId: 'EMG-905', estadoAnterior: 'EN_PROCESO', estadoNuevo: 'CERRADA' } },
];

export const mockEmergenciaDespachadaEvents: EmergenciaDespachadaEvent[] = [
  { metadata: { eventId: 'evt-em-d1', eventType: 'EmergenciaDespachada', occurredAt: minsAgo(35), source: 'emergency-service', version: '1' }, data: { correlationId: 'corr-em-01', emergenciaId: 'EMG-901', recursoId: 'AMB-402' } },
  { metadata: { eventId: 'evt-em-d2', eventType: 'EmergenciaDespachada', occurredAt: minsAgo(22), source: 'emergency-service', version: '1' }, data: { correlationId: 'corr-em-02', emergenciaId: 'EMG-902', recursoId: 'BOMB-108' } },
  { metadata: { eventId: 'evt-em-d3', eventType: 'EmergenciaDespachada', occurredAt: hoursAgo(2, 45), source: 'emergency-service', version: '1' }, data: { correlationId: 'corr-em-04', emergenciaId: 'EMG-904', recursoId: 'PAT-201' } },
  { metadata: { eventId: 'evt-em-d4', eventType: 'EmergenciaDespachada', occurredAt: hoursAgo(4, 50), source: 'emergency-service', version: '1' }, data: { correlationId: 'corr-em-05', emergenciaId: 'EMG-905', recursoId: 'DEF-012' } },
  { metadata: { eventId: 'evt-em-d6', eventType: 'EmergenciaDespachada', occurredAt: hoursAgo(5, 45), source: 'emergency-service', version: '1' }, data: { correlationId: 'corr-em-06', emergenciaId: 'EMG-906', recursoId: 'AMB-405' } },
  { metadata: { eventId: 'evt-em-d9', eventType: 'EmergenciaDespachada', occurredAt: hoursAgo(11, 48), source: 'emergency-service', version: '1' }, data: { correlationId: 'corr-em-09', emergenciaId: 'EMG-909', recursoId: 'GAS-001' } },
  { metadata: { eventId: 'evt-em-d11', eventType: 'EmergenciaDespachada', occurredAt: hoursAgo(17, 50), source: 'emergency-service', version: '1' }, data: { correlationId: 'corr-em-11', emergenciaId: 'EMG-911', recursoId: 'DEF-099' } },
];

export const mockEmergenciaCerradaEvents: EmergenciaCerradaEvent[] = [
  { metadata: { eventId: 'evt-em-z1', eventType: 'EmergenciaCerrada', occurredAt: hoursAgo(2), source: 'emergency-service', version: '1' }, data: { correlationId: 'corr-em-05', emergenciaId: 'EMG-905', resultado: 'RESUELTA' } },
  { metadata: { eventId: 'evt-em-z2', eventType: 'EmergenciaCerrada', occurredAt: hoursAgo(19), source: 'emergency-service', version: '1' }, data: { correlationId: 'corr-em-12', emergenciaId: 'EMG-912', resultado: 'RESUELTA' } },
];

export const mockEmergenciesAIReport: AIAnalysisReport = rawEmergenciesSummary as unknown as AIAnalysisReport;
