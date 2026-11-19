// src/types/mobility.ts
import type { AIAnalysisReport } from './ai';

/**
 * Una fila de gold de Movilidad (gold/Movilidad Urbana/viajes_resumen.parquet,
 * estructura nueva): afectaciones de estaciones y viajes agrupados por la causa
 * que los origino. causaTipo NORMAL son los viajes finalizados sin incidente.
 */
export interface BackendMobilityRecord {
  causaTipo: string;
  cantidadAfectaciones: number;
  estacionesAfectadasDistintas: number;
  cantidadBloqueadas: number;
  estacionesBloqueadasDistintas: number;
  cantidadPreventivas: number;
  cantidadRestauradas: number;
  cantidadViajesInterrumpidos: number;
  fecha_snapshot: string;
}

/**
 * Estructuras del Reporte Sintético Analítico generado por el LLM.
 */
export interface MobilityLLMResumen {
  parrafo_ejecutivo: string;
  puntos_destacados: string[];
  recomendaciones: string[];
  riesgos: string[];
}

export interface MobilityLLMCifras {
  [key: string]: number;
  acumulado_total: number;
  altas_semana: number;
  duracionTotalViajes: number;
}

export interface MobilityLLMMetadata {
  avisos: string[];
  caso_de_uso: string;
  cifras: MobilityLLMCifras;
  corte: string;
  filas_enviadas: number;
  fuentes: string[];
  llm: {
    deployment: string;
    finish_reason: string;
    input_tokens: number;
    modelo_respuesta: string;
    output_tokens: number;
    proveedor: string;
    request_id: string;
  };
  semana_actual: string;
  semanas_comparadas: string[];
  snapshot_base: string;
  version_esquema: string;
}

export interface MobilityWeeklyAnalysis {
  generado_en: string;
  metadata: MobilityLLMMetadata;
  resumen: MobilityLLMResumen;
  semana: string;
}

export interface MobilityLLMReport {
  actualizado_en: string;
  analisis: MobilityWeeklyAnalysis[];
  caso_de_uso: string;
  semanas: string[];
  ultima_semana: string;
  version_esquema: string;
}

/**
 * Métricas agregadas y modelos para componentes de UI (independientes de los DTOs recibidos).
 */
export interface MobilityCauseItem {
  causa: string;
  etiqueta: string;
  afectaciones: number;
  estaciones: number;
  bloqueadas: number;
  estacionesBloqueadas: number;
  preventivas: number;
  restauradas: number;
}

export interface MobilityTripsItem {
  causa: string;
  etiqueta: string;
  viajes: number;
}

export interface MobilityAnalyticsData {
  caseMetrics: import('../api/types').CrossModuleMetric[];
  totalAffectations: number;
  totalBlocked: number;
  totalPreventive: number;
  totalRestored: number;
  restoredPct: number;
  interruptedTrips: number;
  normalTrips: number;
  topCause: string;
  affectationsByCause: MobilityCauseItem[];
  tripsByCause: MobilityTripsItem[];
  availableCauses: string[];
  snapshotDate: string;
  records: BackendMobilityRecord[];
  executiveReport?: MobilityWeeklyAnalysis;
  aiReport?: AIAnalysisReport;
}
