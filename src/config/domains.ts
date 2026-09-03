// src/config/domains.ts
import type { Domain } from '../types';

export interface DomainNavMeta {
  domain: Domain;
  label: string;
  shortDescription: string;
  path: string;
  color: string;
  bgColor: string;
  isPending?: boolean;
}

export const DOMAIN_NAV_ITEMS: DomainNavMeta[] = [
  {
    domain: 'claims',
    label: 'Reclamos',
    shortDescription: 'Conteo por categoría, estado y medición del tiempo medio de resolución.',
    path: '/analytics/claims',
    color: '#D99838',
    bgColor: '#FDF5E6',
  },
  {
    domain: 'emergencies',
    label: 'Emergencias',
    shortDescription: 'Monitoreo de emergencias por estado, prioridad y medición del tiempo de despacho.',
    path: '/analytics/emergencies',
    color: '#C83E4D',
    bgColor: '#FDEEF0',
  },
  {
    domain: 'mobility',
    label: 'Movilidad',
    shortDescription: 'Conteo de viajes por estación de origen, franja horaria y duración promedio.',
    path: '/analytics/mobility',
    color: '#2563A6',
    bgColor: '#EBF3FC',
  },
  {
    domain: 'culture',
    label: 'Espacios Públicos y Cultura',
    shortDescription: 'Análisis de ocupación de espacios y convocatoria a eventos comunitarios.',
    path: '/analytics/culture',
    color: '#8FB8D8',
    bgColor: '#EFF5FB',
  },
  {
    domain: 'waste',
    label: 'Residuos',
    shortDescription: 'Seguimiento analítico de vaciado, volumen recolectado y contenedores críticos.',
    path: '/analytics/waste',
    color: '#4F8A72',
    bgColor: '#EAF4EF',
  },
];

export const DOMAIN_CONFIG: Record<string, DomainNavMeta> = DOMAIN_NAV_ITEMS.reduce((acc, item) => {
  acc[item.domain] = item;
  return acc;
}, {} as Record<string, DomainNavMeta>);

