// src/types/claims.ts
import type { EventEnvelope } from './common';
import type { AIAnalysisReport } from './ai';

export type ClaimCategory =
  | 'alumbrado'
  | 'residuos'
  | 'calles'
  | 'transito'
  | 'espacios_publicos'
  | 'ruido'
  | 'otros'
  | string;

export type ClaimStatus =
  | 'creado'
  | 'en curso'
  | 'cerrado'
  | 'cancelado'
  | 'ASIGNADO'
  | 'RECHAZADO'
  | string;

export interface BackendAnalyticsRecord {
  barrio: string;
  categoria: string;
  prioridad: string;
  origenClasificacion: string;
  estado_actual: string;
  row_count: number;
  tiempo_prom_hasta_estado_actual: number;
  fecha_snapshot: string;
}

// Event envelope wrappers for backwards compatibility
export interface ClaimCreatedData {
  reclamoId: string;
  categoria: ClaimCategory;
  estado: 'creado';
  zona: string;
  ciudadanoId: string;
}

export interface ClaimUpdatedData {
  reclamoId: string;
  estadoAnterior: ClaimStatus;
  estadoNuevo: ClaimStatus;
  motivo?: string;
}

export type ClaimCreatedEvent = EventEnvelope<ClaimCreatedData>;
export type ClaimUpdatedEvent = EventEnvelope<ClaimUpdatedData>;

export interface ClaimsAnalyticsData {
  totalClaims: number;
  claimsByCategory: { category: string; count: number }[];
  claimsByStatus: { status: string; count: number }[];
  avgResolutionTimeHours: number;
  avgResolutionByCategory: { category: string; hours: number }[];
  availableCategories: string[];
  aiReport?: AIAnalysisReport;
}
