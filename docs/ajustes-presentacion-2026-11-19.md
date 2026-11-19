# Ajustes de presentación de los dashboards — 19/11/2026

Se mantiene la fuente JSON del backend. No se modificaron el backend ni los Parquet; las respuestas de prueba quedan en `testingDatos/`, fuera de Git.

## Emergencias

- Se conservan total, activas, cerradas, circulación afectada y tiempos de despacho/llegada.
- Se retiran las tarjetas repetidas por causa, la tarjeta sin estado y la tarjeta general de criticidad. Los registros sin estado siguen incluidos en los totales y distribuciones.
- Los recursos por incidente vial sólo se muestran si existe un `datos[id=c4b].valor` explícito en `/analytics/emergencies/parte2`. No se deduce un cero a partir de la ausencia de emergencias por esa causa.
- Se elimina el gráfico vacío de resolución general. Sólo se muestra cuando el JSON principal contiene promedios válidos en `tiempoPromResolucion`. Mientras no exista ese campo, se conserva la tarjeta de resolución de bicicleta con el c5b recibido.
- Se retiró el sector «Emergencias con criticidad afectada» porque no habrá detalle individual. No se agrega una tabla de reemplazo; los demás gráficos permanecen.

La API consultada el 19/11 devuelve un cambio de criticidad con causa vacía y sin ID de evento, coordenadas ni criticidad anterior. Ese agregado no permite identificar las emergencias afectadas por un evento; como no habrá detalle individual, se retiró el sector sin agregar un reemplazo. El schema remoto sigue omitiendo `tiempoPromResolucion`; c5b sí está publicado en Parte 2.

## Movilidad

- Se elimina «Afectaciones de estaciones por causa» y el gráfico de viajes ocupa todo el ancho disponible.
- Se retiran de «Detalle por causa» las columnas de estaciones distintas, estaciones distintas bloqueadas y viajes. Sus campos siguen disponibles para los gráficos y métricas que los necesitan.
- Todas las tarjetas comparten una grilla de cuatro columnas y filas de igual altura; pasa a dos o una columna en pantallas más chicas.

## Espacios Públicos

- La torta se reemplaza por barras horizontales: «Cantidad de actividades afectadas por causa».
- Se prioriza `causaTipo` + `cantidadActividades` de la respuesta principal; se conserva el respaldo publicado de Parte 2 si falta ese desglose.
- Se elimina el gráfico histórico de afectaciones acumuladas. No se suma el historial de cambios como si fueran actividades distintas.

## Residuos

- Orden del detalle: AFECTADA, PROGRAMADA, CANCELADA y COMPLETADA.
- Se elimina la columna «Completadas» de la tabla. Se mantienen las filas y el total de intervenciones completadas.
- Cuando hay filtros de estado, afectación, zona, causa de programación o búsqueda, el título muestra un aviso «N detectadas». `N` suma las intervenciones de las filas filtradas, antes de paginar; no cuenta filas ni se limita a las diez visibles.
- La métrica de incidentes sigue contando intervenciones AFECTADA con causa de afectación INCIDENTE_VIAL. No se cambia por camiones ni cuadrillas.

## Validación

171 pruebas unitarias, nueve escenarios embebidos y compilaciones de producción/embed aprobados. Navegación con respuestas reales capturadas en cinco dashboards, comprobando filtros, paginación, contador ponderado del detalle, tarjetas de Movilidad del mismo tamaño y ausencia de desbordamiento de página en escritorio y móvil.
