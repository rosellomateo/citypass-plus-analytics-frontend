# Residuos y Movilidad: métricas con el JSON del backend

Verificación: 18/11/2026, 22:43 ART. Se consultaron los endpoints desplegados con autenticación y se leyó el código remoto de `main`. Sólo se modificó el frontend. Los Parquet no se utilizan como fuente adicional ni se agregan campos ausentes al JSON.

Este documento reemplaza las descripciones anteriores de alertas, llenado, duración de viajes y recorridos para la respuesta actual. Se conservó compatibilidad con paquetes antiguos de alertas, identificados por prioridades de alerta; el JSON nuevo utiliza estados de intervención.

## Fuentes verificadas

Base de producción: `https://citypass-backend-prod-becqetepcjbqa8c7.brazilsouth-01.azurewebsites.net`.

| Endpoint GET | Contrato recibido | Uso |
|---|---|---|
| `/analytics/residuos` | `{datos, informe}`; 59 filas agregadas de intervenciones | Fuente de los totales, estados, zonas y ambas causas en Residuos. |
| `/analytics/waste/parte2` | `datos` con c1 y c5; `resumen_gold` con `waste-cause` | c5 informa el origen de programación en emergencias, que el endpoint principal omite. Se usa sólo sin filtros y con la misma fecha de corte. |
| `/analytics/movilidad-urbana` | `{datos, informe}`; siete causas | Fuente de todas las tarjetas y gráficos principales de Movilidad. |
| `/analytics/mobility/parte2` | Indicadores por caso y gráficos agregados | Respaldo si falla el endpoint principal; sus puntos `mobility-stations` **no** se interpretan como estaciones distintas. |

