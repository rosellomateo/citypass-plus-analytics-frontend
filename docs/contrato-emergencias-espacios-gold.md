# Emergencias y Espacios: contrato Gold → API → frontend

La presentación se simplificó el 19/11: [ajustes vigentes](ajustes-presentacion-2026-11-19.md). Los valores numéricos que siguen corresponden a la captura histórica del 18/11.

El sector de criticidad afectada se retiró definitivamente por falta de detalle individual. No se agrega una tabla individual ni se solicitan nuevos datos al backend; los demás gráficos y métricas se conservan.

Verificación del 18/11/2026: código remoto de `main` y `develop` del backend, OpenAPI desplegado, respuestas autenticadas y los cuatro Parquet descargados en `D:/Descargas`. Los Parquet se leyeron completos, sin modificarlos; sus hashes SHA-256 antes/después coinciden. Los datos completos y las herramientas de lectura quedan sólo en `testingDatos/`.

## Endpoints existentes y limitaciones verificadas

| Archivo Gold | Endpoint y respuesta actual | Resultado |
|---|---|---|
| `Emergencias y Seguridad/emergencias_resumen.parquet` | `GET /analytics/seguridad-emergencias` → `{datos, informe}` | El frontend lee este endpoint. El schema expone todos los campos inspeccionados salvo `tiempoPromResolucion`. |
| `Espacios Publicos y Cultura/actividades_resumen.parquet` | `GET /analytics/espacios-cultura` → `{datos, informe}` | `datos` contiene exclusivamente actividades. Se conservan los nombres originales del JSON. |
| `reservas_resumen.parquet` | No aparece en el servicio ni en el schema actual de Espacios | El archivo existe; la API no entrega sus filas. No hay una ruta adicional de reservas en el OpenAPI publicado. |
| `espacios_afectados_resumen.parquet` | No aparece en el servicio ni en el schema actual de Espacios | El archivo existe; la API no entrega sus filas. No hay una ruta adicional de espacios afectados en el OpenAPI publicado. |

Base de API verificada: `https://citypass-backend-prod-becqetepcjbqa8c7.brazilsouth-01.azurewebsites.net`. Las peticiones utilizan el Bearer token de la sesión existente; no se conectan directamente a Azure ni leen Parquet en el navegador.

Fuentes del repositorio:

