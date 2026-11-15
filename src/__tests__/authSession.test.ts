import { afterEach, describe, expect, it, vi } from 'vitest';
import { canAccessArea, getDefaultAuthorizedPath } from '../auth/authorization';
import { authenticatePresentationTeam, authenticateWithIdp, clearTokenPair, getAuthSnapshot } from '../auth/session';

const idp = 'https://api.citypass-login.pp.ua/auth/login';
const api = 'https://analytics.citypass.local';

function signInResponse() {
  return { ok: true, json: async () => ({ access_token: 'access-from-idp', refresh_token: 'refresh-from-idp' }) };
}

function verifiedSession(dashboards: string[]) {
  return { ok: true, json: async () => ({
    preferred_username: 'jperez', module: 'reclamos', groups: ['operadores'], dashboards,
    expires_at: Date.now() / 1000 + 900,
  }) };
}

afterEach(() => {
  clearTokenPair();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('CityPass session', () => {
  it('uses the selected fixture only in the local presentation mode', async () => {
    vi.stubEnv('MODE', 'presentation');
    vi.stubEnv('VITE_DATA_SOURCE', 'mock');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({
      claims: { token: 'local-demo:claims', preferred_username: 'prueba-reclamos', module: 'reclamos', groups: ['operadores'], dashboards: ['claims'] },
    }) });
    vi.stubGlobal('fetch', fetchMock);

    await expect(authenticatePresentationTeam('claims')).resolves.toBe('success');
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith('/__presentation/sessions.json', { cache: 'no-store' });
    expect(getAuthSnapshot()).toMatchObject({ status: 'authenticated', dashboards: ['claims'] });
    vi.stubEnv('DEV', false);
    await expect(authenticatePresentationTeam('claims')).resolves.toBe('unconfigured');
  });

  it('sends the selected client to Login and trusts only dashboards returned by Analytics', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'api');
    vi.stubEnv('VITE_API_BASE_URL', api);
    const fetchMock = vi.fn().mockResolvedValueOnce(signInResponse()).mockResolvedValueOnce(verifiedSession(['claims']));
    vi.stubGlobal('fetch', fetchMock);

    await expect(authenticateWithIdp('jperez', 'correcta', 'citypass-reclamos-web')).resolves.toBe('success');
    expect(fetchMock).toHaveBeenNthCalledWith(1, idp, expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ username: 'jperez', password: 'correcta', clientId: 'citypass-reclamos-web' }),
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, api + '/auth/session', expect.objectContaining({
      headers: { Accept: 'application/json', Authorization: 'Bearer access-from-idp' },
    }));
    const session = getAuthSnapshot();
    expect(session.status).toBe('authenticated');
    if (session.status !== 'authenticated') throw new Error('Expected verified session');
    expect(getDefaultAuthorizedPath(session.dashboards)).toBe('/analytics/claims');
    expect(canAccessArea(session.dashboards, 'overview')).toBe(false);
    expect(canAccessArea(session.dashboards, 'login')).toBe(false);
  });

  it('keeps protected content inaccessible until Analytics accepts the token', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'api');
    vi.stubEnv('VITE_API_BASE_URL', api);
    let resolveVerification!: (response: { ok: boolean; status: number }) => void;
    const verification = new Promise<{ ok: boolean; status: number }>((resolve) => { resolveVerification = resolve; });
    const fetchMock = vi.fn().mockResolvedValueOnce(signInResponse()).mockReturnValueOnce(verification);
    vi.stubGlobal('fetch', fetchMock);
    const login = authenticateWithIdp('jperez', 'incorrecta', 'citypass-reclamos-web');

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(getAuthSnapshot().status).toBe('verifying');
    resolveVerification({ ok: false, status: 401 });
    await expect(login).resolves.toBe('invalid-token');
    expect(getAuthSnapshot().status).toBe('anonymous');
  });

  it('leaves a verified account with no dashboards without access to portal routes', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'api');
    vi.stubEnv('VITE_API_BASE_URL', api);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(signInResponse()).mockResolvedValueOnce(verifiedSession([])));
    await expect(authenticateWithIdp('jperez', 'correcta', 'citypass-reclamos-web')).resolves.toBe('success');
    expect(getAuthSnapshot()).toMatchObject({ status: 'authenticated', dashboards: [] });
    expect(getDefaultAuthorizedPath([])).toBeUndefined();
  });
});
