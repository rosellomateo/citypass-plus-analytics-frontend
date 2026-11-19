# Mapa de métricas, campos y condiciones

Revisión del frontend local: 18/11/2026. Describe el código actual, los contratos entregados y las muestras inspeccionadas. No implica cambios en el backend ni en los Parquet.

La comprobación completa de Emergencias y Espacios, incluyendo endpoints remotos y nuevos Parquet, está en [contrato Gold → API → frontend](contrato-emergencias-espacios-gold.md).

**Actualización de Residuos y Movilidad, 18/11 a las 22:43 ART:** el backend cambió el significado de los campos de Residuos y entrega intervenciones en el DTO antiguo. El [contrato vigente con fórmulas por caso](contrato-residuos-movilidad-api.md) reemplaza las secciones anteriores de esos dos módulos. `mobility-stations` cuenta afectaciones: ya no completa tarjetas de estaciones distintas. No se utilizan columnas de Parquet que la API omita ni se muestran los paneles de recorridos eliminados.

## Cómo llega una actualización

Los Parquet se procesan en el backend y el frontend consume el JSON de sus endpoints. Para ver un cambio debe actualizarse el agregado que devuelve la API y volver a consultarse la pantalla.

- Los datos principales se consultan al abrir/montar el dashboard. No tienen refresco automático periódico implementado.
- Los indicadores de `/analytics/{area}/parte2` se consultan aproximadamente cada 15 segundos después de finalizar la solicitud anterior. Un 404 detiene ese refresco hasta reintentar. El embed utiliza los datos inyectados y no consulta la red.
- Las pantallas muestran el corte completo recibido, sin recorte de siete días. Login selecciona únicamente la `fecha_snapshot` más reciente de su respuesta.
- Los resúmenes semanales pueden ser acumulados: concatenarlos y sumarlos duplica datos. El backend debe entregar el corte que corresponda.
- Una fila agregada con `cantidadAlertas = 8` representa ocho alertas; no se cuenta como una sola alerta.
- `0` es un valor válido. La falta de una métrica no confirma que su valor sea cero.

## 1. Datos principales calculados en el frontend

En los promedios ponderados, `SUM(valor × cantidad) / SUM(cantidad)` evita dar el mismo peso a un agregado de una unidad y otro de cien.

### Residuos — `alertas_resumen.parquet`

Endpoint: `GET /analytics/residuos`.

| Métrica o gráfico | Campos del Parquet | Condición y cálculo actual |
|---|---|---|
| Total de alertas | `cantidadAlertas` | Suma de las cantidades de las filas incluidas por los filtros. Para aumentar el total debe aumentar esa cantidad en el nuevo agregado. |
| Alertas resueltas | `cantidadResueltas` | Suma de cantidades resueltas. No depende de un texto de estado, porque este resumen no incluye ese campo. |
| Tasa de resolución | `cantidadResueltas`, `cantidadAlertas` | `100 × SUM(cantidadResueltas) / SUM(cantidadAlertas)`. Con total cero muestra cero. |
| Tiempo promedio de resolución | `tiempoPromResolucion`, `cantidadResueltas` | Promedio ponderado usando `cantidadResueltas` como peso. Una fila con cero resueltas no aporta peso. El frontend no convierte la unidad del valor recibido. |
| Tiempo promedio por zona | Los dos campos anteriores y `zona` | El mismo promedio, agrupado por zona. |
| Alertas por prioridad | `prioridad`, `cantidadAlertas` | Suma por prioridad. Orden visual: `CRITICA`, `ALTA`, `MEDIA`, `BAJA`; también normaliza tildes, mayúsculas y variantes como `Medio` a `MEDIA`. |
| Alertas por tipo | `tipoAlerta`, `cantidadAlertas` | Suma por tipo. En las muestras: `FALLA_SENSOR`, `INCENDIO`, `LLENO`, `VOLCADO`. Otros tipos recibidos también pueden aparecer. |
| Alertas por nivel de llenado | `rangoNivelLlenado`, `cantidadAlertas`, `zona` | Agrupa rangos como `0-40`, `40-60`, `60-80`, `80-100`, mostrados como porcentajes. `null`/`SIN RANGO` no forman una porción de la torta. El filtro local selecciona `zona`. |
| Detalle agregado de alertas | Todos los campos anteriores | Una fila por agregado recibido. Filtros locales por zona, prioridad y tipo; orden de mayor a menor prioridad; diez filas por página. El tiempo se presenta con un máximo de dos decimales. |

