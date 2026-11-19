# Aplicación de la auditoría de tableros

Fuente: «Informe auditoria tableros 2026-11-18.md» entregado por el usuario. Esta revisión modifica exclusivamente el frontend. No modifica repositorios del backend, archivos Parquet ni procesos de IA.

**Ampliación posterior:** se inspeccionaron también los nuevos archivos de reservas y espacios afectados y el código remoto del backend. Ver [contrato completo y endpoints verificados](contrato-emergencias-espacios-gold.md). Esos dos archivos existen en Gold pero aún no salen en el JSON del servicio actual.

## Paneles retirados

- Residuos: «Eventos que están afectando los recorridos», incluidos filtros, tabla y enlace desde su tarjeta superior.
- Espacios Públicos: «Eventos públicos y sus afectaciones» e «Impacto por evento público», según la aclaración del usuario. También se retiran el filtro por evento y los enlaces asociados a esos paneles.
- Se conservan el gráfico general de causas de Espacios y las métricas válidas de Residuos. Las estructuras opcionales de detalle siguen siendo compatibles con otros componentes; no se alteran datos recibidos.

## Espacios Públicos: sólo actividades

El tablero utiliza `actividades_resumen`, entregado como JSON en `/analytics/espacios-cultura`. Se retiró la rama visual de reservas para no mezclar poblaciones. Los seis casos se calculan con las filas recibidas y permanecen visibles aunque falte el ID correspondiente en Parte 2.

| Caso | Tarjeta | Cálculo |
|---|---|---|
| 1 | Eventos culturales cancelados por clima | Suma de `cantidadActividades` para `categoria = CULTURAL`, `causaTipo = EVENTO_CLIMATICO` y estado CANCELADA o SUSPENDIDA. |
| 2 | Actividades afectadas por reclamos | Suma de `cantidadActividades` para `causaTipo = RECLAMO`. No se cuentan espacios distintos ni barrios. |
| 3 | Actividades masivas creadas | Suma de `cantidadMasivas`. |
| 4 | Actividades afectadas por incidentes viales | Suma de `cantidadActividades` para `causaTipo = INCIDENTE_VIAL`. |
| 5 | Actividades modificadas por accidentes viales | Suma de `cantidadActividades` para `causaTipo = ACCIDENTE_VIAL`. |
| 6 | Actividades organizadas por ciudadanos frente al total | Suma de `cantidadActividades` para CIUDADANO/CIUADANO, con el total completo, ciudad y sin organizador en el detalle. |

Los cálculos del resumen de actividades tienen prioridad sobre métricas antiguas calculadas desde espacios o reservas. Si una columna necesaria no llega en un contrato antiguo, no se atribuye una causa inexistente. La torta «Causas de afecto» muestra `culture-cause`; si ese agregado no existe, usa la distribución por causa del mismo resumen de actividades. No depende de listas de eventos individuales.

## Emergencias

- Las filas sin estado se cuentan en «Emergencias sin estado». Siguen incluidas en el total, pero no en activas. No se descarta la fila ni se modifica el valor recibido.
- Cuando falta c3 en Parte 2, se suma `cantidadEmergencias` para PREVENTIVA + EVENTO_PUBLICO. La tarjeta se llama «Emergencias preventivas por eventos públicos»: esa tabla cuenta emergencias y no confirma recursos distintos despachados ni capacidad del evento.
- Cuando falta c4, se suman las emergencias con INCIDENTE_VIAL. El nombre no afirma que el incidente esté programado, porque esa condición no llega en el resumen.
- c4b puede mostrar cero cuando no existen emergencias con INCIDENTE_VIAL. Si existen, el estado actual por sí solo no permite reconstruir recursos distintos enviados; en ese caso se necesita el agregado publicado por la API. No se confunden emergencias despachadas con cantidad de recursos.
- Los valores explícitos de Parte 2 conservan prioridad sobre estos respaldos, incluido cero.
- El gráfico de resolución acepta `tiempoPromResolucion` y agrupa por causa, que es el nivel al que Gold repite ese promedio. **Sigue pendiente que el backend exponga el campo.** El promedio de bicicleta no llena el gráfico general de causas.

## Reclamos

«TEXTO» se excluye de la distribución por categoría y de su selector. Los totales generales y los registros originales se conservan: ocultar una categoría de prueba no elimina su cantidad del JSON recibido.

El caso 5 se verifica con `vinculadoEmergenciaBici`:

- Numerador: suma de `row_count` con vínculo explícito `true`.
- Comparación: suma de `row_count` de BACHES o TRANSITO con vínculo explícito `false`.
- No se usa EMERGENCIA como sustituto del vínculo ni se comparan todos los demás reclamos.
- Si faltan los booleanos o son nulos, no se presenta como verificado el c5 anterior. La tarjeta indica «Sin datos» y el gráfico omite esa comparación. El resto de los casos permanece disponible.

## Pendientes concretos para el backend

Estos puntos son un traspaso de información; no se implementaron en el backend:

1. Exponer `tiempoPromResolucion: number | null`, en minutos, en cada agregado de `/analytics/seguridad-emergencias` y en el JSON de Emergencias inyectado en el embed. No convertir un tiempo desconocido a cero.
2. Exponer `vinculadoEmergenciaBici: boolean` en cada agregado de `/analytics/reclamos` y su JSON del embed. El campo ya existe en gold según la auditoría. Mantener los grupos necesarios para que `row_count` no mezcle vinculados y no vinculados en una misma fila.
3. Corregir c5 en `/analytics/claims/parte2` para otros consumidores: mismo vínculo booleano y comparación limitada a BACHES/TRANSITO no vinculados. El frontend no puede validar el criterio sólo porque coincida el número.
4. Publicar c3/c4 de Emergencias en Parte 2 con los criterios anteriores; para c4b, acordar la fuente y unidad de recursos cuando haya incidentes. Los respaldos del frontend no sustituyen esa definición.
5. Publicar opcionalmente `claims-cause` sin la categoría de prueba. El frontend puede mostrarlo cuando llegue; no crea una lista de eventos desde un total agregado.
6. Actualizar los informes de IA desde su proceso habitual. El navegador continúa representando `informe`; no genera ni reescribe esos informes.

## Contraste con la API desplegada

Consulta: **18/11/2026 a las 21:55 de Argentina** (19/11 a las 00:55 UTC), posterior al corte revisado en la auditoría. Los cambios de cifras se conservan: no se fuerzan los valores del informe como constantes del producto.

- Espacios: 162 actividades; casos 1–6 = **30, 16, 56, 16, 12 y 19 de 162**; ciudad 77 y sin organizador 66.
- Emergencias: **186 = 174 cerradas + 11 activas + 1 sin estado**. Preventivas vinculadas a eventos públicos: 28. Incidentes viales: 0; recursos asociados: 0 por ausencia de incidentes.
- Reclamos: 68 y promedio general de resolución 44,5 h. La API aún no expone `vinculadoEmergenciaBici`: comparación del caso 5 pendiente, sin reutilizar el cálculo incorrecto anterior.
- Emergencias aún no expone `tiempoPromResolucion`; no se puede verificar el promedio de todos los tipos desde el endpoint actual.
- Residuos responde HTTP 200 en esta consulta; no se conserva como diagnóstico vigente el error HTTP 500 observado en revisiones anteriores.

Las capturas, scripts y ejemplos del mock se conservan en `testingDatos/`, ignorado por Git y Docker. Las pruebas incluyen los valores de referencia de la auditoría —161 actividades, 179 emergencias y 57 reclamos— para verificar las fórmulas con una población fija, además del contraste con la API actual.
