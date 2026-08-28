// src/types/index.ts

export type { Domain } from './domain';
export type {
  EventEnvelope,
  Metric,
  TimeSeriesPoint,
  DashboardFilters,
  UiState,
} from './common';

export type {
  ClaimCategory,
  ClaimStatus,
  ClaimCreatedEvent,
  ClaimUpdatedEvent,
  ClaimsAnalyticsData,
} from './claims';

export type {
  EmergencyPriority,
  EmergencyState,
  EmergenciaCreadaEvent,
  EmergenciaPriorizadaEvent,
  EmergenciaEstadoActualizadoEvent,
  EmergenciaDespachadaEvent,
  EmergenciaCerradaEvent,
  EmergencyAnalyticsData,
} from './emergencies';

export type {
  ViajeIniciadoEvent,
  ViajeFinalizadoEvent,
  MobilityAnalyticsData,
} from './mobility';

export type {
  EventCategory,
  ReservaConfirmadaEvent,
  ReservaCanceladaEvent,
  EventoPublicadoEvent,
  InscripcionConfirmadaEvent,
  InscripcionCanceladaEvent,
  EventoCanceladoEvent,
  CultureAnalyticsData,
} from './culture';
