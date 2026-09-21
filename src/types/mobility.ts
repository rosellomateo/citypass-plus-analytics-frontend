// src/types/mobility.ts
import type { EventEnvelope } from './common';

export type StationStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type BikeStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_SERVICE' | 'STOLEN';
export type TripStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'INCIDENT';
export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'REPORTED' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISCARDED';

export interface StationEntity {
  id: string;
  externalId?: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  capacity: number;
  status: StationStatus;
  source: 'DATASET' | 'MANUAL';
  createdAt?: string;
}

export interface BikeEntity {
  id: string;
  code: string;
  stationId?: string | null; // NULL while bike is IN_USE
  status: BikeStatus;
  model?: string;
  purchaseDate?: string;
  lastMaintenanceAt?: string;
}

export interface BikeStatusHistoryEntity {
  id: string;
  bikeId: string;
  previousStatus: BikeStatus;
  newStatus: BikeStatus;
  changedByUserId?: string;
  reason?: string;
  changedAt: string;
}

export interface TripEntity {
  id: string;
  userId: string;
  bikeId: string;
  originStationId: string;
  destinationStationId?: string;
  startedAt: string;
  endedAt?: string;
  status: TripStatus;
  distanceKm?: number;
  durationSeconds?: number;
}

export interface IncidentTypeEntity {
  id: string;
  code: string;
  name: string;
  description?: string;
  severity: IncidentSeverity;
}

export interface BikeIncidentEntity {
  id: string;
  bikeId: string;
  incidentTypeId: string;
  reporterUserId?: string;
  stationId?: string;
  tripId?: string;
  status: IncidentStatus;
  description?: string;
  reportedAt: string;
  resolvedAt?: string;
}

export interface MaintenanceRecordEntity {
  id: string;
  bikeId: string;
  startedAt: string;
  endedAt?: string;
  description?: string;
  cost?: number;
  performedBy?: string;
}

export interface StationAvailabilityHistoryEntity {
  id: string;
  stationId: string;
  recordedAt: string;
  availableBikes: number;
  availableSlots: number;
  occupiedSlots: number;
}

export interface StationPredictionEntity {
  stationId: string;
  predictedHour: string;
  predictedDemand: number;
  predictedAvailableBikes: number;
}

// Event Envelopes for compatibility with backend stream listeners
export interface ViajeIniciadoData {
  viajeId: string;
  bicicletaId: string;
  estacionOrigenId: string;
  usuarioId: string;
}

export interface ViajeFinalizadoData {
  viajeId: string;
  bicicletaId: string;
  estacionDestinoId: string;
  duracionSegundos?: number;
}

export type ViajeIniciadoEvent = EventEnvelope<ViajeIniciadoData>;
export type ViajeFinalizadoEvent = EventEnvelope<ViajeFinalizadoData>;

// Dashboard Aggregation Interfaces
export interface StationBikesCount {
  station: string;
  count: number;
}

export interface BikeStatusDistributionItem {
  name: string;
  value: number;
  color: string;
}

export interface DualSeriesTimeSlotItem {
  slot: string;
  iniciados: number;
  finalizados: number;
}

export interface StationAvailabilityOccupancyItem {
  station: string;
  availableBikes: number;
  freeSlots: number;
  capacity: number;
}

export interface HistoricalAvailabilityPoint {
  timestamp: string;
  availableBikes: number;
  freeSlots: number;
}

export interface IncidentTypeDistributionItem {
  typeName: string;
  count: number;
  severity: IncidentSeverity;
}

export interface AvgMaintenanceTimeByStation {
  station: string;
  avgHours: number;
}

export interface TopProblematicBikeItem {
  bikeCode: string;
  stationName: string;
  incidentCount: number;
  maintenanceCount: number;
  status: BikeStatus;
}

export interface MobilityAnalyticsData {
  totalTripsStarted: number;
  totalTripsCompleted: number;
  avgTripDurationMinutes: number;
  totalBikes: number;
  availableBikesCount: number;
  totalFreeSlots: number;
  bikesByStation: StationBikesCount[];
  bikesStatusDistribution: BikeStatusDistributionItem[];
  timeSlotDualSeries: DualSeriesTimeSlotItem[];
  stationAvailabilityOccupancy: StationAvailabilityOccupancyItem[];
  historicalAvailability: HistoricalAvailabilityPoint[];
  incidentsByTypeDistribution: IncidentTypeDistributionItem[];
  avgMaintenanceTimeByStation: AvgMaintenanceTimeByStation[];
  topProblematicBikes: TopProblematicBikeItem[];
  availableStations: string[];
}
