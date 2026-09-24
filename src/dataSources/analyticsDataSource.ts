import {
  getApiClaimsAnalyticsData,
  getApiCultureAnalyticsData,
  getApiEmergencyAnalyticsData,
  getApiMobilityAnalyticsData,
  getApiWasteAnalyticsData,
} from './apiAnalyticsDataSource';
import { getDataSource } from './dataSource';
import {
  getClaimsAnalyticsData as getMockClaimsAnalyticsData,
  getFilteredClaimRecords,
} from '../services/claimsService';
import { getCultureAnalyticsData as getMockCultureAnalyticsData } from '../services/cultureService';
import { getEmergencyAnalyticsData as getMockEmergencyAnalyticsData } from '../services/emergencyService';
import { getMobilityAnalyticsData as getMockMobilityAnalyticsData } from '../services/mobilityService';
import { getWasteAnalyticsData as getMockWasteAnalyticsData } from '../services/wasteService';
import type { DashboardFilters } from '../types';

export async function getClaimsAnalyticsData(filters: DashboardFilters) {
  if (getDataSource() === 'api') {
    return getApiClaimsAnalyticsData(filters);
  }

  const analytics = await getMockClaimsAnalyticsData(filters);
  return { ...analytics, records: getFilteredClaimRecords(filters) };
}

export function getEmergencyAnalyticsData(filters: DashboardFilters) {
  return getDataSource() === 'api'
    ? getApiEmergencyAnalyticsData(filters)
    : getMockEmergencyAnalyticsData(filters);
}

export function getMobilityAnalyticsData(filters: DashboardFilters) {
  return getDataSource() === 'api'
    ? getApiMobilityAnalyticsData(filters)
    : getMockMobilityAnalyticsData(filters);
}

export function getCultureAnalyticsData(filters: DashboardFilters) {
  return getDataSource() === 'api'
    ? getApiCultureAnalyticsData(filters)
    : getMockCultureAnalyticsData(filters);
}

export async function getWasteAnalyticsData(filters: DashboardFilters) {
  if (getDataSource() === 'api') {
    return getApiWasteAnalyticsData(filters);
  }

  const metrics = await getMockWasteAnalyticsData(filters);
  return { ...metrics, mode: 'mock' as const };
}
