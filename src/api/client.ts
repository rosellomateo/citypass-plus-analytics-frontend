import { clearTokenPair, getAuthSnapshot, requiresApiToken, refreshTokenPair } from '../auth/session';

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
  const initialSession = getAuthSnapshot();
  const response = await apiGetResponse(path);
  if (response.status === 401 && requiresApiToken()) {
    const currentSession = getAuthSnapshot();
    const refreshed = currentSession.status === 'authenticated' && initialSession.status === 'authenticated' &&
      currentSession.version === initialSession.version &&
      (initialSession !== currentSession || await refreshTokenPair());
    if (!refreshed) throw new AuthenticationError();
    const verifiedSession = getAuthSnapshot();
    if (verifiedSession.status !== 'authenticated' || verifiedSession.version !== initialSession.version) throw new AuthenticationError();
    const retry = await apiGetResponse(path);
    if (retry.status === 401 && getAuthSnapshot() === verifiedSession) clearTokenPair();
    if (!retry.ok) throw new ApiError(retry.status);
    return (await retry.json()) as T;
  }

  if (!response.ok) throw new ApiError(response.status);
  return (await response.json()) as T;
}

async function apiGetResponse(path: string): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (requiresApiToken()) {
    const session = getAuthSnapshot();
    if (session.status !== 'authenticated') {
      clearTokenPair();
      throw new AuthenticationError();
    }
    if (session.token.startsWith('local-demo:')) throw new AuthenticationError();
    headers.Authorization = `Bearer ${session.token}`;
  }

  return fetch(`${getApiBaseUrl()}${path}`, {
    method: 'GET',
    headers,
  });
}
