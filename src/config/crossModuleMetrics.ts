export const PART2_METRICS = {
  culture: [
    ['Eventos culturales cancelados por clima'],
    ['Espacios públicos afectados por reclamos'],
    ['Eventos masivos creados'],
    ['Espacios públicos afectados por incidentes'],
    ['Reservas afectadas por accidentes en bicicleta'],
    ['Reservas ciudadanas frente al total de eventos'],
  ],
  waste: [
    ['Cuadrillas afectadas por clima'],
    ['Cuadrillas enviadas por reclamos, por barrio'],
    ['Cuadrillas planificadas cerca de eventos masivos'],
    ['Cuadrillas afectadas por incidentes'],
    ['Intervenciones por accidentes en bicicleta frente a alertas normales'],
    ['Cuadrillas enviadas cerca de espacios reservados'],
  ],
  claims: [
    ['Reclamos originados por clima'],
    ['Reclamos que afectaron a otros módulos'],
    ['Reclamos vinculados a eventos masivos'],
    ['Reclamos vinculados a incidentes programados'],
    ['Reclamos viales por accidentes en bicicleta frente a otras causas'],
    ['Reclamos vinculados a eventos ciudadanos'],
  ],
  emergencies: [
    ['Emergencias con criticidad afectada por clima'],
    ['Emergencias originadas por reclamos'],
    ['Servicios públicos enviados de forma preventiva a eventos masivos'],
    ['Emergencias por incidentes programados', 'Recursos enviados por incidentes programados'],
    ['Emergencias durante viajes en bicicleta', 'Tiempo promedio de resolución de emergencias durante viajes en bicicleta'],
    ['Emergencias originadas por eventos ciudadanos'],
  ],
  mobility: [
    ['Estaciones bloqueadas por clima'],
    ['Estaciones afectadas por reclamos'],
    ['Estaciones con afectación prevista por eventos masivos'],
    ['Estaciones afectadas por incidentes'],
    ['Viajes interrumpidos por accidentes en bicicleta frente a viajes finalizados normalmente'],
    ['Estaciones afectadas por eventos ciudadanos'],
  ],
} as const;

export const PART2_CASES = [
  'Eventos climáticos', 'Reclamos ciudadanos', 'Eventos masivos',
  'Incidentes viales', 'Accidentes en bicicleta', 'Eventos ciudadanos',
];
