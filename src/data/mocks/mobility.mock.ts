// src/data/mocks/mobility.mock.ts
import type { BackendMobilityRecord, MobilityLLMReport } from '../../types';

import rawMobilityAnalytics from '../../../testingDatos/mobility_analytics.json';
import rawMobilitySummary from '../../../testingDatos/mobility_summary.json';

export const mockMobilityRecords: BackendMobilityRecord[] = rawMobilityAnalytics as BackendMobilityRecord[];
export const mockMobilityLLMReport: MobilityLLMReport = rawMobilitySummary as unknown as MobilityLLMReport;
