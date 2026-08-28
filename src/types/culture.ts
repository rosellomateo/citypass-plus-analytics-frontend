// src/types/culture.ts
import type { EventEnvelope } from './common';

export type EventCategory = 'cultural' | 'deportivo' | 'recreativo';

export interface ReservaConfirmadaData {
  reservaId: string;
  espacioId: string;
  tipoEspacio: string;
  zona: string;
  franjaHoraria: string;
  cantidadAsistentesEstim: number;
  ciudadanoId: string;
}

export interface ReservaCanceladaData {
  reservaId: string;
  espacioId: string;
  franjaHoraria: string;
}

export interface EventoPublicadoData {
  eventoId: string;
  titulo: string;
  categoria: EventCategory;
  espacioId: string;
  zona: string;
  fechaHoraEvento: string;
  cupoMaximo: number;
  requiereInscripcion: boolean;
  organizadorId: string;
}

export interface InscripcionConfirmadaData {
  inscripcionId: string;
  eventoId: string;
  ciudadanoId: string;
}

export interface InscripcionCanceladaData {
  inscripcionId: string;
  eventoId: string;
}

export interface EventoCanceladoData {
  eventoId: string;
  motivo: string;
  cantidadInscriptosAlCancelar: number;
}

export type ReservaConfirmadaEvent = EventEnvelope<ReservaConfirmadaData>;
export type ReservaCanceladaEvent = EventEnvelope<ReservaCanceladaData>;
export type EventoPublicadoEvent = EventEnvelope<EventoPublicadoData>;
export type InscripcionConfirmadaEvent = EventEnvelope<InscripcionConfirmadaData>;
export type InscripcionCanceladaEvent = EventEnvelope<InscripcionCanceladaData>;
export type EventoCanceladoEvent = EventEnvelope<EventoCanceladoData>;

export interface CultureAnalyticsData {
  // CU-C1
  confirmedReservations: number;
  cancelledReservations: number;
  cancellationRatePct: number;
  reservationsBySpace: { space: string; confirmed: number; cancelled: number }[];

  // CU-C2
  totalInscriptions: number;
  inscriptionsByEvent: { eventTitle: string; registered: number; capacity: number; occupancyPct: number }[];
  inscriptionsByCategory: { category: string; count: number }[];
  avgOccupancyRatePct: number;
}
