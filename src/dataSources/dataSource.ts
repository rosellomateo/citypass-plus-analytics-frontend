import { isLocalPreview } from '../config/localPreview';

export type DataSource = 'api' | 'mock' | 'embedded';

export function getDataSource(): DataSource {
  if (isLocalPreview()) return 'mock';
  const value = import.meta.env.VITE_DATA_SOURCE?.trim().toLowerCase();

  if (value === 'api' || value === 'mock' || value === 'embedded') {
    return value;
  }

  throw new Error('VITE_DATA_SOURCE debe configurarse como "api", "mock" o "embedded".');
}
