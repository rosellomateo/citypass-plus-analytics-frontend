export class ApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`La API respondió con estado ${status}.`);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getApiBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!baseUrl) {
    throw new Error('Falta configurar VITE_API_BASE_URL.');
  }
  return baseUrl.replace(/\/$/, '');
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  return (await response.json()) as T;
}