Excluir `SIN RANGO` de la torta no elimina sus alertas del total ni de la tabla. En el corte de semana 45 entregado hay 432 alertas, 313 resueltas y 97 sin nivel informado.

### Movilidad — `viajes_resumen.parquet`

Endpoint: `GET /analytics/movilidad-urbana`.

| Métrica o gráfico | Campos del Parquet | Condición y cálculo actual |
|---|---|---|
| Viajes acumulados / Altas del período | `cantidadViajes` | Ambas tarjetas usan actualmente `SUM(cantidadViajes)` del conjunto recibido y filtrado. |
| Cantidad de viajes por estación de inicio | `estacionInicio`, `cantidadViajes` | Suma por estación. Sin búsqueda sólo se muestran estaciones con **más de tres** viajes. Al buscar por nombre se incluyen coincidencias aunque tengan tres viajes o menos. |
| Estación top de inicios | Los dos campos anteriores | Estación con mayor cantidad acumulada de viajes. |
| Duración total | `duracionTotalViajes` | Suma de minutos acumulados. |
| Duración promedio ponderada | `duracionTotalViajes`, `cantidadViajes` | `SUM(duracionTotalViajes) / SUM(cantidadViajes)`. No se obtiene promediando `promDuracion`. |
| Duración promedio por estación | Los dos campos anteriores y `estacionInicio` | Mismo cociente, agrupado por estación. |
| Distribución de duración | `duracionViaje`, `cantidadViajes` | Suma por rango y participación sobre el total. Las etiquetas equivalentes `>1hs` y `>1h` se agrupan como `>1h`, sin modificar las filas recibidas. |

Antes de calcular se deduplica por `fechaInicio + estacionInicio + duracionViaje`, conservando la fila con `fecha_snapshot` más reciente. Para actualizar una fila repetida con esta clave debe venir con un snapshot posterior. La búsqueda ignora mayúsculas y tildes.

### Espacios Públicos — `actividades_resumen.parquet`

Endpoint: `GET /analytics/espacios-cultura`.

| Métrica o gráfico | Campos del Parquet | Condición y cálculo actual |
|---|---|---|
| Actividades | `cantidadActividades` | Suma del campo, sin exigir un estado específico. |
| Actividades masivas | `cantidadMasivas` | Suma del campo. El umbral de capacidad se aplica antes, en el productor/backend; el frontend no recibe ni filtra `capacidad` en este resumen. |
| Actividades afectadas por clima | `cantidadAfectadasPorClima` | Suma de los valores informados. No es necesario que el frontend vuelva a filtrar `causaTipo`. Si todos están ausentes, muestra «Sin datos». |
| Actividades por categoría | `categoria`, `cantidadActividades` | Suma por categoría normalizada: `CULTURAL`/`Cultura` se presentan como Cultura; `Música`/`M�sica`/`MUSICA` se agrupan como Música. |
| Actividades de ciudadanos | `organizadorTipo`, `cantidadActividades` | `organizadorTipo = CIUDADANO`, sumando cantidades; se acepta también `CIUADANO`. El resumen principal tiene prioridad para conservar el mismo corte que el total; `culture-organizer` queda como respaldo si no existe ese resumen. |
| Actividades de la ciudad | Los dos campos anteriores | `organizadorTipo = CIUDAD`, con la misma prioridad de fuentes que la tarjeta anterior. |
| Actividades de ciudadanos vs. eventos totales | Los anteriores y todas las filas de `cantidadActividades` | Tres barras: ciudadanos, ciudad y total de actividades. El total incluye las actividades cuyo organizador no está informado; no se reemplaza por la suma de las dos categorías conocidas. |

