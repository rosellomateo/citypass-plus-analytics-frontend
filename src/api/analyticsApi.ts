import { apiGet } from './client';
import type { Domain } from '../types';

import type {
  ClaimsApiResponse,
  CultureApiResponse,
  CrossModuleResponse,
  EmergencyApiResponse,
  LoginApiResponse,
  MobilityApiResponse,
  WasteApiResponse,
} from './types';

export const analyticsApi = {
  getClaims: () => apiGet<ClaimsApiResponse>('/analytics/reclamos'),
  getEmergencies: () => apiGet<EmergencyApiResponse>('/analytics/seguridad-emergencias'),
  getMobility: () => apiGet<MobilityApiResponse>('/analytics/movilidad-urbana'),
  getCulture: () => apiGet<CultureApiResponse>('/analytics/espacios-cultura'),
  getWaste: () => apiGet<WasteApiResponse>('/analytics/residuos'),
  getLogin: () => apiGet<LoginApiResponse>('/analytics/identidad'),
  getCrossModuleMetrics: (area: Exclude<Domain, 'login'>) => apiGet<CrossModuleResponse>(`/analytics/${area}/parte2`),
};
