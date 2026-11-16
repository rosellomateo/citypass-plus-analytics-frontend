import { afterEach, describe, expect, it, vi } from 'vitest';
import { embeddedApi } from '../api/embeddedApi';
import { getClaimsAnalyticsData } from '../dataSources/analyticsDataSource';

afterEach(() => {
  document.body.innerHTML = '';
  delete document.documentElement.dataset.modulo;
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function inject(content: string, module = 'reclamos') {
  document.documentElement.dataset.modulo = module;
  const script = document.createElement('script');
  script.id = 'citypass-datos';
  script.type = 'application/json';
  script.textContent = content;
  document.body.append(script);
}

describe('embedded analytics', () => {
  it('reuses the claims adapter and injected report without fetching', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'embedded');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const informe = { analisis: [] };
    inject(JSON.stringify({ informe, datos: [{
      barrio: 'Palermo', categoria: 'Alumbrado', prioridad: 'Alta', origenClasificacion: 'Manual',
      estado_actual: 'cerrado', row_count: 17, tiempo_prom_hasta_estado_actual: 24,
      fecha_snapshot: new Date().toISOString(),
    }] }));
    const result = await getClaimsAnalyticsData({ dateRange: '30d' });
    expect(result.totalClaims).toBe(17);
    expect(result.aiReport).toEqual(informe);
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(embeddedApi.getWaste()).rejects.toThrow('otro módulo');
  });

  it.each(['__CITYPASS_DATOS__', '{', '{}', '{"datos":null,"informe":{}}'])
    ('rejects missing injection or invalid data: %s', async (content) => {
      inject(content);
      await expect(embeddedApi.getClaims()).rejects.toThrow();
    });

  it('rejects an absent payload', async () => {
    document.documentElement.dataset.modulo = 'reclamos';
    await expect(embeddedApi.getClaims()).rejects.toThrow('no trae datos');
  });

  it('reads identity data without fetching when the AI report is not available', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const payload = { datos: [{ department: 'Movilidad', event_type: 'com.citypass.auth.LoginExitoso',
      cantidadEventos: 17, fecha_snapshot: '2026-11-16' }], informe: null };
    inject(JSON.stringify(payload), 'identidad');
    await expect(embeddedApi.getLogin()).resolves.toEqual(payload);
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(embeddedApi.getClaims()).rejects.toThrow('otro módulo');
  });

  it('does not accept a null report for the other modules', async () => {
    inject(JSON.stringify({ datos: [], informe: null }));
    await expect(embeddedApi.getClaims()).rejects.toThrow('respuesta de analítica válida');
  });

  it('requires an explicit report field for identity, even if it is null', async () => {
    inject(JSON.stringify({ datos: [] }), 'identidad');
    await expect(embeddedApi.getLogin()).rejects.toThrow('respuesta de analítica válida');
  });
});
