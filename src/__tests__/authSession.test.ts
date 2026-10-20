import { afterEach, describe, expect, it, vi } from 'vitest';
import { canAccessArea, getDefaultAuthorizedPath } from '../auth/authorization';
import { clearTokenPair, getAuthSnapshot, parseCityPassClaims, setTokenPair } from '../auth/session';

function token(overrides: object = {}) {
  const payload = {
    iss: 'https://idp.citypass.local', sub: 'U000042', aud: ['citypass-analytics-api'], token_use: 'human', ver: 1,
    preferred_username: 'jperez', module: 'seguridad-urbana', groups: ['seguridad-urbana'],
    iat: Date.now() / 1000 - 10, exp: Date.now() / 1000 + 60, jti: 'test-token', ...overrides,
  };
  return `header.${btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}.signature`;
}

afterEach(() => { clearTokenPair(); vi.unstubAllEnvs(); });

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
});
