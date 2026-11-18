import type { LoginApiResponse } from '../../api/types';
import type { AIAnalysisReport } from '../../types';

const demoDate = '2026-11-12';
const authEvents = ['LoginExitoso', 'TokenRenovado', 'SesionCerrada'];
const countsByDepartment = [
  { department: 'Atención Ciudadana', counts: [9, 21, 6] },
  { department: 'Espacios Verdes', counts: [4, 12, 3] },
  { department: 'Movilidad Urbana', counts: [7, 18, 5] },
];

function demoReport(
  domain: string,
  summary: string,
  highlights: string[],
  recommendations: string[],
  risks: string[],
): AIAnalysisReport {
  return {
    actualizado_en: demoDate,
    caso_de_uso: domain,
    ultima_semana: '2026-W46',
    analisis: [{
      semana: '2026-W46',
      metadata: { llm: { deployment: 'gpt-5-mini' } },
      resumen: {
        parrafo_ejecutivo: summary,
        puntos_destacados: highlights,
        recomendaciones: recommendations,
        riesgos: risks,
      },
    }],
  };
}

export const mockLoginDashboard: LoginApiResponse = {
  informe: demoReport(
    'Login Federado',
    'El corte de ejemplo registra 20 inicios exitosos, 51 renovaciones y 14 cierres. Atención Ciudadana concentra la mayor actividad.',
    ['Atención Ciudadana sumó 9 inicios y 21 renovaciones.'],
    ['Comparar la actividad por departamento con el siguiente corte.'],
    ['El corte no incluye intentos fallidos ni permite determinar sesiones activas.'],
  ),
  datos: countsByDepartment.flatMap(({ department, counts }) =>
    authEvents.map((event, index) => ({
      department,
      event_type: `com.citypass.auth.${event}`,
      cantidadEventos: counts[index],
      fecha_snapshot: demoDate,
    }))),
};
