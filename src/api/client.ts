import { getAuthSnapshot, isAuthenticationEnabled } from '../auth/session';

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
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (isAuthenticationEnabled()) {
    const session = getAuthSnapshot();
    if (session.status !== 'authenticated') throw new AuthenticationError();
    headers.Authorization = `Bearer ${session.token}`;
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  return (await response.json()) as T;
}
