import type { CrossModuleResponse, LoginApiResponse } from '../../api/types';

const demoDate = '2026-11-12';
const authEvents = ['LoginExitoso', 'TokenRenovado', 'SesionCerrada'];

const countsByDepartment = [
  { department: 'Atención Ciudadana', counts: [9, 21, 6] },
  { department: 'Espacios Verdes', counts: [4, 12, 3] },
  { department: 'Movilidad Urbana', counts: [7, 18, 5] },
];

export const mockLoginDashboard: LoginApiResponse = {
  informe: null,
  datos: countsByDepartment.flatMap(({ department, counts }) =>
    authEvents.map((event, index) => ({
      department,
      event_type: `com.citypass.auth.${event}`,
      cantidadEventos: counts[index],
      fecha_snapshot: demoDate,
    })),
  ),
};

export const mockCoordinationDashboards: Record<'eda' | 'dap', CrossModuleResponse> = {
  eda: {
    fecha_snapshot: demoDate,
    datos: [
      { id: 'received', etiqueta: 'Eventos recibidos', valor: 1240 },
      { id: 'delivered', etiqueta: 'Eventos distribuidos', valor: 1226 },
      { id: 'pending', etiqueta: 'Eventos pendientes', valor: 14 },
    ],
  },
  dap: {
    fecha_snapshot: demoDate,
    datos: [
      { id: 'published', etiqueta: 'Comunicaciones publicadas', valor: 26 },
      { id: 'scheduled', etiqueta: 'Comunicaciones programadas', valor: 8 },
    ],
  },
};