Los estados observados son `ACTIVE`, `CANCELADA`, `PROGRAMADA` y `SUSPENDIDA`. Las tarjetas generales anteriores suman las filas recibidas sin filtrar esos estados. Las tarjetas de **cancelados por clima** y **modificadas por accidentes** vienen de Parte 2, explicada más abajo.

El frontend también conserva un contrato anterior de reservas: confirmadas = suma de `cantidadConfirmadas`; canceladas = suma de `cantidadCanceladas`; tasa = canceladas/(confirmadas+canceladas); ocupación = promedio de `pctOcupacion` ponderado por `max(1, cantidadTotal)`; inscripciones = suma de `inscriptos`. Agrupa por `recursoId` y `categoria`, y muestra `cupoMaximo`. Esta rama se usa cuando la respuesta no contiene `cantidadActividades`.

### Emergencias — `emergencias_resumen.parquet`

Endpoint: `GET /analytics/seguridad-emergencias`.

| Métrica o gráfico | Campos del Parquet | Condición y cálculo actual |
|---|---|---|
| Total de emergencias | `cantidadEmergencias` | Suma de cantidades. |
| Emergencias cerradas | `estado_actual`, `cantidadEmergencias` | Suma para `CANCELADA`, `CERRADA`, `CERRADO`, `RESUELTA`, `DESCARTADA`, `RECHAZADO`, comparados sin distinguir mayúsculas. |
| Emergencias activas | Los dos campos anteriores | Suma del resto de los estados informados. Un estado ausente se cuenta por separado como «Emergencias sin estado» y se conserva en el total. |
| Distribución por prioridad | `prioridad`, `cantidadEmergencias` | Suma por prioridad normalizada: `CRITICA`, `ALTA`, `MEDIA`, `BAJA`; `Medio` se agrupa en `MEDIA`. |
| Distribución por categoría | `categoria`, `prioridad`, `cantidadEmergencias` | Suma por categoría y prioridad; incorpora categorías ausentes y una serie de prioridad no clasificada para conservar el total completo. |
| Tiempo de despacho, general y por prioridad | `tiempoPromRespuestaDespacho`, `cantidadEmergencias`, `prioridad` | Promedio ponderado por cantidad. Se omiten los tiempos nulos. |
| Tiempo promedio de llegada | `tiempoPromRespuestaLugar`, `cantidadEmergencias` | Promedio ponderado de las filas con tiempo informado y cantidad mayor que cero. |
| Emergencias vinculadas a otros servicios | `causaTipo`, `cantidadEmergencias` | Suma por causa. `MOVILIDAD_BICICLETA` se muestra separado de `INCIDENTE_VIAL`. `EVENTO_CLIMATICO`, `RECLAMO`, `EVENTO_PUBLICO`, `RESERVA` y las demás causas recibidas se agrupan por su valor. Nulos/vacíos se muestran como causa no informada. |
| Tiempo de resolución promedio por emergencia | `causaTipo`, `tiempoPromResolucion`, `cantidadEmergencias` | Promedio por causa, nivel al que Gold repite esa medida. Se exigen tiempos finitos, no negativos y cantidades positivas. El endpoint actual omite el campo: el gráfico general no se completa con c5b, cuyo promedio de bicicleta permanece en su tarjeta propia. |

Cambiar `afectaCirculacion` por sí solo no actualiza el gráfico por causa: éste lee `causaTipo`. Ese booleano se utiliza en la tarjeta de circulación, sumando cantidades con true y manteniendo los desconocidos separados. `criticidadAfectada` se suma para la tarjeta global de criticidad; c1 de Parte 2 sigue siendo el indicador específico de clima.

### Reclamos — `reclamos_resumen.parquet`

Endpoint: `GET /analytics/reclamos`.

