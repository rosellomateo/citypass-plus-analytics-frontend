/**
 * Boundary with CityPass+ Login. JWT signatures are verified by the API with
 * the IdP JWKS; client-side parsing only controls the user interface.
 */
export interface CityPassClaims {
  iss: string;
  sub: string;
  aud: string[];
  token_use: 'human';
  ver: 1;
  preferred_username: string;
  module: string;
  groups: string[];
  iat: number;
  exp: number;
  jti: string;
}

export interface TokenPair { accessToken: string; refreshToken: string; }

export type LoginResult = 'success' | 'rejected' | 'invalid-token' | 'unavailable';

export type AuthSnapshot =
  | { status: 'disabled' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; token: string; claims: CityPassClaims }
  | { status: 'invalid' };

let tokenPair: TokenPair | undefined;
let listenerInstalled = false;
let refreshInFlight: Promise<boolean> | undefined;
const subscribers = new Set<() => void>();

function notify() { subscribers.forEach((subscriber) => subscriber()); }

function decodeBase64Url(value: string): string | undefined {
  try {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
    return atob(padded);
  } catch { return undefined; }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

export function parseCityPassClaims(token: string): CityPassClaims | undefined {
  const encodedPayload = token.split('.')[1];
  if (!encodedPayload) return undefined;
  const payload = decodeBase64Url(encodedPayload);
  if (!payload) return undefined;
  try {
    const claims: unknown = JSON.parse(payload);
    if (!claims || typeof claims !== 'object') return undefined;
    const { iss, sub, aud, token_use, ver, preferred_username, module, groups, iat, exp, jti } = claims as Record<string, unknown>;
    if (
      !isNonEmptyString(iss) || !isNonEmptyString(sub) || !/^U\d+$/.test(sub) || !Array.isArray(aud) || !aud.every(isNonEmptyString) ||
      token_use !== 'human' || ver !== 1 || !isNonEmptyString(preferred_username) || !isNonEmptyString(module) ||
      !Array.isArray(groups) || !groups.every(isNonEmptyString) || typeof iat !== 'number' || !Number.isFinite(iat) ||
      typeof exp !== 'number' || !Number.isFinite(exp) || exp <= Date.now() / 1000 || !isNonEmptyString(jti)
    ) return undefined;
    return { iss, sub, aud, token_use, ver, preferred_username, module, groups, iat, exp, jti };
  } catch { return undefined; }
}

export function isAuthenticationEnabled(): boolean { return import.meta.env.VITE_AUTH_ENABLED === 'true'; }

export function getAuthSnapshot(): AuthSnapshot {
  if (!isAuthenticationEnabled()) return { status: 'disabled' };
  if (!tokenPair) return { status: 'anonymous' };
  const claims = parseCityPassClaims(tokenPair.accessToken);
  return claims ? { status: 'authenticated', token: tokenPair.accessToken, claims } : { status: 'invalid' };
}

/** Login must provide the newest pair together; neither token is persisted. */
export function setTokenPair(pair: TokenPair): boolean {
  if (!parseCityPassClaims(pair.accessToken) || !isNonEmptyString(pair.refreshToken)) return false;
  tokenPair = pair;
  notify();
  return true;
}

/** Test/support entrypoint. Requests that need refresh still require a real pair. */
export function setAccessToken(token: string): void { setTokenPair({ accessToken: token, refreshToken: 'not-refreshable' }); }
export function clearTokenPair(): void { tokenPair = undefined; notify(); }
export const clearAccessToken = clearTokenPair;

export function subscribeToAuth(callback: () => void): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

function getIdpBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_IDP_BASE_URL?.trim();
  if (!baseUrl) throw new Error('Falta configurar VITE_IDP_BASE_URL.');
  return baseUrl.replace(/\/$/, '');
}

function getClientId(): string {
  const clientId = import.meta.env.VITE_AUTH_CLIENT_ID?.trim();
  if (!clientId) throw new Error('Falta configurar VITE_AUTH_CLIENT_ID.');
  return clientId;
}

