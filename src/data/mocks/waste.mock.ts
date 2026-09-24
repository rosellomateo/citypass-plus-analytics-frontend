import type { WasteInputJson, AIAnalysisReport } from '../../types';
import rawWasteJson from '../../../testingDatos/waste_records.json';
import rawWasteSummary from '../../../testingDatos/waste_summary.json';

/**
 * JSON mock de entrada provisional obtenido desde testingDatos.
 * IMPORTANTE: La carpeta testingDatos será eliminada más adelante y reemplazada por la conexión con el backend.
 */
export const mockWasteInputJson: WasteInputJson = rawWasteJson as WasteInputJson;
export const mockWasteAIReport: AIAnalysisReport = rawWasteSummary;