| Métrica o gráfico | Campos del Parquet | Condición y cálculo actual |
|---|---|---|
| Total de reclamos | `row_count` | Suma del campo en todas las filas incluidas. |
| Distribución por estado | `estado_actual`, `row_count` | Suma por el estado normalizado explicado debajo. |
| Reclamos por categoría | `categoria`, `estado_actual`, `row_count` | Agrupa por categoría, normalizando mayúsculas y reemplazando `_` por espacios. En la vista Todos excluye los estados normalizados como CANCELADO. |
| Tiempo promedio general de resolución | `tiempo_prom_hasta_estado_actual`, `row_count`, `estado_actual` | Promedio ponderado de las filas normalizadas como CERRADO con tiempo finito, no negativo y cantidad positiva. Los tiempos nulos no se convierten en cero. |
| Tiempo promedio por categoría | `categoria`, `tiempo_prom_hasta_estado_actual`, `row_count`, `estado_actual` | Mismo promedio y población que el general, agrupado por categoría. La categoría `texto` se oculta en este gráfico. |

Mapeo de estados: `ASIGNADO`/`EN_CURSO`/`EN CURSO`/`EN_PROCESO`/`EN_REVISION` → EN CURSO; `RECHAZADO`/`CANCELADO` → CANCELADO; `CERRADO`/`RESUELTA`/`RESUELTO` → CERRADO; otros valores → CREADO.

`barrio`, `prioridad` y `origenClasificacion` participan de la búsqueda. Para las tarjetas de incidentes viales y reservas se conserva `causaTipo` y se suma `row_count` por causa. El caso 2 continúa leyendo Parte 2: una causa de origen no acredita por sí sola una intervención en otro servicio.

### Login — `autenticacion_resumen.parquet`

Endpoint: `GET /analytics/identidad`. Se usa sólo el snapshot más reciente de la respuesta.

| Métrica | Campos del Parquet | Valor necesario y cálculo |
|---|---|---|
| Inicios de sesión exitosos | `event_type`, `cantidadEventos` | `event_type = com.citypass.auth.LoginExitoso`; suma de cantidades. |
| Tokens renovados | Los mismos | `event_type = com.citypass.auth.TokenRenovado`; suma de cantidades. |
| Sesiones cerradas | Los mismos | `event_type = com.citypass.auth.SesionCerrada`; suma de cantidades. |
| Actividad por departamento | Los anteriores y `department` | Misma clasificación, agrupada por departamento. |

Los nombres de los eventos deben coincidir completos con esos textos. Otros tipos no suman a estas tres métricas. `username` no se utiliza para contar usuarios distintos. El JWT habilita el acceso al dashboard; los contadores dependen de los eventos agregados publicados.

## 2. Indicadores de los seis casos de uso: valores publicados por el backend

Fuente efectiva del frontend: `GET /analytics/{area}/parte2`, con `area = claims`, `emergencies`, `mobility`, `culture` o `waste`.

Cada tarjeta busca un registro `datos` con `id = c1…c6` o su variante `b` y muestra su `valor`. Para que se actualice, el backend tiene que publicar el nuevo `valor` para ese ID. Los detalles se toman de `detalle[].etiqueta`/`detalle[].valor` y la unidad de `unidad`.

Excepciones para los nuevos pedidos: Reclamos c4/c6 prioriza la suma directa por `causaTipo` cuando ese campo está disponible; Movilidad completa c2/c3/c4/c6 con `mobility-stations` cuando faltan los IDs; c5b de Movilidad presenta en una tarjeta independiente el detalle de viajes finalizados normalmente. Reclamos, Emergencias y Movilidad mantienen las tarjetas faltantes visibles como «Sin datos», no como cero.

Las condiciones de las tablas siguientes resumen **el contrato solicitado de los casos**, no un cálculo adicional implementado en el frontend. No todas pueden reconstruirse a partir de los resúmenes Parquet, porque faltan IDs y vínculos. No se verificó ni modificó aquí la implementación interna del backend.

En Cultura se requiere además `version_cultura = 2` para las tarjetas de casos de uso. Sin esa versión, esas tarjetas se omiten.

### Espacios Públicos (`culture`)

