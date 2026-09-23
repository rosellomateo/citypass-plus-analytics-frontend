import { afterEach, describe, expect, it, vi } from 'vitest';
import { analyticsApi } from '../api/analyticsApi';
import { apiGet, getApiBaseUrl } from '../api/client';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('API client', () => {
  it('uses VITE_API_BASE_URL and removes its trailing slash', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8000/');

    expect(getApiBaseUrl()).toBe('http://localhost:8000');
  });

  it('fails clearly when VITE_API_BASE_URL is missing', () => {
    vi.stubEnv('VITE_API_BASE_URL', '');

    expect(() => getApiBaseUrl()).toThrow('Falta configurar VITE_API_BASE_URL.');
  });

  it('performs a GET request and returns JSON', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8000');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue([{ categoria: 'Alumbrado' }]),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await apiGet<Array<{ categoria: string }>>('/analytics/reclamos');

    expect(result).toEqual([{ categoria: 'Alumbrado' }]);
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/analytics/reclamos', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
  });

  it('exposes the HTTP status when the API rejects a request', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8000');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));

    const request = apiGet('/analytics/reclamos');

    await expect(request).rejects.toMatchObject({ status: 503, name: 'ApiError' });
  });

  it('defines the current backend endpoint paths', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8000');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue([]),
    });
    vi.stubGlobal('fetch', fetchMock);

    await Promise.all([
      analyticsApi.getClaims(),
      analyticsApi.getEmergencies(),
      analyticsApi.getMobility(),
      analyticsApi.getCulture(),
      analyticsApi.getWaste(),
      analyticsApi.getEvent(),
    ]);

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'http://localhost:8000/analytics/reclamos',
      'http://localhost:8000/analytics/seguridad-emergencias',
      'http://localhost:8000/analytics/movilidad-urbana',
      'http://localhost:8000/analytics/espacios-cultura',
      'http://localhost:8000/analytics/residuos',
      'http://localhost:8000/analytics/eventos',
    ]);
  });
});
