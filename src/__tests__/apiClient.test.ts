import { afterEach, describe, expect, it, vi } from 'vitest';
import { analyticsApi } from '../api/analyticsApi';
import { apiGet, getApiBaseUrl } from '../api/client';

const informeMock = {
  actualizado_en: '2026-09-24T12:00:00Z',
  caso_de_uso: 'reclamos',
  semanas: ['2026-W39'],
  ultima_semana: '2026-W39',
  version_esquema: '1.0',
  analisis: [{
    generado_en: '2026-09-24T12:00:00Z',
    semana: '2026-W39',
    metadata: {},
    resumen: {
      parrafo_ejecutivo: 'Los reclamos se concentran en alumbrado.',
      puntos_destacados: ['Se registraron 15 reclamos.'],
      recomendaciones: [],
      riesgos: [],
    },
  }],
};
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
      json: vi.fn().mockResolvedValue({ datos: [{ categoria: 'Alumbrado' }], informe: informeMock }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await apiGet<{ datos: Array<{ categoria: string }>; informe: typeof informeMock }>('/analytics/reclamos');

    expect(result).toEqual({ datos: [{ categoria: 'Alumbrado' }], informe: informeMock });
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
      json: vi.fn().mockResolvedValue({ datos: [], informe: informeMock }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await Promise.all([
      analyticsApi.getClaims(),
      analyticsApi.getEmergencies(),
      analyticsApi.getMobility(),
      analyticsApi.getCulture(),
      analyticsApi.getWaste(),

    ]);

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'http://localhost:8000/analytics/reclamos',
      'http://localhost:8000/analytics/seguridad-emergencias',
      'http://localhost:8000/analytics/movilidad-urbana',
      'http://localhost:8000/analytics/espacios-cultura',
      'http://localhost:8000/analytics/residuos',

    ]);
  });
});