function getLoginEndpoint(): string {
  const endpoint = import.meta.env.VITE_AUTH_LOGIN_ENDPOINT?.trim();
  if (!endpoint) throw new Error('Falta configurar VITE_AUTH_LOGIN_ENDPOINT.');
  return endpoint;
}

/**
 * Delegates credential verification to the CityPass+ IdP. This module never
 * validates, stores or interprets a password beyond this one request.
 */
export async function authenticateWithIdp(username: string, password: string): Promise<LoginResult> {
  try {
    const response = await fetch(getLoginEndpoint(), {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, client_id: getClientId() }),
    });
    if (!response.ok) return 'rejected';
    const body: unknown = await response.json();
    if (!body || typeof body !== 'object') return 'invalid-token';
    const { access_token, refresh_token } = body as Record<string, unknown>;
    return setTokenPair({ accessToken: String(access_token ?? ''), refreshToken: String(refresh_token ?? '') })
      ? 'success'
      : 'invalid-token';
  } catch {
    return 'unavailable';
  }
}

/**
 * Optional handshake with the Analytics backend. The endpoint is configurable
 * until Backend publishes its contract; data endpoints must still verify JWTs.
 */
export async function verifySessionWithBackend(): Promise<boolean> {
  const endpoint = import.meta.env.VITE_AUTH_VERIFY_ENDPOINT?.trim();
  if (!endpoint) return true;
  const session = getAuthSnapshot();
  if (session.status !== 'authenticated') return false;
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: `Bearer ${session.token}` },
    });
    if (response.ok) return true;
  } catch { /* A failed handshake is treated as a denied session. */ }
  clearTokenPair();
  return false;
}

async function doRefresh(): Promise<boolean> {
  if (!tokenPair) return false;
  try {
    const response = await fetch(`${getIdpBaseUrl()}/auth/refresh`, {
      method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: tokenPair.refreshToken }),
    });
    if (!response.ok) { clearTokenPair(); return false; }
    const body: unknown = await response.json();
    if (!body || typeof body !== 'object') { clearTokenPair(); return false; }
    const { access_token, refresh_token } = body as Record<string, unknown>;
    if (!setTokenPair({ accessToken: String(access_token ?? ''), refreshToken: String(refresh_token ?? '') })) {
      clearTokenPair();
      return false;
    }
    return true;
  } catch { clearTokenPair(); return false; }
}

/** Rotates the pair once, preventing concurrent requests from reusing a refresh token. */
export function refreshTokenPair(): Promise<boolean> {
  if (!refreshInFlight) refreshInFlight = doRefresh().finally(() => { refreshInFlight = undefined; });
  return refreshInFlight;
}

export async function logout(): Promise<void> {
  const refreshToken = tokenPair?.refreshToken;
  clearTokenPair();
  if (!refreshToken) return;
  try {
    await fetch(`${getIdpBaseUrl()}/auth/logout`, {
      method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch { /* Local logout still succeeds when the IdP is unavailable. */ }
}

/** Tokens are deliberately never read from URL or browser storage. */
export function installLoginMessageListener(): void {
  if (listenerInstalled || !isAuthenticationEnabled()) return;
  listenerInstalled = true;
  const trustedOrigin = import.meta.env.VITE_AUTH_LOGIN_ORIGIN?.trim();
  if (!trustedOrigin) return;
  window.addEventListener('message', (event: MessageEvent<unknown>) => {
    if (event.origin !== trustedOrigin || !event.data || typeof event.data !== 'object') return;
    const message = event.data as { type?: unknown; access_token?: unknown; refresh_token?: unknown };
    if (message.type === 'citypass.auth.tokens' && typeof message.access_token === 'string' && typeof message.refresh_token === 'string') {
      setTokenPair({ accessToken: message.access_token, refreshToken: message.refresh_token });
    }
  });
}
