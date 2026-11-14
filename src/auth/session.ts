export interface CityPassClaims {
  preferred_username: string;
  module: string;
  groups: string[];
}

export interface TokenPair { accessToken: string; refreshToken: string; }
export type LoginResult = 'success' | 'rejected' | 'invalid-token' | 'unavailable';

type Authenticated = { status: 'authenticated'; token: string; claims: CityPassClaims; dashboards: string[]; version: number };
export type AuthSnapshot =
  | { status: 'disabled' }
  | { status: 'anonymous' }
  | { status: 'verifying' }
  | Authenticated;

const IDP_URL = 'https://api.citypass-login.pp.ua';
const anonymous = { status: 'anonymous' } as const;
const disabled = { status: 'disabled' } as const;
let snapshot: AuthSnapshot = anonymous;
let tokenPair: TokenPair | undefined;
let refreshInFlight: Promise<boolean> | undefined;
let refreshTimer: ReturnType<typeof setTimeout> | undefined;
let sessionVersion = 0;
const subscribers = new Set<() => void>();

function publish(next: AuthSnapshot) {
  snapshot = next;
  subscribers.forEach((subscriber) => subscriber());
}

export function isAuthenticationEnabled(): boolean {
  return import.meta.env.VITE_DATA_SOURCE !== 'mock';
}

export function getAuthSnapshot(): AuthSnapshot {
  return isAuthenticationEnabled() ? snapshot : disabled;
}

export function subscribeToAuth(callback: () => void): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

export function clearTokenPair(): void {
  sessionVersion += 1;
  clearTimeout(refreshTimer);
  refreshInFlight = undefined;
  tokenPair = undefined;
  publish(anonymous);
}

function getIdpBaseUrl(): string {
  return (import.meta.env.VITE_IDP_BASE_URL?.trim() || IDP_URL).replace(/\/$/, '');
}

function getVerificationUrl(): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || (import.meta.env.DEV ? 'http://localhost:8000' : '');
  if (!baseUrl) throw new Error('Falta configurar VITE_API_BASE_URL.');
  return `${baseUrl.replace(/\/$/, '')}/auth/session`;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string' && item.length > 0);
}

async function readTokenPair(response: Response): Promise<TokenPair | undefined> {
  const body: unknown = await response.json();
  if (!body || typeof body !== 'object') return undefined;
  const { access_token, refresh_token } = body as Record<string, unknown>;
  if (typeof access_token !== 'string' || !access_token || typeof refresh_token !== 'string' || !refresh_token) {
    return undefined;
  }
  return { accessToken: access_token, refreshToken: refresh_token };
}

async function confirmToken(pair: TokenPair, version: number): Promise<LoginResult> {
  const response = await fetch(getVerificationUrl(), {
    headers: { Accept: 'application/json', Authorization: `Bearer ${pair.accessToken}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) return response.status >= 500 ? 'unavailable' : 'invalid-token';
  const body: unknown = await response.json();
  if (!body || typeof body !== 'object') return 'invalid-token';
  const { preferred_username, module, groups, dashboards, expires_at } = body as Record<string, unknown>;
  if (typeof preferred_username !== 'string' || typeof module !== 'string' ||
      !isStringArray(groups) || !isStringArray(dashboards) ||
      typeof expires_at !== 'number' || !Number.isFinite(expires_at) || expires_at <= Date.now() / 1000 ||
      version !== sessionVersion) {
    return 'invalid-token';
  }

  tokenPair = pair;
  clearTimeout(refreshTimer);
  const remainingMs = expires_at * 1000 - Date.now();
  const delay = Math.max(remainingMs - 120_000, remainingMs / 2);
  refreshTimer = setTimeout(() => { void refreshTokenPair(); }, Math.max(1_000, delay));
  publish({
    status: 'authenticated',
    token: pair.accessToken,
    claims: { preferred_username, module, groups },
    dashboards,
    version,
  });
  return 'success';
}

export async function authenticateWithIdp(username: string, password: string, clientId: string): Promise<LoginResult> {
  clearTokenPair();
  const version = sessionVersion;
  publish({ status: 'verifying' });
  try {
    const response = await fetch(import.meta.env.VITE_AUTH_LOGIN_ENDPOINT?.trim() || `${getIdpBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, clientId }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return response.status >= 500 ? 'unavailable' : 'rejected';
    const pair = await readTokenPair(response);
    return pair ? await confirmToken(pair, version) : 'invalid-token';
  } catch {
    return 'unavailable';
  } finally {
    if (version === sessionVersion && snapshot.status === 'verifying') clearTokenPair();
  }
}

async function doRefresh(pair: TokenPair, version: number): Promise<boolean> {
  try {
    const response = await fetch(`${getIdpBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: pair.refreshToken }),
      signal: AbortSignal.timeout(10_000),
    });
    const nextPair = response.ok ? await readTokenPair(response) : undefined;
    if (nextPair && await confirmToken(nextPair, version) === 'success') return true;
  } catch { /* A failed refresh ends the session. */ }
  if (version === sessionVersion) clearTokenPair();
  return false;
}

export function refreshTokenPair(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  if (!tokenPair) return Promise.resolve(false);
  const version = sessionVersion;
  refreshInFlight = doRefresh(tokenPair, version).finally(() => {
    if (version === sessionVersion) refreshInFlight = undefined;
  });
  return refreshInFlight;
}

export async function logout(): Promise<void> {
  const refreshToken = tokenPair?.refreshToken;
  clearTokenPair();
  if (!refreshToken) return;
  try {
    await fetch(`${getIdpBaseUrl()}/auth/logout`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch { /* Local logout is already complete. */ }
}
