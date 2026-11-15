import type {
  ClaimsApiResponse,
  CultureApiResponse,
  EmergencyApiResponse,
  MobilityApiResponse,
  WasteApiResponse,
} from './types';
import { getEmbeddedModule, type EmbedModule } from '../embed/module';

async function read<T>(module: EmbedModule): Promise<T> {
  if (getEmbeddedModule() !== module) {
    throw new Error('Los datos embebidos pertenecen a otro módulo.');
  }
  const content = document.getElementById('citypass-datos')?.textContent;
  if (!content) throw new Error('El tablero no trae datos.');

  let payload;
  try {
    payload = JSON.parse(content);
  } catch {
    throw new Error('Los datos del tablero no contienen JSON válido.');
  }
  if (!payload || !Array.isArray(payload.datos) || !payload.informe) {
    throw new Error('El tablero no trae una respuesta de analítica válida.');
  }
  return payload as T;
}

export const embeddedApi = {
  getClaims: () => read<ClaimsApiResponse>('reclamos'),
  getEmergencies: () => read<EmergencyApiResponse>('emergencias'),
  getMobility: () => read<MobilityApiResponse>('movilidad'),
  getCulture: () => read<CultureApiResponse>('espacios'),
  getWaste: () => read<WasteApiResponse>('residuos'),
};
