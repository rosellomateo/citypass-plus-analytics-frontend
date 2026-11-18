/** WGS84 / GeoJSON order: longitude first, latitude second. */
export type GeoPosition = [number, number];

export type TerritorialResourceType = 'emergencia' | 'recorrido_residuos' | 'estacion'
  | 'alerta_residuos' | 'intervencion_residuos' | 'reclamo';

export interface TerritorialEvent {
  evento_id: string;
  nombre?: string;
  zona?: string;
  tipo?: string;
  inicio: string;
  fin: string;
  coordenadas: GeoPosition;
  radio_metros?: number;
  estado?: string;
}

export interface TerritorialResource {
  recurso_id: string;
  tipo: TerritorialResourceType;
  nombre?: string;
  zona?: string;
  coordenadas?: GeoPosition;
  trazado?: GeoPosition[];
  creado_en?: string;
  desde?: string;
  hasta?: string;
  estado?: string;
  criticidad?: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA';
  criticidad_original?: TerritorialResource['criticidad'];
  criticidad_elevada?: boolean;
  respondida?: boolean;
}

/** Optional detailed source; aggregates alone cannot populate this structure. */
export interface TerritorialContext {
  eventos: TerritorialEvent[];
  recursos: TerritorialResource[];
  cobertura: TerritorialResourceType[];
}

export interface TerritorialMatch {
  evento_id: string;
  recurso_id: string;
  tipo: TerritorialResourceType;
  nombre?: string;
  nombre_evento?: string;
  zona?: string;
  distancia_metros: number;
  radio_metros: number;
}
