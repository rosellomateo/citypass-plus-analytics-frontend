import { getDashboardsForProfile } from './authorization';

export interface CityPassClaims {
  preferred_username: string;
  module: string;
  groups: string[];
}

export interface TokenPair { accessToken: string; refreshToken: string; expiresAt: number; }
export type LoginResult = 'success' | 'rejected' | 'invalid-token' | 'unavailable' | 'profile-unavailable';

type Authenticated = {
  status: 'authenticated';
  token: string;
  claims: CityPassClaims;
  dashboards: string[];
  initialDashboard?: string;
  version: number;
};
export type AuthSnapshot =
  | { status: 'anonymous' }
  | { status: 'verifying' }
  | Authenticated;

const IDP_URL = 'https://api.citypass-login.pp.ua';
const anonymous = { status: 'anonymous' } as const;
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

export function getAuthSnapshot(): AuthSnapshot {
  return snapshot;
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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string' && item.length > 0);
}

async function readTokenPair(response: Response): Promise<TokenPair | undefined> {
  const body: unknown = await response.json();
  if (!body || typeof body !== 'object') return undefined;
  const { access_token, refresh_token, expires_in } = body as Record<string, unknown>;
  if (typeof access_token !== 'string' || !access_token || typeof refresh_token !== 'string' || !refresh_token ||
      typeof expires_in !== 'number' || !Number.isSafeInteger(expires_in) || expires_in <= 0) {
    return undefined;
  }
  const expiresAt = Date.now() + expires_in * 1000;
  if (!Number.isSafeInteger(expiresAt)) return undefined;
  return { accessToken: access_token, refreshToken: refresh_token, expiresAt };
}

async function confirmToken(pair: TokenPair, version: number): Promise<LoginResult> {
  let body: unknown;
  try {
    const response = await fetch(`${getIdpBaseUrl()}/me`, {
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: `Bearer ${pair.accessToken}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status === 401 || response.status === 403) return 'invalid-token';
    if (!response.ok) return 'profile-unavailable';
    body = await response.json();
  } catch {
    return 'profile-unavailable';
  }
  if (!body || typeof body !== 'object') return 'profile-unavailable';
  const profile = body as Record<string, unknown>;
  const preferred_username = profile.uid ?? profile.preferred_username;
  const { module, groups } = profile;
  if (typeof preferred_username !== 'string' || !preferred_username.trim() ||
      typeof module !== 'string' || !module || !isStringArray(groups)) {
    return 'profile-unavailable';
  }
  if (pair.expiresAt <= Date.now() || version !== sessionVersion) {
    return 'invalid-token';
  }

  tokenPair = pair;
  clearTimeout(refreshTimer);
  const remainingMs = pair.expiresAt - Date.now();
  const delay = Math.max(remainingMs - 120_000, remainingMs / 2);
  refreshTimer = setTimeout(() => { void refreshTokenPair(); }, Math.max(1_000, delay));
  const dashboards = getDashboardsForProfile(module, groups);
  const initialDashboard = dashboards.find((area) => area === profile.initial_dashboard);
  publish({
    status: 'authenticated',
    token: pair.accessToken,
    claims: { preferred_username, module, groups },
    dashboards,
    initialDashboard,
    version,
  });
  return 'success';
}

function postJson(url: string, payload: object): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  });
}

export function authenticateWithIdp(username: string, password: string): Promise<LoginResult> {
  const endpoint = import.meta.env.VITE_AUTH_LOGIN_ENDPOINT?.trim() || `${getIdpBaseUrl()}/auth/login`;
  const clientId = import.meta.env.VITE_AUTH_CLIENT_ID?.trim() || 'citypass-analitica-web';
  return openSession(() => postJson(endpoint, { username, password, clientId }));
}

async function openSession(requestTokens: () => Promise<Response>): Promise<LoginResult> {
  clearTokenPair();
  const version = sessionVersion;
  publish({ status: 'verifying' });
  try {
    const response = await requestTokens();
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
