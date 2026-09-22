// src/types/ai.ts

export interface AIAnalysisLlmInfo {
  deployment?: string;
  finish_reason?: string;
  input_tokens?: number;
  modelo_respuesta?: string;
  output_tokens?: number;
  proveedor?: string;
  request_id?: string;
}

export interface AIAnalysisMetadata {
  avisos?: string[];
  caso_de_uso?: string;
  cifras?: Record<string, unknown>;
  corte?: string;
  filas_enviadas?: number;
  fuentes?: string[];
  llm?: AIAnalysisLlmInfo;
  semana_actual?: string;
  semanas_comparadas?: string[];
  snapshot_base?: string;
  version_esquema?: string;
}

export interface AIAnalysisResumen {
  parrafo_ejecutivo?: string;
  puntos_destacados?: string[];
  recomendaciones?: string[];
  riesgos?: string[];
}

export interface AIAnalysisItem {
  generado_en?: string;
  metadata?: AIAnalysisMetadata;
  resumen?: AIAnalysisResumen;
  semana?: string;
}

export interface AIAnalysisReport {
  actualizado_en?: string;
  analisis?: AIAnalysisItem[];
  caso_de_uso?: string;
  semanas?: string[];
  ultima_semana?: string;
  version_esquema?: string;
}