| ID | Métrica | Dato o condición del caso que debe producir el agregado |
|---|---|---|
| `c1` | Eventos culturales cancelados por clima | Cancelación con `causaTipo = EVENTO_CLIMATICO`; no basta que una actividad cualquiera esté afectada por clima. El frontend usa el `valor` de c1, no vuelve a aplicar filtros de categoría/estado al Parquet. |
| `c2` | Actividades afectadas por reclamos | En la pantalla actual: suma de `cantidadActividades` con `causaTipo = RECLAMO`. El JSON de espacios afectados aún no se entrega; esta tarjeta no afirma contar `espacioId` distintos. |
| `c3` | Actividades masivas creadas | `ActividadCreada`, `capacidad >= 500`; publicar la cantidad correspondiente. El resumen principal muestra por separado la suma ya agregada de `cantidadMasivas`. |
| `c4` | Actividades afectadas por incidentes viales | Suma de `cantidadActividades` con `causaTipo = INCIDENTE_VIAL`; no se usa como cardinalidad de espacios distintos. |
| `c5` | Actividades modificadas por accidentes | `ActividadModificada`, `causaTipo = ACCIDENTE_VIAL`; publicar el conteo de actividades. |
| `c6` | Actividades de ciudadanos frente al total | `organizadorTipo = CIUDADANO` frente al total de actividades; el contrato anterior también admite `CIUADANO`. El cálculo directo de las tarjetas superiores usa el valor canónico `CIUDADANO`. |

### Residuos (`waste`)

| ID | Métrica | Dato o condición del contrato |
|---|---|---|
| `c1` | Cuadrillas afectadas por clima | `causaTipo = EVENTO_CLIMATICO`, `estadoNuevo = AFECTADA`; el contrato usa camiones distintos. Los Parquet adjuntos no contienen `camionId`, así que el frontend no reconstruye este conteo. |
| `c2` | Cuadrillas enviadas por reclamos | Intervención programada por `RECLAMO`; camiones distintos. El desglose por barrio requiere vincular el reclamo identificado. |
| `c3` | Cuadrillas planificadas por eventos masivos | Intervención programada por `EVENTO_PUBLICO`, con identificación del evento masivo; camiones distintos. La causa sola no acredita que sea masivo. |
| `c4` | Intervenciones afectadas por incidentes viales | `com.citypass.residuos.IntervencionActualizada`, `estadoNuevo = AFECTADA`, `causaTipo = INCIDENTE_VIAL`; contar **intervencionId distintos**. No se cuentan camiones ni eventId. CANCELADA no suma. |
| `c5` | Intervenciones por accidentes en bicicleta frente a alertas normales | Intervenciones vinculadas a la emergencia frente a las vinculadas a alertas; requiere IDs/vínculos y los valores comparativos publicados. |
| `c6` | Cuadrillas cerca de espacios reservados | Intervención programada con `causaTipo = RESERVA`; el vínculo con la reserva debe venir identificado. |

Excepción implementada en el frontend: si falta `c4` y la fuente entrega los envelopes originales en `intervenciones`, calcula ese conteo con el filtro indicado. Si c4 existe, su valor publicado tiene prioridad. Las dos intervenciones distintas del 16/11 deben dar 2, aunque haya reintentos con otros `eventId`. Los resúmenes de ocho filas entregados no contienen los IDs individuales necesarios para verificarlo.

### Reclamos (`claims`)

