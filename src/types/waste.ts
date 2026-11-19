// src/types/waste.ts
import type { AIAnalysisReport } from './ai';

/**
 * Estructura provisional JSON de entrada (simulación de datos recibidos del backend).
 * NOTA: Esta estructura es provisional para desarrollo del frontend.
 */
export interface RawWasteContainerRecord {
  containerId: string;
  zone: string;
  wasteType: 'Orgánico' | 'Reciclable' | 'Peligroso' | 'Voluminoso' | string;
  currentFillPct: number;
  isOverflowing?: boolean;
  hoursInCriticalState?: number;
  collectedOnTime?: boolean;
  collectionTimeHours?: number;
  collectedTons?: number;
  timestamp?: string;
}

export interface WasteInputJson {
  generatedAt: string;
  records: RawWasteContainerRecord[];
}

/**
 * Modelos de Dominio Interno para Frontend
 */
export type ContainerStatus = 'NORMAL' | 'MEDIO' | 'CRÍTICO' | 'DESBORDADO';

export interface ContainerStatusData {
  status: ContainerStatus;
  count: number;
}

export interface WasteVolumeByType {
  wasteType: string;
  tons: number;
}

export interface CollectionTimeByZone {
  zone: string;
  hours: number;
}

export interface CriticalContainerDetail {
  containerId: string;
  zone: string;
  wasteType: string;
  fillLevelPct: number;
  hoursOverfilled: number;
}

export interface WasteMetrics {
  totalCollectedTons: number;
  onTimeCollectionRatePct: number;
  avgCollectionTimeHours: number;
  containersByStatus: ContainerStatusData[];
  volumeByWasteType: WasteVolumeByType[];
  avgCollectionTimeByZone: CollectionTimeByZone[];
  criticalContainersDetail: CriticalContainerDetail[];
  aiReport?: AIAnalysisReport;
}

export type WasteAnalyticsData = WasteMetrics;

export interface WasteAlertDetail {
  id: string;
  zone: string;
  alertType: string;
  priority: string;
  fillRange: string;
  alerts: number;
  resolved: number;
  avgResolutionTime: number;
}

export interface WasteAlertMetrics {
  aiReport?: AIAnalysisReport;
  mode: 'alerts';
  totalAlerts: number;
  resolvedAlerts: number;
  resolutionRatePct: number;
  avgResolutionTime: number;
  alertsByFillRange: { range: string; count: number }[];
  alertsByType: { alertType: string; count: number }[];
  alertsByPriority: { priority: string; count: number }[];
  avgResolutionTimeByZone: { zone: string; value: number }[];
  details: WasteAlertDetail[];
  availableZones: string[];
  availableAlertTypes: string[];
}

export type WasteMockMetrics = WasteMetrics & { mode: 'mock' };
export interface WasteInterventionDetail {
  id: string;
  zone: string;
  state: string;
  schedulingCause: string;
  affectionCause: string;
  interventions: number;
  completed: number;
}

/** Intervention data translated by /analytics/residuos into its legacy DTO. */
export interface WasteInterventionMetrics {
  mode: 'interventions';
  aiReport?: AIAnalysisReport;
  snapshotDate: string;
  total: number;
  affected: number;
  scheduled: number;
  cancelled: number;
  completed: number;
  completionRatePct: number;
  byState: { state: string; count: number }[];
  bySchedulingCause: { etiqueta: string; valor: number }[];
  byAffectionCause: { etiqueta: string; valor: number }[];
  byZone: { zone: string; total: number; affected: number; cancelled: number }[];
  caseMetrics: import('../api/types').CrossModuleMetric[];
  details: WasteInterventionDetail[];
  availableZones: string[];
  availableSchedulingCauses: string[];
  availableAffectionCauses: string[];
  availableStates: string[];
  filtered: boolean;
}

export type WasteDashboardData = WasteAlertMetrics | WasteInterventionMetrics;
