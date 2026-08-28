// src/types/mobility.ts
import type { EventEnvelope } from './common';

export interface ViajeIniciadoData {
  viajeId: string;
  bicicletaId: string;
  estacionOrigenId: string;
  usuarioId: string; // anonimizado
}

export interface ViajeFinalizadoData {
  viajeId: string;
  bicicletaId: string;
  estacionDestinoId: string;
  duracionSegundos?: number;
}

export type ViajeIniciadoEvent = EventEnvelope<ViajeIniciadoData>;
export type ViajeFinalizadoEvent = EventEnvelope<ViajeFinalizadoData>;

export interface MobilityAnalyticsData {
  totalTripsStarted: number;
  tripsByOriginStation: { station: string; count: number }[];
  tripsByTimeSlot: { slot: string; count: number }[];
  avgTripDurationMinutes: number;
  tripDurationDistribution: { range: string; count: number }[];
}