| ID | Métrica | Dato o condición del contrato |
|---|---|---|
| `c1` | Vínculos a alertas climáticas | Reclamo identificado y relacionado con una alerta climática; v3 utiliza `alertaId`. |
| `c2` | Reclamos que afectaron a otros módulos | `reclamoId` que aparece como `causaId` en otro módulo, con `causaTipo = RECLAMO`; contar reclamos distintos. No sale de un solo Parquet de Reclamos. |
| `c3` | Vínculos a eventos masivos | Vínculo `actividadId` a un evento identificado como masivo; no alcanza cualquier evento público. |
| `c4` | Reclamos por incidentes viales | Suma de `row_count` con `causaTipo = INCIDENTE_VIAL`, sin exigir estado PROGRAMADO del incidente. La suma directa tiene prioridad sobre el ID anterior, cuyo alcance era más restringido. |
| `c5` | Reclamos por accidentes viales | El valor actualmente mostrado corresponde al caso de accidente en bicicleta; la comparación llega en `detalle` con las otras causas. El título se acortó, pero eso no amplió por sí solo la cobertura del cálculo del backend. |
| `c6` | Reclamos por reservas de espacios públicos | Suma de `row_count` con `causaTipo = RESERVA`; no se infiere por barrio o cercanía. |

### Emergencias (`emergencies`)

| ID | Métrica | Dato o condición del contrato |
|---|---|---|
| `c1` | Criticidad afectada por clima | Vínculo climático y aumento confirmado de criticidad. Una emergencia con causa climática no implica por sí misma un aumento. |
| `c2` | Originadas por reclamos | `causaTipo = RECLAMO`. |
| `c3` | Servicios preventivos por eventos masivos | Emergencia preventiva vinculada al evento y despacho del recurso; requiere el vínculo y la confirmación del despacho. |
| `c4` | Originadas por incidentes programados | `causaTipo = INCIDENTE_VIAL` y vínculo al incidente `PROGRAMADO`. |
| `c4b` | Recursos enviados por esos incidentes | Recurso/servicio despachado vinculado al caso anterior. |
| `c5` | Emergencias durante viajes en bicicleta | Vínculo con viaje de bicicleta; el resumen actual identifica `causaTipo = MOVILIDAD_BICICLETA`. |
| `c5b` | Resolución de emergencias de bicicleta | Promedio publicado para el conjunto anterior, con su unidad. No es el promedio de todas las emergencias. |
| `c6` | Originadas por eventos ciudadanos | Vínculo con reserva/evento ciudadano; el contrato utiliza `RESERVA`. |

### Movilidad (`mobility`)

| ID | Métrica | Dato o condición del contrato |
|---|---|---|
| `c1` | Estaciones bloqueadas por clima | Estación identificada, afectación/bloqueo y causa climática. |
| `c2` | Estaciones afectadas por reclamos | `EstacionUrbanaAfectada`, `causaTipo = RECLAMO`; estaciones distintas. |
| `c3` | Afectación prevista por eventos públicos | Según el criterio solicitado: `causaTipo = EVENTO_PUBLICO`. Respaldo: punto Evento público de `mobility-stations`. No se infiere capacidad, horario futuro ni estado PROGRAMADA de ese punto agregado. |
| `c4` | Estaciones afectadas por incidentes | `causaTipo = INCIDENTE_VIAL`; estaciones distintas. |
| `c5` | Viajes interrumpidos por accidente de bicicleta | Interrupción vinculada a ese accidente; comparación con viajes finalizados normalmente en `detalle`. |
| `c5b` (presentación) | Viajes finalizados normalmente | Tarjeta separada a partir del detalle `Viajes finalizados normalmente` de c5. Si no viene ese detalle, se utiliza Operación normal de `mobility-interruptions`. No es el total de viajes acumulados ni las interrupciones por todas las causas. |
| `c6` | Estaciones afectadas por eventos ciudadanos | `causaTipo = RESERVA`, vinculado al evento ciudadano; estaciones distintas. |

## 3. Tortas y agregados Gold recibidos en Parte 2

El frontend toma `resumen_gold[].id` y presenta sus `puntos[].etiqueta`/`puntos[].valor`. Cambiar un Parquet sin regenerar esos puntos no actualiza estos gráficos.

