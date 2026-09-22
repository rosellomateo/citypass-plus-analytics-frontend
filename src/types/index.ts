// src/types/index.ts

export type { Domain } from './domain';
export type {
  EventEnvelope,
  Metric,
  TimeSeriesPoint,
  DashboardFilters,
  UiState,
  Severity,
} from './common';

export type {
  ClaimCategory,
  ClaimStatus,
  ClaimCreatedEvent,
  ClaimUpdatedEvent,
  ClaimsAnalyticsData,
  BackendAnalyticsRecord,
} from './claims';

export type {
  EmergencyPriority,
  EmergencyState,
  EmergenciaCreadaEvent,
  EmergenciaPriorizadaEvent,
  EmergenciaEstadoActualizadoEvent,
  EmergenciaDespachadaEvent,
  EmergenciaCerradaEvent,
  CategoryPriorityStackedData,
  EmergencyAnalyticsData,
} from './emergencies';

export type * from './mobility';

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

export type {
  RawWasteContainerRecord,
  WasteInputJson,
  ContainerStatus,
  ContainerStatusData,
  WasteVolumeByType,
  CollectionTimeByZone,
  CriticalContainerDetail,
  WasteMetrics,
} from './waste';

export type * from './ai';

