import { apiGet } from './client';

import type {
  ClaimsApiResponse,
  CultureApiResponse,
  EmergencyApiResponse,
  MobilityApiResponse,
  WasteApiResponse,
} from './types';

export const analyticsApi = {
  getClaims: () => apiGet<ClaimsApiResponse>('/analytics/reclamos'),
  getEmergencies: () => apiGet<EmergencyApiResponse>('/analytics/seguridad-emergencias'),
  getMobility: () => apiGet<MobilityApiResponse>('/analytics/movilidad-urbana'),
  getCulture: () => apiGet<CultureApiResponse>('/analytics/espacios-cultura'),
  getWaste: () => apiGet<WasteApiResponse>('/analytics/residuos'),
};