| Gráfico | ID leído | Campos del resumen de origen / condición del valor |
|---|---|---|
| Intervenciones por causa publicada | `waste-cause` | Nuevo campo confirmado de `intervenciones_resumen`: `causaProgramada`, sumando `cantidadIntervenciones`. La causa de afectación es independiente (`causaTipoAfectacion`). El frontend recibe los puntos ya calculados; el backend debe adaptar esa agregación. No son nombres ni cantidad de eventos distintos. |
| Alertas de residuos por zona, si se publica | `waste-alerts` | `alertas_resumen`: `zona`, `cantidadAlertas`. Este agregado es independiente del gráfico principal calculado desde `/analytics/residuos`. |
| Estaciones afectadas por causa | `mobility-stations` | `movilidad_resumen`: `causaTipo`, `estacionesAfectadasDistintas`. En el frontend Reserva se agrupa visualmente con Evento público y se suman los valores publicados; no se deduplican estaciones entre ambas causas porque faltan IDs. |
| Viajes afectados, tarjeta superior | `mobility-interruptions` | `movilidad_resumen`: `causaTipo`, `cantidadViajesInterrumpidos`. El frontend suma los puntos **excepto el que tenga exactamente la etiqueta `Operación normal`**. |
| Impacto sobre eventos públicos: vista general | `culture-cause` | `actividades_resumen`: `causaTipo`, `cantidadActividades`; conteos por causa publicados por el backend. |
| Actividades masivas por barrio, si se publica | `culture-mass` | `actividades_resumen`: `barrio`, `cantidadMasivas`. |
| Actividades por organizador | `culture-organizer` | `actividades_resumen`: `organizadorTipo`, `cantidadActividades`; etiquetas `CIUDADANO` y `CIUDAD`. |

`cantidadAfectadas` del resumen de intervenciones permite distinguir afectadas de programadas si el backend publica ese desglose, pero la torta actual lee el agregado total `waste-cause`. En la muestra del 17/11, EVENTO_PUBLICO tiene 14 afectadas y 12 programadas: 26 intervenciones, no 26 eventos. El corte posterior del deployment informa 28.

Los filtros por zona/estación necesitan además `afectaciones.zonas[].nombre/causas` o `afectaciones.estaciones[].nombre/causas`. El agregado global de un Parquet sin esos identificadores no permite reconstruir el desglose.

## 4. Listas por evento y relaciones que faltan en los resúmenes

Estos son campos de detalle del JSON que el frontend admite. No están presentes en los Parquet agregados de Residuos entregados.

| Sector | Campos necesarios | Condición para mostrar o actualizar |
|---|---|---|
| Eventos que afectan recorridos | `afectaciones.recorridos_eventos[]`: `evento_id`, `recorrido_id`, `nombre_evento`, `recorrido`; `zona` opcional | Un vínculo explícito por evento y recorrido. La lista deduplica por el par de IDs y pagina de a diez. Si falta el nombre del evento, puede buscarlo por el mismo ID en `eventos_zona`/`eventos_publicos`. |
| Cantidad de recorridos afectados | `recorrido_id` en `recorridos_eventos` y/o `recorridos_efectos` | Cantidad de IDs de recorridos distintos. No utiliza camiones ni intervenciones como recorridos. Si no hay IDs, actualmente muestra «Sin datos». |
| Lista de eventos públicos | `eventos_zona` y/o `eventos_publicos`: `evento_id`, `nombre`; `inicio`, `fin` cuando estén informados | Un evento por ID. La tabla muestra fechas disponibles y deja vacíos los campos no informados. |
| Torta filtrada por evento | `eventos_zona[].causas[]`: `etiqueta`, `valor` | Para un evento elegido muestra solamente su desglose publicado. Sin ese desglose no reparte el total global entre eventos. |
| Efecto y descripción de un evento | `efecto`, `descripcion_efecto` o etiquetas positivas de `causas` | Sólo presenta datos recibidos; la descripción se abrevia a 120 caracteres. No deduce la causa por el nombre del evento. |
| Emergencias con criticidad afectada por evento | `emergencias_zona[]`: `emergencia_id`, `evento_id`, `criticidad_elevada`, `criticidad`, `vinculada_en` | En la vista Criticidad afectada se requiere `criticidad_elevada = true`; en Eventos cercanos basta `evento_id` informado. Orden: CRITICA, ALTA, MEDIA, BAJA. |
| Datos de la emergencia vinculada | `nombre_evento`, `tipo`, `sector`, `estado`, `criticidad_original`, `radio_metros`, `respondida`, `causa_repetida` | Se presentan sólo los campos recibidos. Respondida se muestra si existe algún valor explícito. Repetición de causa no se infiere de contar filas. |
| Emergencias resueltas/no resueltas por sector | `emergencia_id`, `sector`, `estado` | Una emergencia por ID. RESUELTA/CERRADA → resuelta; DESCARTADA/CANCELADA → descartada; PENDIENTE/DESPACHADA/EN_PROCESO/EN_CURSO/ACTIVA → abierta; otros estados → sin confirmar. |

