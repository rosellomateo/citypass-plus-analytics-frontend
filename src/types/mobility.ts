// src/types/mobility.ts
import type { AIAnalysisReport } from './ai';

/**
 * Registros estructurados del dataset Parquet de viajes (gold/Movilidad Urbana/viajes_resumen_XX_2026.parquet).
 * DTO exacto enviado por el backend sin atributos inventados.
 */
export interface BackendMobilityRecord {
  fechaInicio: string;
  estacionInicio: string;
  duracionViaje: string; // e.g. '<15min' | '15-30min' | '30-60min' | '>1h'
  cantidadViajes: number;
  duracionTotalViajes: number;
  promDuracion: number;
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
export interface TripsByStationItem {
  station: string;
  cantidadViajes: number;
}

export interface TripsByDurationBucketItem {
  bucket: string;
  cantidadViajes: number;
  porcentaje: number;
}

export interface DailyTripsTrendItem {
  fecha: string;
  cantidadViajes: number;
  duracionTotal: number;
}

export interface StationAvgDurationItem {
  station: string;
  promDuracionPonderada: number; // SUM(duracionTotalViajes) / SUM(cantidadViajes)
  cantidadViajes: number;
}

export interface MobilityAnalyticsData {
  totalTrips: number;
  weeklyTrips: number;
  totalDurationMinutes: number;
  weightedAvgDurationMinutes: number; // SUM(duracionTotalViajes) / SUM(cantidadViajes)
  topStationName: string;
  predominantDurationBucket: string;
  tripsByStation: TripsByStationItem[];
  tripsByDurationBucket: TripsByDurationBucketItem[];
  dailyTripsTrend: DailyTripsTrendItem[];
  stationAvgDuration: StationAvgDurationItem[];
  availableStations: string[];
  records: BackendMobilityRecord[];
  executiveReport?: MobilityWeeklyAnalysis;
  aiReport?: AIAnalysisReport;
}
