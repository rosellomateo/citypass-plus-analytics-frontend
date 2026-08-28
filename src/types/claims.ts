// src/types/claims.ts
import type { EventEnvelope } from './common';

export type ClaimCategory = 'alumbrado' | 'residuos' | 'calles' | 'transito' | 'espacios_publicos' | 'ruido' | 'otros';
export type ClaimStatus = 'creado' | 'en curso' | 'cerrado' | 'cancelado';

export interface ClaimCreatedData {
  reclamoId: string;
  categoria: ClaimCategory;
  estado: 'creado';
  zona: string;
  ciudadanoId: string; // anonimizado
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
}