El evento original `EmergenciaVinculadaAContextoZona` aporta `emergenciaId`, `referenciaExterna`, `radioMetros` y `vinculadaEn`. El backend necesita relacionarlo con el evento público y con los datos de la emergencia. Estar dentro de 500 metros no es por sí solo una confirmación de criticidad elevada: el productor debe informar ese cambio.

## 5. Validación del 18/11/2026

1. Se corrigieron los promedios de Reclamos: sólo filas resueltas/cerradas con tiempo informado; misma población en el promedio general y por categoría.
2. Se corrigió el mapeo de `RESUELTO`, `EN_PROCESO` y `EN_REVISION` en Reclamos.
3. Movilidad agrupa `>1hs` y `>1h` en una sola categoría visual.
4. El nombre Reclamos por accidentes viales se acortó visualmente, pero el c5 publicado sigue correspondiendo al caso de accidente de bicicleta.
5. Los cuatro contadores `totalVeces...` ahora se suman en un gráfico histórico separado de los conteos de actividades. `criticidadAfectada` se utiliza en la tarjeta global de Emergencias. Esas unidades no se sustituyen por eventos, espacios o recursos distintos.
6. Analítica Urbana tiene hoy una portada de navegación y contratos documentados; EDA fue retirado. Los informes de IA se presentan desde `informe` y no se regeneran en el navegador por cambiar un contador.

El detalle de respuestas reales, conteos y pendientes del nuevo esquema de Residuos está en [validacion-dashboards-2026-11-18.md](validacion-dashboards-2026-11-18.md).

## Fuentes del código consultadas

- `src/dataSources/apiAnalyticsDataSource.ts`: adaptadores y cálculos principales.
- `src/services/claimsService.ts`, `src/services/mobilityService.ts`: agregación, estados y deduplicación.
- `src/pages/LoginDashboard.tsx`: tipos de autenticación y último snapshot.
- `src/config/crossModuleMetrics.ts`, `src/components/common/DashboardImpactCards.tsx`: IDs y valores de Parte 2.
- `src/components/common/DashboardImpactCharts.tsx`, `src/pages/MobilityDashboard.tsx`, `src/components/waste/WasteAffected.tsx`: gráficos, prioridades de fuentes y excepciones.
- `src/components/culture/PublicEventImpact.tsx`, `src/components/common/EmergencyZonePanel.tsx`: relaciones por evento.
- `src/utils/dashboardPresentation.ts`, `src/hooks/useDashboardImpact.ts`: filtros de presentación y refresco.
- Contratos de la Parte 2 entregados, esquemas inspeccionados de los Parquet y respuestas de ejemplo del deployment conservadas localmente en testingDatos.

## Actualización: cálculo territorial en el frontend

El gráfico Cantidad de eventos por zona usa `cantidadActividades` agrupada por
`zona`, o `barrio` cuando zona no está informado. Se recuperó la ficha final
Impacto por evento público. Sus relaciones pueden calcularse en el navegador si
llega `contexto_territorial`, con IDs, coordenadas, horarios y trazados de recorridos.

El detalle del contrato está en [contrato-contexto-territorial.md](contrato-contexto-territorial.md).
La cercanía no inventa un aumento de criticidad: éste se muestra cuando los datos
informan el cambio. Los datos originales de los servicios se conservan.
