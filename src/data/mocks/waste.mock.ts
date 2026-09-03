// src/data/mocks/waste.mock.ts
import type { WasteInputJson } from '../../types';
import rawWasteJson from '../../../testingDatos/waste_records.json';

/**
 * JSON mock de entrada provisional obtenido desde testingDatos/waste_records.json.
 * IMPORTANTE: La carpeta testingDatos será eliminada más adelante y reemplazada por la conexión con el backend.
 */
export const mockWasteInputJson: WasteInputJson = rawWasteJson as WasteInputJson;
