export type DataSource = 'api' | 'embedded';

export function getDataSource(): DataSource {
  const value = import.meta.env.VITE_DATA_SOURCE?.trim().toLowerCase();

  if (!value || value === 'api') return 'api';
  if (value === 'embedded') {
    return value;
  }

  throw new Error('VITE_DATA_SOURCE debe configurarse como "api" o "embedded".');
}
