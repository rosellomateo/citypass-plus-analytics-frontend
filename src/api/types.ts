import type { AIAnalysisReport } from '../types/ai';
import type { TerritorialContext, TerritorialMatch } from '../types/territorial';

export interface LoginEventRecord {
  department: string | null;
  event_type: string | null;
  cantidadEventos: number | null;
  fecha_snapshot: string | null;
}

export interface LoginApiResponse {
  datos: LoginEventRecord[];
  informe: AIAnalysisReport | null;
}

export interface CrossModuleMetric {
  id: string;
  etiqueta?: string | null;
  valor: number;
  unidad?: string | null;
  detalle?: Array<{ etiqueta: string; valor: number }>;
}

export interface GoldReportChart {
  id: string;
  titulo: string;
  fecha_snapshot: string;
  puntos: { etiqueta: string; valor: number }[];
}

export type CausePoint = GoldReportChart['puntos'][number];

export interface ScopedCauses {
  nombre: string;
  causas: CausePoint[];
}

export interface Affectations {
  fecha_snapshot: string;
  espacios_publicos?: number | null;
  zonas_por_eventos?: number | null;
  estaciones?: ScopedCauses[];
  zonas?: ScopedCauses[];
  estado_estaciones?: StationAffectation[];
  recorridos_eventos?: RouteAffectation[];
  recorridos_efectos?: RouteEffect[];
}

export interface StationAffectation {
  id: string;
  estacion: string;
  zona?: string | null;
  causa?: string | null;
  tipo?: string | null;
  estado: 'AFECTADA' | 'PROGRAMADA' | 'RESTAURADA';
}

export interface RouteAffectation {
  recorrido_id: string;
  recorrido?: string | null;
  evento_id: string;
  nombre_evento?: string | null;
  zona?: string | null;
  inicio?: string | null;
  fin?: string | null;
  inicio_afectacion?: string | null;
  distancia_metros?: number;
  criterio?: 'proximidad';
}

export interface RouteEffect {
  id: string;
  recorrido_id: string;
  recorrido?: string | null;
  zona?: string | null;
  causa: string;
  tipo_efecto: string;
  inicio_afectacion?: string | null;
}

export interface CrossModuleResponse {
  fecha_snapshot: string | null;
  datos: CrossModuleMetric[];
  actualizado_en?: string | null;
  impactos?: Array<{ caso: number | null; origen: string; emergencias: number; ultimo_vinculo: string }>;
  eventos_publicos?: Array<{ evento_id: string; nombre?: string | null; emergencias: number; ultimo_vinculo: string }> | null;
  informe?: AIAnalysisReport | null;
  version_cultura?: number | null;
  eventos_zona?: PublicEventZone[] | null;
  emergencias_zona?: EmergencyZoneLink[] | null;
  resumen_gold?: GoldReportChart[];
  tipos_recibidos?: { etiqueta: string; valor: number }[];
  afectaciones?: Affectations | null;
  /** Optional original envelopes, when supplied by the data source. */
  intervenciones?: WasteInterventionEvent[];
  contexto_territorial?: TerritorialContext;
  proximidades?: TerritorialMatch[];
}

export interface WasteInterventionEvent {
  metadata: { eventType: string; eventId?: string; receivedAt?: number; source?: string };
  data: {
    intervencionId: string;
    camionId?: string | null;
    estadoAnterior?: string;
    estadoNuevo: string;
    causaId?: string | null;
    causaTipo?: string | null;
    correlationId?: string | null;
    updatedAt: string;
  };
}

export interface PublicEventZone {
  evento_id: string;
  nombre?: string | null;
  espacio?: string | null;
  inicio?: string | null;
  fin?: string | null;
  estado?: string | null;
  ultimo_vinculo?: string | null;
  radios_metros?: number[];
  emergencias?: number | null;
  alertas_residuos?: number | null;
  intervenciones_residuos?: number | null;
  estaciones_afectadas?: number | null;
  estaciones_bloqueadas?: number | null;
  reclamos?: number | null;
  causas?: CausePoint[];
  efecto?: string | null;
  descripcion_efecto?: string | null;
  zona?: string | null;
  emergencias_cercanas?: number | null;
  recorridos_cercanos?: number | null;
  estaciones_cercanas?: number | null;
  reclamos_cercanos?: number | null;
  radio_metros?: number | null;
}

export interface EmergencyZoneLink {
  emergencia_id: string;
  evento_id: string | null;
  nombre_evento?: string | null;
  vinculada_en: string;
  radio_metros?: number | null;
  tipo?: string | null;
  sector?: string | null;
  criticidad?: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA' | null;
  criticidad_original?: EmergencyZoneLink['criticidad'];
  criticidad_elevada?: boolean | null;
  estado?: string | null;
  respondida?: boolean | null;
  causa_repetida?: boolean | null;
  distancia_metros?: number;
  criterio?: 'proximidad';
}

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
  datos: CultureApiRecord[] | CultureActivityApiRecord[];
  informe: AIAnalysisReport;
}

export interface EmergencyApiResponse {
  datos: EmergencyApiRecord[];
  informe: AIAnalysisReport;
}

export interface EmergencyApiRecord {
  estado_actual: string | null;
  prioridad: string | null;
  categoria?: string | null;
  causaTipo?: string | null;
  tiempoPromResolucion?: number | null;
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

export interface CultureActivityApiRecord {
  categoria: string | null;
  organizadorTipo?: string | null;
  barrio?: string | null;
  zona?: string | null;
  cantidadActividades: number | null;
  cantidadMasivas: number | null;
  cantidadAfectadasPorClima: number | null;
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
