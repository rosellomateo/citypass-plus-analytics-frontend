import { clearTokenPair, getAuthSnapshot, isAuthenticationEnabled, refreshTokenPair } from '../auth/session';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`La API respondió con estado ${status}.`);
    this.name = 'ApiError';
    this.status = status;
  }
}

export class AuthenticationError extends Error {
  constructor() {
    super('No hay una sesión válida para realizar esta solicitud.');
    this.name = 'AuthenticationError';
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
  const response = await apiGetResponse(path);
  if (response.status === 401 && isAuthenticationEnabled()) {
    const refreshed = await refreshTokenPair();
    if (!refreshed) throw new AuthenticationError();
    const retry = await apiGetResponse(path);
    if (!retry.ok) throw new ApiError(retry.status);
    return (await retry.json()) as T;
  }

  if (!response.ok) throw new ApiError(response.status);
  return (await response.json()) as T;
}

async function apiGetResponse(path: string): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (isAuthenticationEnabled()) {
    const session = getAuthSnapshot();
    if (session.status !== 'authenticated') {
      clearTokenPair();
      throw new AuthenticationError();
    }
    headers.Authorization = `Bearer ${session.token}`;
  }

  return fetch(`${getApiBaseUrl()}${path}`, {
    method: 'GET',
    headers,
  });
}
