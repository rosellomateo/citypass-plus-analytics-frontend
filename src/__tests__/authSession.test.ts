import { afterEach, describe, expect, it, vi } from 'vitest';
import { canAccessArea, getDefaultAuthorizedPath } from '../auth/authorization';
import { authenticateWithIdp, clearTokenPair, getAuthSnapshot, parseCityPassClaims, setTokenPair, verifySessionWithBackend } from '../auth/session';

function token(overrides: object = {}) {
  const payload = {
    iss: 'https://idp.citypass.local', sub: 'U000042', aud: ['citypass-analytics-api'], token_use: 'human', ver: 1,
    preferred_username: 'jperez', module: 'seguridad-urbana', groups: ['seguridad-urbana'],
    iat: Date.now() / 1000 - 10, exp: Date.now() / 1000 + 60, jti: 'test-token', ...overrides,
  };
  return `header.${btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}.signature`;
}

afterEach(() => { clearTokenPair(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('CityPass JWT boundary', () => {
  it('accepts the complete documented human-token contract while valid', () => {
    expect(parseCityPassClaims(token())).toMatchObject({ sub: 'U000042', aud: ['citypass-analytics-api'], token_use: 'human', ver: 1 });
  });

  it('rejects expired tokens and incomplete contract claims', () => {
    expect(parseCityPassClaims(token({ exp: Date.now() / 1000 - 1 }))).toBeUndefined();
    expect(parseCityPassClaims(token({ aud: 'citypass-analytics-api' }))).toBeUndefined();
    expect(parseCityPassClaims(token({ token_use: 'service' }))).toBeUndefined();
  });

  it('exposes a valid pair only when authentication is enabled', () => {
    vi.stubEnv('VITE_AUTH_ENABLED', 'true');
    expect(setTokenPair({ accessToken: token(), refreshToken: 'opaque-refresh-token' })).toBe(true);
    expect(getAuthSnapshot().status).toBe('authenticated');
  });

  it('maps only known groups to their permitted dashboards', () => {
    const security = parseCityPassClaims(token())!;
    const global = parseCityPassClaims(token({ groups: ['analitica-urbana'] }))!;
    expect(canAccessArea(security, 'emergencies')).toBe(true);
    expect(canAccessArea(security, 'culture')).toBe(false);
    expect(getDefaultAuthorizedPath(security)).toBe('/analytics/emergencies');
    expect(canAccessArea(global, 'overview')).toBe(true);
    expect(canAccessArea(global, 'waste')).toBe(true);
  });

  it('delegates credentials to the IdP and keeps only the returned token pair', async () => {
    vi.stubEnv('VITE_AUTH_ENABLED', 'true');
    vi.stubEnv('VITE_AUTH_CLIENT_ID', 'citypass-analytics-web');
    vi.stubEnv('VITE_AUTH_LOGIN_ENDPOINT', 'https://login.citypass.local/auth/login');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ access_token: token(), refresh_token: 'opaque-refresh-token' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(authenticateWithIdp('jperez', 'correcta')).resolves.toBe('success');
    expect(fetchMock).toHaveBeenCalledWith('https://login.citypass.local/auth/login', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'jperez', password: 'correcta', client_id: 'citypass-analytics-web' }),
    });
    expect(getAuthSnapshot().status).toBe('authenticated');
  });

  it('uses the optional backend endpoint to confirm an authenticated session', async () => {
    vi.stubEnv('VITE_AUTH_ENABLED', 'true');
    vi.stubEnv('VITE_AUTH_VERIFY_ENDPOINT', 'https://analytics.citypass.local/auth/verify');
    setTokenPair({ accessToken: token(), refreshToken: 'opaque-refresh-token' });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await expect(verifySessionWithBackend()).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith('https://analytics.citypass.local/auth/verify', {
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: expect.stringMatching(/^Bearer /) },
    });
  });
});
