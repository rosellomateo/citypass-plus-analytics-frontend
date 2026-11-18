# Validación de métricas — 18/11/2026

Consulta de la API desplegada: 14:21 UTC (11:21 de Argentina). Se compararon sus JSON con los adaptadores del frontend local. Los resultados corresponden a ese corte y no demuestran que estos cambios locales ya estén desplegados.

## Resultado por pantalla

| Pantalla | Respuesta real y comprobación | Resultado |
|---|---|---|
| Reclamos | `/analytics/reclamos`: 200, 40 filas agregadas, 44 reclamos. | Total conciliado. Se corrigieron estados y población del promedio de resolución. Quedan 10 creados, 15 en curso, 12 cerrados y 7 cancelados. |
| Movilidad | `/analytics/movilidad-urbana`: 200, 1.073 filas agregadas, 1.473 viajes. | Total conciliado; promedio ponderado 22,7 min. Se unificaron `>1hs`/`>1h`: 39 viajes de más de una hora. El snapshot sigue siendo 14/11/2026. |
| Espacios Públicos | `/analytics/espacios-cultura`: 200, 112 filas, 128 actividades; 49 masivas y 37 afectadas por clima. | Las sumas generales y la distribución por categoría concilian con el JSON. Los 37 afectados por clima no son los 30 culturales cancelados publicados en c1: tienen poblaciones diferentes. |
| Emergencias | `/analytics/seguridad-emergencias`: 200, 34 filas, 162 emergencias. | El total concilia, pero hay clasificaciones incompletas; ver pendientes. |
| Login | `/analytics/identidad`: 200, 36 filas. | El último corte contiene 18 inicios, 67 renovaciones y 11 cierres. Se corrigió la fecha del encabezado para aceptar snapshots con fecha y hora. |
| Residuos | `/analytics/residuos`: **500**. `/analytics/waste/parte2`: 200, pero `datos: []`, `resumen_gold: []`, `fecha_snapshot: null`. | **Validación del nuevo esquema pendiente de una respuesta utilizable.** El 500 no permite atribuir la causa exacta al cambio de columna sin revisar el error del servidor. |
| Analítica Urbana / EDA | La portada de Analítica es navegación y contratos. EDA ya no tiene dashboard. | No hay agregado general adicional que conciliar en estas pantallas. |

## Residuos: contrato confirmado

El usuario confirmó **`causaProgramada`** como nombre definitivo, aunque la captura anterior decía `causaProgramacion`. El frontend no lee el Parquet directamente: los cambios deben reflejarse en el JSON que produce la API.

| Dato | Uso correcto |
|---|---|
| `causaProgramada` | Motivo de programación de la intervención. Para la torta `waste-cause`, agrupar por este campo y sumar `cantidadIntervenciones` en el corte publicado. |
| `causaTipoAfectacion` | Motivo que afectó a la intervención; no reemplazarlo por el motivo de programación. |
| `estado_actual = AFECTADA` | Estado requerido para el indicador de paradas afectadas por incidente vial. `CANCELADA` no suma, aunque tenga `INCIDENTE_VIAL`. |
| `cantidadAfectadas` | Cantidad agregada a sumar en las filas AFECTADA y `causaTipoAfectacion = INCIDENTE_VIAL`, siempre que el productor haya deduplicado por `intervencionId` y entregue un corte sin superposición. |
| `intervencionId` | Si se entregan eventos individuales: contar IDs distintos que cumplan estado y causa; los reintentos con otro `eventId` no agregan paradas. |
| `camionesDistintos` / `camionId` | No representan paradas ni recorridos y no se usan para reconstruir esa métrica vial. |
| `origenProgramacion` | Es un dato separado; no inferir automáticamente operación normal de una causa nula. En la captura existen orígenes ALERTA y EMERGENCIA sin causa de programación. |
| `fecha_snapshot` | Identifica el corte. No sumar cortes históricos que se superponen. |