Código consultado: [traducción de Residuos](https://github.com/rosellomateo/citypass-plus-analytics-backend/blob/main/app/services/residuos_service.py), [selección de datos de Movilidad](https://github.com/rosellomateo/citypass-plus-analytics-backend/blob/main/app/services/movilidad_service.py), [schema de Movilidad](https://github.com/rosellomateo/citypass-plus-analytics-backend/blob/main/app/schemas/sch_movilidad_urbana.py) y [cálculos de Parte 2](https://github.com/rosellomateo/citypass-plus-analytics-backend/blob/main/app/routers/rout_parte2.py).

## Residuos: los nombres del JSON son del contrato anterior

El backend traduce las intervenciones al DTO `Residuo`. El frontend respeta esa traducción:

| Campo recibido | Significado confirmado en el servicio | Presentación |
|---|---|---|
| `zona` | `barrio` | Zona; si falta, «Sin zona informada». |
| `tipoAlerta` | `causaProgramacion` (antes `causaTipo`) | Causa de programación. |
| `prioridad` | `estado_actual` | Estado: PROGRAMADA, AFECTADA, CANCELADA o COMPLETADA. No es prioridad. |
| `rangoNivelLlenado` | `causaTipoAfectacion` | Causa de afectación. No es un porcentaje. |
| `cantidadAlertas` | `cantidadIntervenciones` | Cantidad de intervenciones; una fila puede representar varias. |
| `cantidadResueltas` | `cantidadCompletadas` | Intervenciones completadas. |
| `tiempoPromResolucion` | El servicio devuelve `null`: no existe en ese Gold | No se muestra un tiempo calculado ni cero minutos. |
| `fecha_snapshot` | Corte acumulado | Se selecciona el más reciente, sin sumar cortes históricos. |

El nombre `causaProgramada` mencionado antes no llega como propiedad de este endpoint. El código actual del backend acepta `causaProgramacion` o el antiguo `causaTipo` en Gold y entrega ambos como `tipoAlerta`. El frontend no renombra ni completa archivos Parquet.

### Fórmulas y actualización

Todos los cálculos siguientes se aplican al último corte recibido y a los filtros de zona, causa de programación y búsqueda. `SUM` usa los contadores entregados, no el número de filas.

| Métrica | Cálculo con campos del JSON |
|---|---|
| Total de intervenciones | `SUM(cantidadAlertas)`. |
| Programadas | `SUM(cantidadAlertas)` donde `prioridad = PROGRAMADA`. |
| Afectadas | `SUM(cantidadAlertas)` donde `prioridad = AFECTADA`. |
| Canceladas | `SUM(cantidadAlertas)` donde `prioridad = CANCELADA`. |
| Completadas | `SUM(cantidadResueltas)`. |
| Tasa de finalización | `100 × completadas / total`, hasta dos decimales. |
| Caso 1: afectadas por clima | `prioridad = AFECTADA` y `rangoNivelLlenado = EVENTO_CLIMATICO`; suma de cantidades. |
| Caso 2: intervenciones por reclamos | `tipoAlerta = RECLAMO`; suma de cantidades de todos los estados. |
| Caso 3: por eventos públicos | `tipoAlerta = EVENTO_PUBLICO`; suma de cantidades. No permite certificar capacidad >= 500. |
| Caso 4: afectadas por incidente vial | `prioridad = AFECTADA` y `rangoNivelLlenado = INCIDENTE_VIAL`; suma de cantidades. Las CANCELADA quedan excluidas. |
| Caso 5: originadas en emergencias | `datos[id=c5].valor` de `/analytics/waste/parte2`. El backend cuenta `origenProgramacion = EMERGENCIA`, no sólo `tipoAlerta = EMERGENCIA`. No permite afirmar que todas son accidentes de bicicleta. |
| Caso 6: por reservas | `tipoAlerta = RESERVA`; suma de cantidades. |

La torta de programación cuenta todas las intervenciones por `tipoAlerta`. La torta de afectación sólo cuenta AFECTADA por `rangoNivelLlenado`. **Son preguntas diferentes y sus cantidades no tienen por qué coincidir.** `SIN CAUSA EXTERNA` no significa operación normal y `SIN AFECTACION` en una intervención AFECTADA significa que no se informó su causa.

El backend ya agrega las intervenciones; no envía `intervencionId`, `camionId`, IDs de recorridos, nombres de eventos, coordenadas, horarios ni `origenProgramacion` en el endpoint principal. El frontend no vuelve a deduplicar por IDs ni presenta camiones/recorridos como si fueran intervenciones. La lista de eventos que afectan recorridos permanece eliminada.

Para actualizar una métrica se debe actualizar el contador/estado/causa correspondiente en el JSON del backend y volver a cargar la pantalla. c5 puede actualizarse mediante la consulta periódica de Parte 2, siempre que coincida el corte. Se omite al filtrar para evitar atribuir el total global a una zona.

## Movilidad: separar unidades y causas

El backend selecciona el resumen nuevo más reciente entre `viajes_resumen.parquet` y `movilidad_resumen.parquet`; ante empate prioriza el primero. El frontend usa exclusivamente su respuesta y el último `fecha_snapshot`.

| Campo recibido | Uso correcto |
|---|---|
| `causaTipo` | Separa las causas, conservando RESERVA y EVENTO_PUBLICO. |
| `cantidadAfectaciones` | Afectaciones registradas. No es cantidad de estaciones. |
| `estacionesAfectadasDistintas` | Estaciones distintas **dentro de cada causa**; tarjeta, barras y torta. |
| `cantidadBloqueadas` | Bloqueos registrados. |
| `estacionesBloqueadasDistintas` | Estaciones distintas bloqueadas por esa causa. |
| `cantidadPreventivas` | Afectaciones preventivas; no certifica cuántas estaciones distintas ni la capacidad del evento. |
| `cantidadRestauradas` | Restauraciones de afectaciones; no estaciones distintas. |
| `cantidadViajesInterrumpidos` | Viajes interrumpidos para causas distintas de NORMAL. En NORMAL, el contrato confirma que contiene viajes finalizados normalmente. |

| Caso | Tarjeta y cálculo |
|---|---|
| 1 | Estaciones bloqueadas por clima: `estacionesBloqueadasDistintas`, causa EVENTO_CLIMATICO. |
| 2 | Estaciones afectadas por reclamos: `estacionesAfectadasDistintas`, causa RECLAMO. |
| 3 | Afectaciones preventivas por eventos públicos: `cantidadPreventivas`, causa EVENTO_PUBLICO. |
| 4 | Estaciones afectadas por incidentes viales: `estacionesAfectadasDistintas`, causa INCIDENTE_VIAL. |
| 5 | Viajes interrumpidos por emergencias: `cantidadViajesInterrumpidos`, causa EMERGENCIA. Tarjeta separada de finalizados normalmente, causa NORMAL. El JSON no identifica accidente de bicicleta. |
| 6 | Estaciones afectadas por reservas: `estacionesAfectadasDistintas`, causa RESERVA. El JSON no informa el organizador y no certifica que sea ciudadano. |

Las barras de estaciones incluyen sólo contadores de estaciones distintas. Las preventivas aparecen con los contadores de afectaciones. No se suma un total de estaciones únicas entre causas porque no llegan sus IDs. La torta compara conteos por causa, sin afirmar que las poblaciones sean disjuntas.

El gráfico `mobility-stations` de Parte 2 usa `cantidadAfectaciones` en el backend, aunque su título diga estaciones. Se corrigió el frontend para usar `estacionesAfectadasDistintas` de la respuesta principal, sin modificar el backend. Se retiró el filtro de estación que no tenía opciones ni desglose entregado.

## Valores comprobados de la respuesta desplegada

Corte `2026-11-19` (consultado la noche del 18 en Argentina). Son valores de referencia, no constantes de la aplicación.

| Residuos | Valor |
|---|---|
| Intervenciones totales | 118 |
| Programadas / afectadas / canceladas | 60 / 47 / 9 |
| Completadas | 2 |
| Afectadas por incidentes viales (sólo AFECTADA) | 19 |
| Por causa de programación EVENTO_PUBLICO | 28 intervenciones, no 28 eventos ni recorridos |
| c1 de Parte 2, afectadas por clima | 16 |
| c5 de Parte 2, originadas en emergencias | 27 |

| Movilidad | Valor |
|---|---|
| Afectaciones / bloqueos / preventivas / restauraciones | 373 / 212 / 14 / 318 |
| Viajes interrumpidos / finalizados normalmente | 19 / 37 |
| RECLAMO: afectaciones / estaciones distintas | 43 / 35 |
| EVENTO_PUBLICO: afectaciones / estaciones distintas / preventivas | 20 / 19 / 14 |
| INCIDENTE_VIAL: estaciones distintas / viajes interrumpidos | 12 / 12 |
| EVENTO_CLIMATICO: estaciones distintas bloqueadas | 124 |

La falta de coordenadas y vínculos impide demostrar proximidad de 500 metros desde estos agregados. Se muestran los efectos que el backend ya clasificó; no se inventan vínculos entre módulos, nombres de eventos ni rutas.

Los `informe` de IA recibidos todavía describen 87 intervenciones en Residuos y 59 afectaciones en Movilidad, frente a las 118 y 373 de sus respectivos `datos`. Se conserva el texto original del backend; el frontend no modifica sus análisis para hacerlos coincidir. Hace falta regenerar esos informes en origen.

Validación: 167 pruebas unitarias, nueve escenarios embebidos sin acceso a red, compilación de producción y embed, y navegación local por Reclamos, Emergencias, Espacios, Residuos y Movilidad usando las respuestas reales capturadas. Se comprobaron filtros, paginación de diez filas, ausencia de errores de JavaScript y ausencia de desbordamiento de página. Los datos y herramientas de prueba siguen en `testingDatos/`, ignorado por Git.
