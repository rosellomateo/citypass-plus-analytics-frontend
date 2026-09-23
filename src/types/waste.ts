// src/types/waste.ts

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
export type WasteDashboardData = WasteAlertMetrics | WasteMockMetrics;