En la fila visible `AFECTADA / INCIDENTE_VIAL`, `cantidadAfectadas = 6`: esa fila aporta **6 intervenciones**, no los 2 camiones. La fila `CANCELADA / INCIDENTE_VIAL` aporta cero al indicador. La fila AFECTADA sin causa no puede atribuirse a un incidente. Esto no confirma el total del archivo completo, porque la imagen puede ser un extracto.

El frontend conserva el valor publicado en `datos[id=c4].valor` como fuente principal. Si se proporcionan envelopes individuales en `intervenciones`, ahora reconoce `data.causaTipoAfectacion`, respeta un null explícito y sólo usa `data.causaTipo` como compatibilidad cuando falta el nuevo campo. `data.causaProgramada` nunca se usa como causa de afectación. Esta compatibilidad no obliga a cambiar el contrato del evento original.

La torta no se calcula leyendo columnas del Parquet en el navegador: utiliza `resumen_gold[id=waste-cause].puntos`. La API debe publicar esos puntos con la nueva columna; un cambio de tipos TypeScript no corrige esa agregación del servidor.

Los 28 de una porción Evento público, cuando estaban publicados, eran **intervenciones**, no necesariamente 28 eventos o recorridos distintos. El nuevo agregado mostrado tampoco contiene nombres ni IDs de eventos o recorridos: no alcanza para reconstruir su lista. Para esa lista se necesitan vínculos explícitos o coordenadas/trazados y horarios; se mantiene el [contrato territorial documentado](contrato-contexto-territorial.md).

## Pendientes de Emergencias y relaciones territoriales

- Estados recibidos: 154 cerradas/descartadas/canceladas/resueltas; 6 PENDIENTE; 1 VALIDADA; 1 sin estado. El código actual incluye esa última entre las 8 activas. No puede certificarse que sea activa sin confirmar el dato en origen o acordar una categoría sin estado.
- 89 emergencias llegan sin categoría. El gráfico por categoría y prioridad representa 73 con clasificación utilizable, no las 162. Es un faltante de clasificación que debe resolverse o representarse explícitamente como no informado antes de exigir que ese gráfico concilie con el total.
- La API no entrega `tiempoPromResolucion` por categoría. El valor 866 de c5b corresponde al promedio publicado del caso de bicicleta; no valida un promedio global de todos los tipos.
- Los cinco endpoints de Parte 2 consultados no contienen `contexto_territorial`. Los agregados no permiten confirmar por sí solos distancias de 500 m, nombres de eventos, recorridos o criticidad elevada. El ejemplo territorial local no demuestra cobertura en producción.

## Correcciones locales y alcance de las pruebas

Reclamos normaliza RESUELTO como cerrado y EN_PROCESO/EN_REVISION como en curso. El promedio general y el de categoría sólo usan resueltos/cerrados con tiempo finito, no negativo y cantidad positiva. Los cuatro reclamos CERRADO sin tiempo no se convierten en cero: el promedio comprobado sobre los ocho con tiempo es **82,0**, en la unidad que entrega `tiempo_prom_hasta_estado_actual` (la pantalla la denomina horas).

Movilidad conserva los datos originales y agrupa visualmente las etiquetas equivalentes de más de una hora. Login admite la fecha del snapshot con o sin hora. Residuos distingue programación de afectación en el fallback de eventos individuales. Las pruebas cubren estados, medias ponderadas, nulos, cantidades, reintentos y separación de causas.

Las capturas JSON, scripts de consulta y datos del mock se conservan sólo en `testingDatos/`, ignorado por Git. No se modificaron Parquet ni el repositorio del backend.

Validación técnica previa a publicar: **150 pruebas aprobadas** en 21 archivos; build de producción aprobado; lint sin errores, con nueve advertencias preexistentes. El despliegue queda sujeto al proceso de revisión y merge del equipo.
