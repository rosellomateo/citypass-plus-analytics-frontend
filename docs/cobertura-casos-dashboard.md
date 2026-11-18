# Cobertura de los casos de uso en dashboards

Revisión del 18/11/2026. Fuente de contraste: JSON de los endpoints desplegados consultados a las 12:33 de Argentina. Los cambios de esta revisión corresponden al frontend; no modifican los Parquet, el backend ni el despliegue vigente.

## Emergencias

Se muestra **Emergencias por causa** junto a las visualizaciones principales, sumando `cantidadEmergencias` por `causaTipo` de `/analytics/seguridad-emergencias`. Se mantienen separadas la bicicleta, el incidente vial y el evento público, y se incluyen las demás causas recibidas.

El corte de 162 emergencias contiene 4 por EVENTO_CLIMATICO, 3 por RECLAMO, 21 por EVENTO_PUBLICO, 5 por MOVILIDAD_BICICLETA y 129 sin causa informada. No hay filas con INCIDENTE_VIAL en este corte. El gráfico no transforma las 21 de eventos públicos en recursos enviados o criticidad elevada.

| Caso | Qué publica hoy Parte 2 | Representación |
|---|---|---|
| 1. Clima | c1 = 0 con criticidad afectada; detalle: 4 vinculadas al clima | Tarjeta de criticidad y gráfico por causa. Las dos poblaciones no se confunden. |
| 2. Reclamo ciudadano | c2 = 3 | Tarjeta de emergencias originadas por reclamos. |
| 3. Evento masivo | No publica c3 | Tarjeta visible con Sin datos. La causa EVENTO_PUBLICO sola no acredita un despacho preventivo. |
| 4. Incidente vial | No publica c4 ni c4b | Tarjetas visibles con Sin datos. Falta el agregado de incidentes programados y recursos. |
| 5. Accidente de bicicleta | c5 = 5; c5b = 866 min | Se conservan las tarjetas y el promedio con su alcance de bicicleta. |
| 6. Evento ciudadano | c6 = 0 | Se conserva el cero informado. No se adjudican a este caso los 21 eventos públicos sin un vínculo que lo justifique. |

## Espacios Públicos

Nuevo gráfico **Actividades de ciudadanos vs. eventos totales** con tres barras del mismo resumen: ciudadanos, ciudad y total. En el corte consultado son 19, 43 y 128. Las 66 actividades sin organizador informado siguen formando parte del total.

El valor CIUADANO del contrato anterior se interpreta como CIUDADANO únicamente para la presentación. Las filas originales no se modifican. Las tarjetas superiores utilizan primero ese mismo resumen y sólo recurren a `culture-organizer` cuando no existe.

## Reclamos

| Tarjeta | Fuente | Corte consultado |
|---|---|---|
| Reclamos por incidentes viales (caso 4) | `SUM(row_count)` con `causaTipo = INCIDENTE_VIAL` | 7 |
| Reclamos por reservas de espacios públicos (caso 6) | `SUM(row_count)` con `causaTipo = RESERVA` | 7 |
| Reclamos que afectaron a otros servicios (caso 2) | `/analytics/claims/parte2`, c2, reclamos distintos vinculados a acciones de otros módulos | 20 |

El criterio nuevo del caso 4 no exige que el incidente esté PROGRAMADO. Las tarjetas y el gráfico comparten los valores por causa; si el endpoint principal no entrega ese campo, no se inventa un conteo. El caso 2 no equivale a contar reclamos cuyo origen sea RECLAMO.

## Movilidad

Los IDs de Parte 2 mantienen prioridad, incluido un cero explícito. Cuando faltan, las tarjetas utilizan los puntos ya publicados en `mobility-stations`, sin sumar etiquetas diferentes ni deduplicar cantidades agregadas otra vez.

| Tarjeta | Respaldo | Corte consultado |
|---|---|---|
| Estaciones afectadas por reclamos | Reclamo / RECLAMO | 30 |
| Estaciones con afectación prevista por eventos públicos | Evento público / EVENTO_PUBLICO | 20 |
| Estaciones afectadas por incidentes viales | Incidente vial / INCIDENTE_VIAL | 12 |
| Estaciones afectadas por eventos ciudadanos | Reserva / RESERVA | 12 |
| Viajes interrumpidos por accidente en bicicleta | c5 | 2 |
| Viajes finalizados normalmente | Detalle de c5; respaldo Operación normal de `mobility-interruptions` | 36 |

La tarjeta de EVENTO_PUBLICO aplica la condición pedida; no confirma capacidad ni horario futuro, porque los puntos agregados no traen esos datos. Las cuatro tarjetas de estaciones no forman una partición: una estación puede aparecer en varias causas. No se reemplaza el conteo específico de accidentes en bicicleta por las 15 interrupciones externas de todas las causas.

## Residuos y Login

Login no requiere cambios. Residuos sigue respondiendo HTTP 500 en `/analytics/residuos`, y su Parte 2 sigue vacío en la consulta de esta revisión. Por tanto, no se puede atribuir todo el fallo a un deploy pendiente del frontend; hay un error verificable en la API desplegada. Se conserva el soporte del campo `causaProgramada` y la separación de causa de programación/afectación.

Los datos de contraste y del mock permanecen en `testingDatos/`, ignorados por Git y por Docker. Las mismas adaptaciones de presentación se aplican al JSON obtenido por API y al JSON inyectado en el embed.

## Validación

- 157 pruebas unitarias y de componentes aprobadas.
- 8 pruebas del embed en navegador aprobadas, sin solicitudes externas.
- Builds normal y embed aprobados; paquete autocontenido y sus 7 casos de validación de código aprobados.
- Comprobación visual en navegador con el JSON capturado: tarjetas de Reclamos y Movilidad, comparación por organizador y causas de Emergencias con los valores anteriores. Sin errores de JavaScript ni desborde horizontal al finalizar la adaptación de ancho.
- Lint sin errores, con nueve advertencias preexistentes. Mock actualizado localmente con las respuestas disponibles; los ejemplos de Residuos se conservan mientras su API real continúa fallando.
