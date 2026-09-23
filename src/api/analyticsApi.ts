import { apiGet } from './client';
import type {
  ClaimApiRecord,
  CultureApiRecord,
  EmergencyApiRecord,
  EventApiRecord,
  MobilityApiRecord,
  WasteApiRecord,
} from './types';

export const analyticsApi = {
  getClaims: () => apiGet<ClaimApiRecord[]>('/analytics/reclamos'),
  getEmergencies: () =>
    apiGet<EmergencyApiRecord[]>('/analytics/seguridad-emergencias'),
  getMobility: () => apiGet<MobilityApiRecord[]>('/analytics/movilidad-urbana'),
  getCulture: () => apiGet<CultureApiRecord[]>('/analytics/espacios-cultura'),
  getWaste: () => apiGet<WasteApiRecord[]>('/analytics/residuos'),
  getEvent: () => apiGet<EventApiRecord>('/analytics/eventos'),
};
