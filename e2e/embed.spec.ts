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
  { module: 'movilidad', title: 'Tablero de Movilidad Urbana', metric: 'Afectaciones de estaciones', row: {
    causaTipo: 'EVENTO_CLIMATICO', cantidadAfectaciones: 17, estacionesAfectadasDistintas: 13,
    cantidadBloqueadas: 14, estacionesBloqueadasDistintas: 12, cantidadPreventivas: 0,
    cantidadRestauradas: 10, cantidadViajesInterrumpidos: 1,
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
  { module: 'identidad', title: 'Tablero de Login Federado', metric: 'Inicios de sesión exitosos', row: {
    department: 'Movilidad', event_type: 'com.citypass.auth.LoginExitoso', cantidadEventos: 17,
  } },
  // Parte 2 inyectado por el backend: el caso 5 se ve en el embed sin pedir nada a la red.
  { module: 'residuos', title: 'Tablero de Residuos', metric: 'Total de Alertas', row: {
    zona: 'Centro', tipoAlerta: 'Contenedor lleno', prioridad: 'Alta', rangoNivelLlenado: '80-100%',
    cantidadAlertas: 17, cantidadResueltas: 12, tiempoPromResolucion: 35,
  }, parte2: {
    fecha_snapshot: date.slice(0, 10), datos: [{ id: 'c5', valor: 1, detalle: [] }],
    resumen_gold: [{ id: 'waste-cause', titulo: 'Intervenciones por causa publicada', fecha_snapshot: date.slice(0, 10),
      puntos: [{ etiqueta: 'Operación normal', valor: 41 }, { etiqueta: 'Emergencia', valor: 1 }] }],
  }, expectText: 'Intervenciones por accidentes en bicicleta frente a alertas normales' },
  { module: 'identidad', title: 'Tablero de Login Federado', metric: 'Inicios de sesión exitosos', withoutReport: true, row: {
    department: 'Movilidad', event_type: 'com.citypass.auth.LoginExitoso', cantidadEventos: 17,
  } },
];

for (const scenario of cases) {
  const { module, title, metric, row } = scenario;
  const withoutReport = 'withoutReport' in scenario && scenario.withoutReport;
  const parte2 = 'parte2' in scenario ? scenario.parte2 : undefined;
  test(`${module}${withoutReport ? ' without AI report' : ''}${parte2 ? ' with Parte 2' : ''}: renders injected data inside an opaque sandbox without network access`, async ({ page }) => {
    const errors: string[] = [];
    const unexpectedRequests: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const payload = {
      datos: [{ ...row, fecha_snapshot: module === 'identidad' ? date.slice(0, 10) : date }],
      informe: withoutReport ? null : {
        actualizado_en: date, caso_de_uso: module, semanas: ['2026-W46'], ultima_semana: '2026-W46',
        version_esquema: '1.0', analisis: [{
          semana: '2026-W46', metadata: {},
          resumen: {
            parrafo_ejecutivo: '</script><script>throw new Error("injected")</script>',
            puntos_destacados: ['Datos incluidos en el HTML'], recomendaciones: [], riesgos: [],
          },
        }],
      },
      ...(parte2 ? { parte2 } : {}),
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
    const metricCard = frame.getByRole('article', { name: `KPI: ${metric}`, exact: true });
    await expect(metricCard.getByText(metric, { exact: true })).toBeVisible();
    await expect(metricCard).toContainText('17');
    await expect(frame.getByRole('alert')).toHaveCount(0);
    await expect(frame.getByRole('button', { name: 'Iniciar sesión' })).toHaveCount(0);
    if ('expectText' in scenario) {
      await expect(frame.getByText(scenario.expectText, { exact: true })).toBeVisible();
      await expect(frame.getByText('Intervenciones por causa publicada', { exact: true })).toBeVisible();
      await expect(frame.getByText('No se tienen datos suficientes como para formar el gráfico.')).toHaveCount(0);
    }
    if (!withoutReport) {
      await expect(frame.getByText('</script><script>throw new Error("injected")</script>', { exact: true })).toBeVisible();
    }
    await expect.poll(() => page.evaluate(() => (window as unknown as { embedHeight: number }).embedHeight))
      .toBeGreaterThan(0);
    expect(unexpectedRequests).toEqual([]);
    expect(errors).toEqual([]);
  });
}
