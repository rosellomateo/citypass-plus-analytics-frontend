export type DataSource = 'api' | 'mock';

export function getDataSource(): DataSource {
  const value = import.meta.env.VITE_DATA_SOURCE?.trim().toLowerCase();

  if (value === 'api' || value === 'mock') {
    return value;
  }

  throw new Error('VITE_DATA_SOURCE debe configurarse como "api" o "mock".');
}
