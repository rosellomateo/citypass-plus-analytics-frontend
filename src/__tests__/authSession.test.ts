import { afterEach, describe, expect, it, vi } from 'vitest';
import { canAccessArea, getDefaultAuthorizedPath } from '../auth/authorization';
import { authenticatePresentationTeam, authenticateWithIdp, clearTokenPair, getAuthSnapshot, logout } from '../auth/session';

const idp = 'https://api.citypass-login.pp.ua/auth/login';
const api = 'https://analytics.citypass.local';

function signInResponse(overrides: Record<string, unknown> = {}) {
  return { ok: true, json: async () => ({ access_token: 'access-from-idp', refresh_token: 'refresh-from-idp', expires_in: 900, ...overrides }) };
}

function ldapProfile(groups: string[] = ['operadores'], overrides: Record<string, unknown> = {}) {
  return { ok: true, json: async () => ({
    uid: 'jperez', cn: 'Juan Pérez', mail: 'jperez@example.test', module: 'reclamos', groups, ...overrides,
  }) };
}

afterEach(() => {
  clearTokenPair();
  vi.useRealTimers();
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

  it('defaults to the Analytics client and obtains the profile from LDAP /me, never Analytics', async () => {
    vi.stubEnv('VITE_AUTH_CLIENT_ID', '');
    vi.stubEnv('VITE_DATA_SOURCE', 'api');
    vi.stubEnv('VITE_API_BASE_URL', api);
    const fetchMock = vi.fn().mockResolvedValueOnce(signInResponse())
      .mockResolvedValueOnce(ldapProfile(['admin'], { module: 'analitica' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(authenticateWithIdp('jperez', 'correcta')).resolves.toBe('success');
    expect(fetchMock).toHaveBeenNthCalledWith(1, idp, expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ username: 'jperez', password: 'correcta', clientId: 'citypass-analitica-web' }),
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'https://api.citypass-login.pp.ua/me', expect.objectContaining({
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: 'Bearer access-from-idp' },
      cache: 'no-store',
    }));
    const session = getAuthSnapshot();
    expect(session.status).toBe('authenticated');
    if (session.status !== 'authenticated') throw new Error('Expected verified session');
    expect(session.claims).toEqual({ preferred_username: 'jperez', module: 'analitica', groups: ['admin'] });
    expect(getDefaultAuthorizedPath(session.dashboards)).toBe('/analytics');
    expect(canAccessArea(session.dashboards, 'overview')).toBe(true);
    expect(canAccessArea(session.dashboards, 'login')).toBe(true);
  });

  it('only opens an authorized initial dashboard', () => {
    expect(getDefaultAuthorizedPath(['overview', 'eda'], 'eda')).toBe('/analytics/eda');
    expect(getDefaultAuthorizedPath(['claims'], 'eda')).toBe('/analytics/claims');
  });

  it('uses an explicit client override while keeping profile verification in LDAP', async () => {
    vi.stubEnv('VITE_AUTH_CLIENT_ID', 'citypass-analitica-pruebas-web');
    const fetchMock = vi.fn().mockResolvedValueOnce(signInResponse()).mockResolvedValueOnce(ldapProfile());
    vi.stubGlobal('fetch', fetchMock);
    await expect(authenticateWithIdp('jperez', 'correcta')).resolves.toBe('success');
    expect(fetchMock).toHaveBeenNthCalledWith(1, idp, expect.objectContaining({
      body: JSON.stringify({ username: 'jperez', password: 'correcta', clientId: 'citypass-analitica-pruebas-web' }),
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'https://api.citypass-login.pp.ua/me', expect.anything());
  });

  it('uses an optional initial dashboard from the LDAP profile only within the visible areas', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(signInResponse())
      .mockResolvedValueOnce(ldapProfile(['admin'], { module: 'analitica', initial_dashboard: 'eda' })));
    await expect(authenticateWithIdp('analista', 'correcta')).resolves.toBe('success');
    const session = getAuthSnapshot();
    expect(session).toMatchObject({ status: 'authenticated', initialDashboard: 'eda' });
    if (session.status !== 'authenticated') throw new Error('Expected authenticated session');
    expect(getDefaultAuthorizedPath(session.dashboards, session.initialDashboard)).toBe('/analytics/eda');
  });

  it.each([undefined, 'overview', 'eda', '/analytics/login', 42])(
    'falls back to the visible dashboard when initial_dashboard is absent or unauthorized (%s)', async (initial_dashboard) => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(signInResponse())
        .mockResolvedValueOnce(ldapProfile(['operadores'], { initial_dashboard })));
      await expect(authenticateWithIdp('jperez', 'correcta')).resolves.toBe('success');
      const session = getAuthSnapshot();
      expect(session).toMatchObject({ status: 'authenticated', initialDashboard: undefined, dashboards: ['claims'] });
      if (session.status !== 'authenticated') throw new Error('Expected authenticated session');
      expect(getDefaultAuthorizedPath(session.dashboards, session.initialDashboard)).toBe('/analytics/claims');
    },
  );

  it('reports a missing LDAP profile endpoint as a profile service failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(signInResponse()).mockResolvedValueOnce({ ok: false, status: 404 }));
    await expect(authenticateWithIdp('jperez', 'correcta')).resolves.toBe('profile-unavailable');
    expect(getAuthSnapshot().status).toBe('anonymous');
  });

  it('distinguishes a login service failure from a profile failure', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: false, status: 503 });
    vi.stubGlobal('fetch', fetchMock);
    await expect(authenticateWithIdp('jperez', 'correcta')).resolves.toBe('unavailable');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getAuthSnapshot().status).toBe('anonymous');
  });

  it('reports a network failure in /me without blaming Analytics', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(signInResponse()).mockRejectedValueOnce(new TypeError('Failed to fetch')));
    await expect(authenticateWithIdp('jperez', 'correcta')).resolves.toBe('profile-unavailable');
    expect(getAuthSnapshot().status).toBe('anonymous');
  });

  it('reports a non-JSON response from /me as a profile failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(signInResponse())
      .mockResolvedValueOnce({ ok: true, json: async () => { throw new SyntaxError('Invalid JSON'); } }));
    await expect(authenticateWithIdp('jperez', 'correcta')).resolves.toBe('profile-unavailable');
    expect(getAuthSnapshot().status).toBe('anonymous');
  });

  it('keeps protected content inaccessible until LDAP accepts the token', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'api');
    vi.stubEnv('VITE_API_BASE_URL', api);
    let resolveVerification!: (response: { ok: boolean; status: number }) => void;
    const verification = new Promise<{ ok: boolean; status: number }>((resolve) => { resolveVerification = resolve; });
    const fetchMock = vi.fn().mockResolvedValueOnce(signInResponse()).mockReturnValueOnce(verification);
    vi.stubGlobal('fetch', fetchMock);
    const login = authenticateWithIdp('jperez', 'incorrecta');

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(getAuthSnapshot().status).toBe('verifying');
    resolveVerification({ ok: false, status: 401 });
    await expect(login).resolves.toBe('invalid-token');
    expect(getAuthSnapshot().status).toBe('anonymous');
  });

  it('leaves a verified account with no dashboards without access to portal routes', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'api');
    vi.stubEnv('VITE_API_BASE_URL', api);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(signInResponse()).mockResolvedValueOnce(ldapProfile([])));
    await expect(authenticateWithIdp('jperez', 'correcta')).resolves.toBe('success');
    expect(getAuthSnapshot()).toMatchObject({ status: 'authenticated', dashboards: [] });
    expect(getDefaultAuthorizedPath([])).toBeUndefined();
  });

  it('uses a configurable LDAP base URL independently from Analytics and the login endpoint', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '');
    vi.stubEnv('VITE_IDP_BASE_URL', 'https://ldap.example.test/');
    vi.stubEnv('VITE_AUTH_LOGIN_ENDPOINT', 'https://ldap.example.test/custom-login');
    const fetchMock = vi.fn().mockResolvedValueOnce(signInResponse()).mockResolvedValueOnce(ldapProfile());
    vi.stubGlobal('fetch', fetchMock);

    await expect(authenticateWithIdp('jperez', 'correcta')).resolves.toBe('success');
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'https://ldap.example.test/custom-login', 'https://ldap.example.test/me',
    ]);
  });

  it.each([undefined, '900', 0, -1, NaN, Infinity])('rejects an invalid expires_in (%s)', async (expiry) => {
    const fetchMock = vi.fn().mockResolvedValueOnce(signInResponse({ expires_in: expiry }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(authenticateWithIdp('jperez', 'correcta')).resolves.toBe('invalid-token');
    expect(getAuthSnapshot().status).toBe('anonymous');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('ignores unexpected dashboards in /me and uses only the configured module and group rules', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(signInResponse()).mockResolvedValueOnce({
      ok: true, json: async () => ({ uid: 'jperez', module: 'reclamos', groups: [], dashboards: ['overview', 'login'] }),
    }));
    await expect(authenticateWithIdp('jperez', 'correcta')).resolves.toBe('success');
    expect(getAuthSnapshot()).toMatchObject({ status: 'authenticated', dashboards: [] });
  });

  it.each([
    null,
    { uid: 'jperez', module: 'reclamos' },
    { uid: 'jperez', module: 'reclamos', groups: 'admin' },
    { uid: '', module: 'reclamos', groups: ['operadores'] },
    { uid: 'jperez', groups: ['operadores'] },
  ])('rejects a malformed LDAP profile (%j)', async (profile) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(signInResponse())
      .mockResolvedValueOnce({ ok: true, json: async () => profile }));
    await expect(authenticateWithIdp('jperez', 'correcta')).resolves.toBe('profile-unavailable');
    expect(getAuthSnapshot().status).toBe('anonymous');
  });

  it.each([[401, 'invalid-token'], [403, 'invalid-token'], [503, 'profile-unavailable']] as const)(
    'does not establish a session when /me returns %s', async (status, result) => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(signInResponse()).mockResolvedValueOnce({ ok: false, status }));
      await expect(authenticateWithIdp('jperez', 'correcta')).resolves.toBe(result);
      expect(getAuthSnapshot().status).toBe('anonymous');
    },
  );

  it('does not restore a session if logout completes while /me is pending', async () => {
    let resolveProfile!: (response: ReturnType<typeof ldapProfile>) => void;
    const profile = new Promise<ReturnType<typeof ldapProfile>>((resolve) => { resolveProfile = resolve; });
    const fetchMock = vi.fn().mockResolvedValueOnce(signInResponse()).mockReturnValueOnce(profile);
    vi.stubGlobal('fetch', fetchMock);
    const login = authenticateWithIdp('jperez', 'correcta');
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await logout();
    resolveProfile(ldapProfile());
    await expect(login).resolves.toBe('invalid-token');
    expect(getAuthSnapshot().status).toBe('anonymous');
  });

  it('refreshes before expires_in elapses and uses the rotated refresh token on logout', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(signInResponse())
      .mockResolvedValueOnce(ldapProfile())
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'new-access', refresh_token: 'new-refresh', expires_in: 900 }) })
      .mockResolvedValueOnce(ldapProfile())
      .mockResolvedValueOnce({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    await authenticateWithIdp('jperez', 'correcta');

    await vi.advanceTimersByTimeAsync(779_999);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchMock).toHaveBeenNthCalledWith(3, 'https://api.citypass-login.pp.ua/auth/refresh', expect.objectContaining({
      body: JSON.stringify({ refreshToken: 'refresh-from-idp' }),
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(4, 'https://api.citypass-login.pp.ua/me', expect.objectContaining({
      headers: { Accept: 'application/json', Authorization: 'Bearer new-access' },
    }));
    expect(getAuthSnapshot()).toMatchObject({ status: 'authenticated', token: 'new-access' });

    await logout();
    expect(fetchMock).toHaveBeenLastCalledWith('https://api.citypass-login.pp.ua/auth/logout', expect.objectContaining({
      body: JSON.stringify({ refreshToken: 'new-refresh' }),
    }));
  });
});