- [Ruta de Espacios](https://github.com/rosellomateo/citypass-plus-analytics-backend/blob/main/app/routers/rout_espacios_cultura.py), [servicio de Espacios](https://github.com/rosellomateo/citypass-plus-analytics-backend/blob/main/app/services/espacios_cultura_service.py) y [schema de Espacios](https://github.com/rosellomateo/citypass-plus-analytics-backend/blob/main/app/schemas/sch_espacios_cultura.py).
- [Servicio de Emergencias](https://github.com/rosellomateo/citypass-plus-analytics-backend/blob/main/app/services/seguridad_emergencias_service.py) y [schema de Emergencias](https://github.com/rosellomateo/citypass-plus-analytics-backend/blob/main/app/schemas/sch_seguridad_emergencias.py).
- [Parte 2](https://github.com/rosellomateo/citypass-plus-analytics-backend/blob/main/app/routers/rout_parte2.py) → `GET /analytics/emergencies/parte2` y `GET /analytics/culture/parte2`.

La copia local del backend estaba en otra rama; la verificación del contrato se hizo contra el código remoto y la API desplegada. No se modificó ni actualizó ese checkout.

## Emergencias: correspondencia de métricas y gráficos

| Indicador | Variables recibidas | Cálculo o alcance |
|---|---|---|
| Total de emergencias | `cantidadEmergencias` | Suma del campo, no cantidad de filas. |
| Activas | `estado_actual`, `cantidadEmergencias` | Estados no cerrados con estado informado. Las filas sin estado forman su propio grupo. |
| Cerradas | Los anteriores | CANCELADA, CERRADA, CERRADO, RESUELTA, DESCARTADA y RECHAZADO, normalizados sin distinguir mayúsculas. |
| Sin estado | Los anteriores | Suma de cantidades con estado ausente; se conserva dentro del total, sin tarjeta independiente. |
| Criticidad afectada | `criticidadAfectada`, `causaTipo` | El campo puede llegar en el JSON, pero se retiró su sector de la pantalla. No se construye una tabla individual desde este contador. |
| Circulación afectada | `afectaCirculacion`, `cantidadEmergencias` | Suma de cantidades donde el booleano es `true`. `false` y desconocido se distinguen; la tarjeta muestra cuántas quedan sin confirmación. |
| Recuento por estado | `estado_actual`, `cantidadEmergencias` | Modelo utilizado para las tarjetas; conserva todos los estados, incluido el grupo sin estado. |
| Distribución por prioridad | `prioridad`, `cantidadEmergencias` | CRITICA, ALTA, MEDIA y BAJA; MEDIO se interpreta como MEDIA. Ausentes se mantienen como sin prioridad. |
| Distribución por categoría | `categoria`, `prioridad`, `cantidadEmergencias` | Incluye «Sin categoría informada» y una serie sin prioridad clasificada. La suma del gráfico debe coincidir con el total. No se convierten categorías ausentes en MEDICA u otra categoría real. |
| Emergencias por causa | `causaTipo`, `cantidadEmergencias` | Incluye todas las causas recibidas y las no informadas. MOVILIDAD_BICICLETA e INCIDENTE_VIAL no son equivalentes. |
| Despacho, general y por prioridad | `tiempoPromRespuestaDespacho`, `cantidadEmergencias` | Promedio ponderado sobre valores finitos, no negativos y con cantidad positiva; se omiten tiempos desconocidos. Sin observaciones no se muestra cero como si fuera respuesta instantánea. |
| Llegada | `tiempoPromRespuestaLugar`, `cantidadEmergencias` | Mismo criterio de ponderación; no se utiliza el tiempo de despacho como sustituto. |
| Resolución por causa | `tiempoPromResolucion`, `causaTipo`, `cantidadEmergencias` | Preparado para el JSON cuando se exponga el campo. El código de Parte 2 indica que Gold repite el promedio por causa; no acredita un promedio específico por categoría. Se agrupa por causa y no se suman minutos repetidos. |
| Criticidad por clima, caso 1 | c1 de Parte 2 | Se conserva el valor publicado; una emergencia climática no prueba por sí sola criticidad afectada. |
| Reclamos, caso 2 | c2 de Parte 2 | Se conserva el valor publicado. |
| Preventivas, caso 3 | `categoria = PREVENTIVA`, `causaTipo = EVENTO_PUBLICO`, `cantidadEmergencias` | Respaldo cuando falta c3. Cuenta emergencias preventivas, no recursos distintos ni capacidad del evento. |
| Incidentes, caso 4 | `causaTipo = INCIDENTE_VIAL`, `cantidadEmergencias` | Respaldo cuando falta c4; no afirma que el incidente esté programado, porque esa información no llega. |
| Recursos por incidente | c4b de Parte 2 | Sólo se muestra un valor explícito publicado por el backend. No se infieren recursos desde los estados ni desde la ausencia de emergencias. |
| Bicicleta, casos 5/5b | c5/c5b de Parte 2 | Se retira la tarjeta de cantidad, ya presente en el gráfico de causas. El tiempo de bicicleta permanece en su tarjeta propia sólo si no hay promedios generales disponibles. |
| Evento ciudadano, caso 6 | c6 de Parte 2 | Se conserva el valor publicado; no se reparte EVENTO_PUBLICO entre los casos 3 y 6 sin un vínculo. |

Comprobaciones del archivo y JSON inspeccionados: **186 emergencias = 174 cerradas + 11 activas + 1 sin estado**. El gráfico por categoría ahora incluye las 186. `SUM(criticidadAfectada) = 1`; circulación: **45 true, 51 false y 90 desconocidas**, ponderadas por `cantidadEmergencias`. Las 41 filas son agregados, no 41 emergencias.

El archivo completo sí contiene `tiempoPromResolucion`, aunque no se ve en todas las capturas. Su ausencia en el JSON está confirmada también en el schema público. El frontend no puede recuperar ese campo cambiando su nombre.

## Actividades: correspondencia de métricas y gráficos

| Indicador | Variables | Cálculo o alcance |
|---|---|---|
| Actividades y total del comparativo | `cantidadActividades` | Suma de todas las filas recibidas. |
| Masivas | `cantidadMasivas` | Suma del agregado; no se infiere capacidad desde una categoría. |
| Afectadas por clima | `cantidadAfectadasPorClima` | Suma de actividades marcadas por ese contador. No se sustituye por el historial climático. |
| Ciudadanos y ciudad | `organizadorTipo`, `cantidadActividades` | CIUDADANO/CIUADANO y CIUDAD; las actividades sin organizador siguen incluidas en el total. |
| Canceladas/suspendidas culturales por clima, caso 1 | `categoria`, `estado_actual`, `causaTipo`, `cantidadActividades` | CULTURAL + EVENTO_CLIMATICO + CANCELADA/SUSPENDIDA. |
| Afectadas por reclamo, caso 2 | `causaTipo = RECLAMO`, `cantidadActividades` | Actividades; no espacios distintos. |
| Masivas, caso 3 | `cantidadMasivas` | Mismo total ya agregado de actividades masivas. |
| Afectadas por incidente, caso 4 | `causaTipo = INCIDENTE_VIAL`, `cantidadActividades` | Actividades; no espacios distintos. |
| Modificadas por accidente, caso 5 | `causaTipo = ACCIDENTE_VIAL`, `cantidadActividades` | No se interpreta como reservas ni se presupone vínculo de bicicleta. |
| Ciudadanos frente al total, caso 6 | `organizadorTipo`, `cantidadActividades` | Incluye el denominador completo, ciudad y sin organizador en el detalle. |
| Cantidad por zona | `barrio`, `cantidadActividades` | Agrupa por barrio; ausentes permanecen en «Sin zona informada». |
| Cantidad por categoría | `categoria`, `cantidadActividades` | Normalización visual de variantes equivalentes y dañadas como Música/M�sica; se conserva el total. No se reescribe el Parquet. |
| Actividades afectadas por causa | `causaTipo` + `cantidadActividades`, respaldo `culture-cause` | Barras horizontales de actividades con causa informada. No equivale a sumar todos los cambios históricos. |
| Afectaciones acumuladas por causa | `totalVecesEventoClimatico`, `totalVecesReclamo`, `totalVecesIncidenteVial`, `totalVecesAccidenteVial` | El gráfico fue retirado de la pantalla el 19/11. Los contadores históricos no se usan para inflar la cantidad de actividades por causa. |

Archivo inspeccionado: **162 actividades, 56 masivas, 37 afectadas por clima, 19 de ciudadanos, 77 de la ciudad y 66 sin organizador**. Casos 1–6: **30, 16, 56, 16, 12 y 19 de 162**. Historial: **154, 54, 54 y 45** para clima, reclamos, incidentes y accidentes, respectivamente. Son poblaciones distintas.

## Reservas: columnas confirmadas, aún no entregadas por la API

`tipoReserva`, `estado_actual`, `afectada`, `accionAfectacion`, `barrio`, `cantidadReservas`, `cantidadPersonas`, `fecha_snapshot`.

- El archivo tiene 12 filas agregadas y **18 reservas**: 1 de tipo ESPACIO y 17 de tipo EVENTO.
- Estados: 11 confirmadas, 1 cancelada y 6 sin estado. No se clasifican las seis afectadas como confirmadas automáticamente.
- `afectada = true`: 6 reservas. Acciones: 2 EN_CURSO, 1 REPROGRAMADA y 3 SUSPENDIDA. `accionAfectacion` no identifica por sí sola una causa climática, vial o de bicicleta.
- `SUM(cantidadPersonas) = 31`. No son personas únicas y no hay cupo máximo: este resumen no permite reconstruir el porcentaje de ocupación de la antigua pantalla de reservas.

No se restauran ni simulan estas métricas en producción mientras no exista su JSON. No se mezclan sus 18 reservas con las 162 actividades.

## Espacios afectados: columnas confirmadas, aún no entregadas por la API

`causaTipo`, `tipoAfectacion`, `categoria`, `barrio`, `cantidadAfectaciones`, `espaciosDistintos`, `fecha_snapshot`.

- El archivo tiene 48 filas agregadas y **67 afectaciones**: 5 por clima, 25 por incidentes, 33 por reclamos y 4 sin causa.
- Por tipo: 21 ACCESO_RESTRINGIDO, 11 CERRADO y 35 USO_PARCIAL.
- `espaciosDistintos` es un distinto por segmento del agregado. Su suma aritmética es 50, pero **no acredita 50 espacios únicos globales**: sin IDs no se puede descartar repetición entre causas o tipos de afectación. Tampoco se usa `cantidadAfectaciones` como cantidad de espacios distintos.
- El archivo no incluye nombre/ID de evento, nombre/ID de espacio, inicio o fin. No permite reconstruir los paneles de eventos individuales que el usuario pidió retirar.

## Traspaso mínimo para el backend

1. Incluir `tiempoPromResolucion` en `SeguridadEmergencia` y en la respuesta principal/JSON del embed, conservando los nulos. El frontend ya interpreta el campo.
2. Para usar los dos resúmenes nuevos, el backend debe leerlos y exponer sus filas o agregados con unidades definidas. Puede extender el endpoint existente sin cambiar la autenticación; el nombre de las propiedades adicionales debe acordarse y documentarse. **Actualmente esas propiedades no existen en la respuesta.** No se invoca una ruta inventada.
3. Si se desea una tarjeta de espacios únicos por causa o global, calcular `COUNT DISTINCT espacioId` antes de perder los IDs en la agregación. El frontend no puede obtener una unión exacta sumando distintos de segmentos.
4. Mantener la separación entre actividades, reservas, afectaciones y contadores históricos. Entregar cada corte con `fecha_snapshot`; no concatenar resúmenes acumulativos superpuestos.

Se mantienen los pendientes de Reclamos/IA y las retiradas de paneles descritas en [aplicación de la auditoría](aplicacion-auditoria-2026-11-18.md). No se efectuaron modificaciones en el backend.

## Validación de esta revisión

161 pruebas unitarias y de componentes aprobadas; 8 verificaciones del embed en navegador aprobadas; builds normal/embed y validación del paquete aprobados. Lint sin errores y con nueve advertencias preexistentes. Las pantallas de Emergencias, Espacios, Reclamos y Residuos se verificaron también con el JSON autenticado capturado, sin errores de JavaScript ni desborde horizontal.

Se conservaron los archivos Gold originales y el checkout del backend sin cambios. Los lectores de Parquet, sus dependencias y las capturas no forman parte del build ni del push. Los cambios de frontend de esta revisión permanecen locales hasta publicarlos.
