// src/adapters/wasteAdapter.ts
import type { WasteInputJson, ContainerStatus } from '../types';

export interface NormalizedWasteRecord {
  containerId: string;
  zone: string;
  wasteType: string;
  fillLevelPct: number;
  status: ContainerStatus;
  isOverflowing: boolean;
  hoursOverfilled: number;
  collectedOnTime: boolean;
  collectionTimeHours: number;
  collectedTons: number;
  timestamp: string;
}

/**
 * Adaptador de Datos de Entrada (JSON -> Modelo Interno Normalizado)
 * Responsabilidad exclusiva:
 * - Recibir JSON crudo.
 * - Validar/normalizar la estructura básica.
 * - Clasificar el estado del contenedor según reglas documentadas.
 * - Transformar el formato externo a modelos planos normalizados.
 *
 * NOTA: No aplica filtros, no calcula KPIs ni realiza agregaciones/ordenamientos.
 */
export function adaptWasteInput(rawInput: WasteInputJson): NormalizedWasteRecord[] {
  if (!rawInput || !Array.isArray(rawInput.records)) {
    return [];
  }

  return rawInput.records.map((rec) => {
    const fillLevelPct = Number(rec.currentFillPct ?? 0);
    const isOverflowing = Boolean(rec.isOverflowing || fillLevelPct >= 100);

    // Clasificación de estado según especificación funcional
    let status: ContainerStatus = 'NORMAL';
    if (isOverflowing) {
      status = 'DESBORDADO';
    } else if (fillLevelPct > 80) {
      status = 'CRÍTICO';
    } else if (fillLevelPct >= 50) {
      status = 'MEDIO';
    } else {
      status = 'NORMAL';
    }

    return {
      containerId: String(rec.containerId ?? 'N/A'),
      zone: String(rec.zone ?? 'Desconocida'),
      wasteType: String(rec.wasteType ?? 'Orgánico'),
      fillLevelPct,
      status,
      isOverflowing,
      hoursOverfilled: Number(rec.hoursInCriticalState ?? 0),
      collectedOnTime: Boolean(rec.collectedOnTime),
      collectionTimeHours: Number(rec.collectionTimeHours ?? 0),
      collectedTons: Number(rec.collectedTons ?? 0),
      timestamp: String(rec.timestamp ?? new Date().toISOString()),
    };
  });
}
