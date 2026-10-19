/** Boundary with the CityPass+ login application. The API remains responsible
 * for JWT signature, issuer, audience and authorization validation. */
export interface CityPassClaims {
  sub: string;
  module: string;
  groups: string[];
  exp: number;
}

export type AuthSnapshot =
  | { status: 'disabled' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; token: string; claims: CityPassClaims }
  | { status: 'invalid' };

let accessToken: string | undefined;
let listenerInstalled = false;
const subscribers = new Set<() => void>();

function notify() { subscribers.forEach((subscriber) => subscriber()); }

function decodeBase64Url(value: string): string | undefined {
  try {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
    return atob(padded);
  } catch { return undefined; }
}

export function parseCityPassClaims(token: string): CityPassClaims | undefined {
  const encodedPayload = token.split('.')[1];
  if (!encodedPayload) return undefined;
  const payload = decodeBase64Url(encodedPayload);
  if (!payload) return undefined;
  try {
    const claims: unknown = JSON.parse(payload);
    if (!claims || typeof claims !== 'object') return undefined;
    const { sub, module, groups, exp } = claims as Record<string, unknown>;
    if (
      typeof sub !== 'string' || !/^U\d+$/.test(sub) ||
      typeof module !== 'string' ||
      !Array.isArray(groups) || !groups.every((group) => typeof group === 'string') ||
      typeof exp !== 'number' || !Number.isFinite(exp) || exp <= Date.now() / 1000
    ) return undefined;
    return { sub, module, groups, exp };
  } catch { return undefined; }
}

export function isAuthenticationEnabled(): boolean {
  return import.meta.env.VITE_AUTH_ENABLED === 'true';
}

export function getAuthSnapshot(): AuthSnapshot {
  if (!isAuthenticationEnabled()) return { status: 'disabled' };
  if (!accessToken) return { status: 'anonymous' };
  const claims = parseCityPassClaims(accessToken);
  if (!claims) return { status: 'invalid' };
  const requiredModule = import.meta.env.VITE_AUTH_MODULE?.trim();
  const requiredGroup = import.meta.env.VITE_AUTH_REQUIRED_GROUP?.trim();
  if ((requiredModule && claims.module !== requiredModule) || (requiredGroup && !claims.groups.includes(requiredGroup))) return { status: 'invalid' };
  return { status: 'authenticated', token: accessToken, claims };
}

/** Called by the Login integration after it obtains a fresh access token. */
export function setAccessToken(token: string): void { accessToken = token; notify(); }
export function clearAccessToken(): void { accessToken = undefined; notify(); }
export function subscribeToAuth(callback: () => void): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

/** Tokens are intentionally never read from URL or browser storage. */
export function installLoginMessageListener(): void {
  if (listenerInstalled || !isAuthenticationEnabled()) return;
  listenerInstalled = true;
  const trustedOrigin = import.meta.env.VITE_AUTH_LOGIN_ORIGIN?.trim();
  if (!trustedOrigin) return;
  window.addEventListener('message', (event: MessageEvent<unknown>) => {
    if (event.origin !== trustedOrigin || !event.data || typeof event.data !== 'object') return;
    const message = event.data as { type?: unknown; token?: unknown };
    if (message.type === 'citypass.auth.token' && typeof message.token === 'string') setAccessToken(message.token);
  });
}
