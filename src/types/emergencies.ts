// src/types/emergencies.ts
import type { EventEnvelope } from './common';
import type { AIAnalysisReport } from './ai';

export type EmergencyPriority = 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA';
export type EmergencyState =
  | 'PENDIENTE'
  | 'VALIDADA'
  | 'DESPACHADA'
  | 'EN_CAMINO'
  | 'EN_LUGAR'
  | 'RESUELTA'
  | 'CERRADA'
  | 'DESCARTADA'
  | 'RECIBIDO'
  | 'EN_REVISION'
  | 'ASIGNADO'
  | 'EN_PROCESO'
  | 'RECHAZADO';

export interface EmergenciaCreadaData {
  emergenciaId: string;
  tipo: string;
  categoria?: string;
  origen: string;
  ubicacion: string;
  estado: EmergencyState;
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

export interface CategoryPriorityStackedData {
  SIN_PRIORIDAD?: number;
  category: string;
  BAJA: number;
  MEDIA: number;
  ALTA: number;
  CRITICA: number;
  total: number;
}

export interface EmergencyAnalyticsData {
  affectedCriticalityCount?: number;
  circulationAffectedCount?: number;
  circulationUnknownCount?: number;
  totalEmergencies: number;
  activeCount: number;
  unknownStateCount?: number;
  caseMetrics?: { id: string; valor: number }[];
  closedCount: number;
  emergenciesByState: { state: string; count: number }[];
  emergenciesByPriority: { priority: string; count: number }[];
  avgDispatchTimeMinutes?: number;
  avgArrivalTimeMinutes?: number;
  emergenciesByCause?: { etiqueta: string; valor: number }[];
  resolutionByCause?: { etiqueta: string; valor: number }[];
  avgDispatchTimeByPriority: { priority: string; minutes: number }[];
  emergenciesByCategoryStacked: CategoryPriorityStackedData[];
  availableCategories: string[];
  aiReport?: AIAnalysisReport;
}
