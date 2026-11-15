import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const template = readFileSync('dist-embed/embed.html', 'utf8');
const csp = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: https:; font-src data:";
const date = new Date().toISOString();
const cases = [
  { module: 'reclamos', title: 'Tablero de Reclamos', metric: 'Total de Reclamos', row: {
    barrio: 'Palermo', categoria: 'Alumbrado', prioridad: 'Alta', origenClasificacion: 'Manual',
    estado_actual: 'cerrado', row_count: 17, tiempo_prom_hasta_estado_actual: 24,
  } },
  { module: 'emergencias', title: 'Tablero de Emergencias', metric: 'Total Emergencias', row: {
    estado_actual: 'Cerrado', prioridad: 'Alta', cantidadEmergencias: 17,
    tiempoPromRespuestaDespacho: 5, tiempoPromRespuestaLugar: 9,
  } },
  { module: 'movilidad', title: 'Tablero de Movilidad Urbana', metric: 'Viajes Acumulados', row: {
    fechaInicio: date, estacionInicio: 'Central', duracionViaje: '12 minutos',
    cantidadViajes: 17, duracionTotalViajes: 204, promDuracion: 12,
  } },
  { module: 'espacios', title: 'Espacios Públicos y Cultura', metric: 'Reservas Confirmadas', row: {
    recursoId: 'REC-1', tipoReserva: 'Presencial', categoria: 'Cultural', zona: 'Centro',
    cupoMaximo: 100, cantidadTotal: 20, cantidadConfirmadas: 17, cantidadCanceladas: 3,
    inscriptos: 17, pctOcupacion: 17,
  } },
  { module: 'residuos', title: 'Tablero de Residuos', metric: 'Total de Alertas', row: {
    zona: 'Centro', tipoAlerta: 'Contenedor lleno', prioridad: 'Alta', rangoNivelLlenado: '80-100%',
    cantidadAlertas: 17, cantidadResueltas: 12, tiempoPromResolucion: 35,
  } },
];

for (const { module, title, metric, row } of cases) {
  test(`${module}: renders injected data inside an opaque sandbox without network access`, async ({ page }) => {
    const errors: string[] = [];
    const unexpectedRequests: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const payload = {
      datos: [{ ...row, fecha_snapshot: date }],
      informe: {
        actualizado_en: date, caso_de_uso: module, semanas: ['2026-W46'], ultima_semana: '2026-W46',
        version_esquema: '1.0', analisis: [{
          semana: '2026-W46', metadata: {},
          resumen: {
            parrafo_ejecutivo: '</script><script>throw new Error("injected")</script>',
            puntos_destacados: ['Datos incluidos en el HTML'], recomendaciones: [], riesgos: [],
          },
        }],
      },
    };
    const html = template.replace('__CITYPASS_MODULO__', module)
      .replace('__CITYPASS_DATOS__', () => JSON.stringify(payload).replaceAll('<', '\\u003c'));
    await page.route('**/*', async (route) => {
      const url = route.request().url();
      if (url === 'http://citypass.test/') {
        await route.fulfill({ contentType: 'text/html', body: `
          <script>
            window.embedHeight = 0;
            addEventListener('message', e => {
              if (e.source === document.querySelector('iframe').contentWindow &&
                  e.data?.tipo === 'citypass-tablero-altura') window.embedHeight = e.data.altura;
            });
          </script>
          <iframe title="Analítica" sandbox="allow-scripts" src="/admin/analitica"
            style="width:1200px;height:1600px;border:0"></iframe>`,
        });
      } else if (url === 'http://citypass.test/admin/analitica') {
        await route.fulfill({
          contentType: 'text/html; charset=utf-8',
          headers: { 'Content-Security-Policy': csp, 'Cache-Control': 'private, no-store' },
          body: html,
        });
      } else {
        unexpectedRequests.push(url);
        await route.abort();
      }
    });
    await page.goto('http://citypass.test/');
    const frame = page.frameLocator('iframe');
    await expect(frame.getByRole('heading', { name: title, exact: true })).toBeVisible();
    const label = frame.getByText(metric, { exact: true });
    await expect(label).toBeVisible();
    await expect(frame.getByRole('article', { name: `KPI: ${metric}`, exact: true })).toContainText('17');
    await expect(frame.getByRole('alert')).toHaveCount(0);
    await expect(frame.getByRole('button', { name: 'Iniciar sesión' })).toHaveCount(0);
    await expect(frame.getByText('</script><script>throw new Error("injected")</script>', { exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as unknown as { embedHeight: number }).embedHeight))
      .toBeGreaterThan(0);
    expect(unexpectedRequests).toEqual([]);
    expect(errors).toEqual([]);
  });
}
