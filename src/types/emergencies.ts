// src/types/emergencies.ts
import type { EventEnvelope } from './common';

export type EmergencyPriority = 'ALTA' | 'MEDIA' | 'BAJA';
export type EmergencyState =
  | 'PENDIENTE'
  | 'VALIDADA'
  | 'DESPACHADA'
  | 'EN_CAMINO'
  | 'EN_LUGAR'
  | 'RESUELTA'
  | 'CERRADA'
  | 'DESCARTADA';

export interface EmergenciaCreadaData {
  emergenciaId: string;
  tipo: string;
  origen: string;
  ubicacion: string;
  estado: 'PENDIENTE';
}

export interface EmergenciaPriorizadaData {
  emergenciaId: string;
  prioridad: EmergencyPriority;
  score?: number;
}

export interface EmergenciaEstadoActualizadoData {
  emergenciaId: string;
  estadoAnterior: EmergencyState;
  estadoNuevo: EmergencyState;
}

export interface EmergenciaDespachadaData {
  emergenciaId: string;
  recursoId: string; // anonimizado
}

export interface EmergenciaCerradaData {
  emergenciaId: string;
  resultado: 'RESUELTA' | 'DESCARTADA';
}

export type EmergenciaCreadaEvent = EventEnvelope<EmergenciaCreadaData>;
export type EmergenciaPriorizadaEvent = EventEnvelope<EmergenciaPriorizadaData>;
export type EmergenciaEstadoActualizadoEvent = EventEnvelope<EmergenciaEstadoActualizadoData>;
export type EmergenciaDespachadaEvent = EventEnvelope<EmergenciaDespachadaData>;
export type EmergenciaCerradaEvent = EventEnvelope<EmergenciaCerradaData>;

export interface EmergencyAnalyticsData {
  totalEmergencies: number;
  activeCount: number;
  closedCount: number;
  emergenciesByState: { state: string; count: number }[];
  emergenciesByPriority: { priority: string; count: number }[];
  avgDispatchTimeMinutes: number;
  avgDispatchTimeByPriority: { priority: string; minutes: number }[];
}
