import type { WasteInputJson, AIAnalysisReport } from '../../types';
import rawWasteJson from './fixtures/waste_records.json';
import rawWasteSummary from './fixtures/waste_summary.json';

/**
 * JSON de ejemplo para el modo mock.
 */
export const mockWasteInputJson: WasteInputJson = rawWasteJson as WasteInputJson;
export const mockWasteAIReport: AIAnalysisReport = rawWasteSummary;
