import type { AIAnalysisReport } from '../types/ai';

export interface ClaimApiRecord {
  barrio: string | null;
  categoria: string | null;
  prioridad: string | null;
  origenClasificacion: string | null;
  estado_actual: string | null;
  row_count: number | null;
  tiempo_prom_hasta_estado_actual: number | null;
  fecha_snapshot: string | null;
}

export interface ClaimsApiResponse {
  datos: ClaimApiRecord[];
  informe: AIAnalysisReport;
}

export interface WasteApiResponse {
  datos: WasteApiRecord[];
  informe: AIAnalysisReport;
}

export interface MobilityApiResponse {
  datos: MobilityApiRecord[];
  informe: AIAnalysisReport;
}

export interface CultureApiResponse {
  datos: CultureApiRecord[];
  informe: AIAnalysisReport;
}

export interface EmergencyApiResponse {
  datos: EmergencyApiRecord[];
  informe: AIAnalysisReport;
}

export interface EmergencyApiRecord {
  estado_actual: string | null;
  prioridad: string | null;
  cantidadEmergencias: number | null;
  tiempoPromRespuestaDespacho: number | null;
  tiempoPromRespuestaLugar: number | null;
  fecha_snapshot: string | null;
}

export interface MobilityApiRecord {
  fechaInicio: string | null;
  estacionInicio: string | null;
  duracionViaje: string | null;
  cantidadViajes: number | null;
  duracionTotalViajes: number | null;
  promDuracion: number | null;
  fecha_snapshot: string | null;
}

export interface CultureApiRecord {
  recursoId: string | null;
  tipoReserva: string | null;
  categoria: string | null;
  zona: string | null;
  cupoMaximo: number | null;
  cantidadTotal: number | null;
  cantidadConfirmadas: number | null;
  cantidadCanceladas: number | null;
  inscriptos: number | null;
  pctOcupacion: number | null;
  fecha_snapshot: string | null;
}

export interface WasteApiRecord {
  zona: string | null;
  tipoAlerta: string | null;
  prioridad: string | null;
  rangoNivelLlenado: string | null;
  cantidadAlertas: number | null;
  cantidadResueltas: number | null;
  tiempoPromResolucion: number | null;
  fecha_snapshot: string | null;
}

export interface EventApiRecord {
  id_evento: string;
  tipo_evento: string;
  fecha_hora: string;
  area: string;
  version: string;
  id_correlacion: string;
}
