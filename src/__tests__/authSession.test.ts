import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearAccessToken, getAuthSnapshot, parseCityPassClaims, setAccessToken } from '../auth/session';

function token(payload: object) {
  return `header.${btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}.signature`;
}

afterEach(() => {
  clearAccessToken();
  vi.unstubAllEnvs();
});

describe('CityPass JWT boundary', () => {
  it('accepts the documented identity and group claims while the token is valid', () => {
    const value = token({ sub: 'U000042', module: 'seguridad-urbana', groups: ['analistas'], exp: Date.now() / 1000 + 60 });
    expect(parseCityPassClaims(value)).toMatchObject({ sub: 'U000042', groups: ['analistas'] });
  });

  it('rejects expired tokens and malformed permanent identifiers', () => {
    expect(parseCityPassClaims(token({ sub: 'U000042', module: 'seguridad-urbana', groups: [], exp: Date.now() / 1000 - 1 }))).toBeUndefined();
    expect(parseCityPassClaims(token({ sub: '42', module: 'seguridad-urbana', groups: [], exp: Date.now() / 1000 + 60 }))).toBeUndefined();
  });

  it('enforces the configured module and optional group before exposing a session', () => {
    vi.stubEnv('VITE_AUTH_ENABLED', 'true');
    vi.stubEnv('VITE_AUTH_MODULE', 'seguridad-urbana');
    vi.stubEnv('VITE_AUTH_REQUIRED_GROUP', 'analistas');
    setAccessToken(token({ sub: 'U000042', module: 'seguridad-urbana', groups: ['analistas'], exp: Date.now() / 1000 + 60 }));
    expect(getAuthSnapshot().status).toBe('authenticated');
    setAccessToken(token({ sub: 'U000042', module: 'otro-modulo', groups: ['analistas'], exp: Date.now() / 1000 + 60 }));
    expect(getAuthSnapshot().status).toBe('invalid');
  });
});
