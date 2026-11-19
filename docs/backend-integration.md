# Integración con el backend

La respuesta actual de Residuos contiene **intervenciones traducidas al DTO antiguo de alertas**. Movilidad entrega afectaciones por causa. El contrato vigente y los cálculos verificados están en [Residuos y Movilidad: JSON real](contrato-residuos-movilidad-api.md); esa revisión reemplaza las descripciones históricas de alertas, viajes por estación y recorridos que siguen debajo.

## Requisitos para una prueba local

1. Backend disponible en `http://localhost:8000`.
2. `CORS_ALLOWED_ORIGINS=http://localhost:5173` en el backend.
3. Frontend configurado con `VITE_DATA_SOURCE=api`.
4. `VITE_API_BASE_URL=http://localhost:8000` en el frontend.

El frontend invoca al backend directamente desde el navegador. La URL base no
debe terminar con una ruta de analítica y puede llevar o no una barra final.

En modo API, cada solicitud incluye `Authorization: Bearer <access-token>`.
Configurar CORS para permitir ese encabezado desde el origen del portal.

Un `401` hace que el navegador use el refresh token contra el IdP, nunca contra
esta API, y reintente una sola vez. El backend debe devolver `403` cuando el
token sea válido pero sus grupos no alcancen para el dominio solicitado.

## Mapeo de pantallas y endpoints

| Pantalla | Endpoint del backend |
| --- | --- |
| Reclamos | `GET /analytics/reclamos` |
| Emergencias | `GET /analytics/seguridad-emergencias` |
| Movilidad | `GET /analytics/movilidad-urbana` |
| Espacios y cultura | `GET /analytics/espacios-cultura` |
| Residuos | `GET /analytics/residuos` |
| Login Federado | `GET /analytics/identidad` |
| Impactos por tablero | `GET /analytics/{area}/parte2` |

El perfil de sesión se consulta en `GET /me` de Login/LDAP, con la base
`VITE_IDP_BASE_URL`. No es un endpoint del backend de Analítica ni utiliza
`VITE_API_BASE_URL`. Login, perfil, refresh y logout se dirigen al IdP;
las consultas `/analytics/*` siguen utilizando el backend de Analítica.

El tablero de Login muestra el último corte del resumen de autenticación.
Los totales y el gráfico usan eventos agregados por departamento.

### Indicadores de la Parte 2

El backend busca `parte2/{area}.json` en Gold, donde `area` es `claims`,
`emergencies`, `mobility`, `culture` o `waste`. Ejemplo:

```json
{
  "fecha_snapshot": "2026-11-12",
  "datos": [
    { "id": "c1", "valor": 6, "unidad": "reclamos" }
  ]
}
```

En los cinco módulos del modelado, `c1` a `c6` identifican los seis casos en
el orden del documento. Emergencias admite `c4b` para recursos despachados
y `c5b` para tiempo hasta resolución. `detalle` admite una lista de objetos
con `etiqueta` y `valor` para comparaciones y desgloses.
Puede incluir `informe` con el mismo contrato de análisis de los demás tableros.

Si el JSON aún no existe, el backend puede derivar algunos indicadores de
Emergencias cuando su resumen Gold incluye `causaTipo`.
Los tableros muestran las métricas publicadas, incluidos los ceros reportados.

### Presentación de los seis casos

Los tableros consultan los impactos cada 15 segundos mientras están abiertos.
Los cambios aparecen en los gráficos y las tarjetas del módulo después de que
el pipeline publica los datos. Los gráficos indican la fecha del corte si está
disponible y muestran el período del corte publicado.

Si el backend todavía no tiene registrada la ruta y devuelve 404, se detiene
el polling de esa área para no repetir el mismo error cada 15 segundos. Se puede
reintentar manualmente donde la pantalla lo permita o recargarla después del
despliegue; una respuesta correcta reactiva el refresco. Los fallos transitorios
siguen reintentándose y conservan el último corte disponible. Sin indicadores
publicados, el backend devuelve `datos: []` y las tarjetas no inventan valores.
El modo embed usa el payload primario inyectado. Las consultas y los gráficos
de Parte 2 se habilitan en el portal y en la vista previa local.

Para Espacios Públicos, los JSON agregados deben incluir `"version_cultura": 2`.
El backend puede calcular los indicadores desde un corte acumulado del endpoint
HTTPS definido en `PART2_EVENTS_URL`. Si la variable está vacía, lo busca en el
blob de Gold indicado por `PART2_EVENTS_BLOB` (por defecto,
`parte2/eventos.json`). El corte debe tener este formato:

```json
{
  "actualizado_en": "2026-11-13T15:05:00Z",
  "cobertura": ["culture", "emergencies", "waste", "claims", "mobility"],
  "casos_por_referencia": { "id-de-la-actividad-del-festival": 3 },
  "eventos": []
}
```

`cobertura` indica qué conjuntos están completos para el período publicado.
Cada evento conserva `metadata.eventId`, `metadata.eventType` y `data`. En
Espacios el caso 1 cuenta cancelaciones por `EVENTO_CLIMATICO`, los casos 2 y 4
cuentan espacios distintos por causa, el caso 3 cuenta actividades creadas con
capacidad de al menos 500 y el caso 5 cuenta actividades distintas modificadas
por `ACCIDENTE_VIAL`. El caso 6 muestra actividades de ciudadanos, de la ciudad
y el total del corte. Se acepta `CIUADANO` como variante de `CIUDADANO`.

En Residuos, `waste` incluye `com.citypass.residuos.IntervencionProgramada` y
`com.citypass.residuos.IntervencionActualizada` en el mismo corte. Los casos
1, 2, 3 y 6 cuentan `camionId` distintos por causa. El caso 1
requiere `estadoNuevo = AFECTADA`. Con cobertura de Reclamos, el caso 2
vincula `causaId` con `reclamoId` de v3 y desglosa cuadrillas por barrio.
El caso 5 compara `intervencionId` distintos vinculados a una emergencia con
los vinculados a una alerta. Una intervención con ambos vínculos integra
ambas series según el contrato.

Para el caso 4, Residuos presenta una única métrica,
**Intervenciones afectadas por incidentes viales**, en `datos[id=c4].valor`
de `GET /analytics/waste/parte2`. Se calcula con
`com.citypass.residuos.IntervencionActualizada`, filtrando
`estadoNuevo = AFECTADA` y `causaTipo = INCIDENTE_VIAL`, y contando
`intervencionId` distintos. Cada intervención representa una parada.
Los reintentos del gateway pueden cambiar `eventId`, por lo que ese campo
no es la clave del conteo. Se excluyen las actualizaciones `CANCELADA`,
aunque su causa sea `INCIDENTE_VIAL`. El conteo no depende de `camionId`.
Si se publica un desglose diario, se agrupa por la fecha de `updatedAt`
y se deduplica `intervencionId` dentro de cada día.

El valor esperado para las dos intervenciones del 16/11, con prefijos
`2708ffe6…` y `8ceb91e9…`, es 2. El frontend muestra el agregado publicado
por el backend. Si falta `c4`, muestra «Sin datos». Los totales generales
de intervenciones por causa no permiten reconstruir este conteo.

Reclamos usa `com.citypass.reclamos.ReclamoCreado.v3`. Los casos 1 y 3
cuentan reclamos distintos con `alertaId` y `actividadId`, respectivamente.
El caso 4 requiere vínculos a incidentes de Movilidad creados con estado
`PROGRAMADO`. El aviso v3 indica que Reclamos todavía carece de datos para
vincular reservas por cercanía (caso 6). Para Movilidad, la cobertura
`mobility` permite calcular los cinco conteos de estaciones distintas a
partir de `com.citypass.movilidad.EstacionUrbanaAfectada`. Las comparaciones
del caso 5 de Reclamos y Movilidad pueden llegar en sus JSON agregados.

Para EDA y Espacios Públicos, el evento `EmergenciaVinculadaAContextoZona`
agrupa emergencias distintas por `referenciaExterna`, el ID del evento público.
El cálculo usa vínculos de origen Espacios y excluye el backfill.
Para probar el radio, publicar primero el contexto de Espacios y luego crear
una emergencia dentro del radio y durante su vigencia.

El reporte de Emergencias incluye `emergencias_zona`, con una fila por
emergencia y evento público. Conserva `radioMetros` y `vinculadaEn` y
completa tipo, sector, criticidad y estado con los eventos de Emergencias.
El cambio de criticidad se confirma cuando una actualización declara las
prioridades anterior y nueva y referencia el mismo contexto o evento.

Espacios Públicos y Residuos reciben `eventos_zona`. El selector usa el
período del tablero y permite filtrar por lugar. El backend agrega registros
distintos con un vínculo directo o con posición y hora dentro del radio y
la vigencia del evento. El radio se toma del evento o de los vínculos del
gateway. Si hay radios diferentes, se conservan los valores publicados y el
conteo geográfico queda sin calcular hasta disponer de un radio único.
Cada métrica sin datos suficientes viaja como `null`. Residuos recibe sus
conteos de alertas e intervenciones y Espacios Públicos también recibe los
conteos de emergencias, estaciones afectadas y reclamos.

Los nombres y contratos del backend se mantienen en `src/api/types.ts`. La capa
`src/dataSources/apiAnalyticsDataSource.ts` convierte esos registros al modelo
que las pantallas ya utilizan.

### Cortes Gold de la Parte 2

El endpoint de Parte 2 expone `resumen_gold` junto a los indicadores derivados
de eventos. Cada gráfico informa su `fecha_snapshot`. Se usa el último
snapshot del archivo general de cada familia. Los archivos semanales son
cortes separados y sus totales pueden contener registros del mismo período.

| Tablero | Fuente y métricas |
| --- | --- |
| Espacios Públicos | `actividades_resumen`: actividades por causa, masivas por barrio y tipo de organizador |
| Residuos | `intervenciones_resumen`: intervenciones totales y afectadas por causa. `alertas_resumen`: alertas por zona |
| Movilidad | `movilidad_resumen`: estaciones distintas, bloqueos, afectaciones preventivas y viajes interrumpidos por causa. `viajes_resumen` alimenta los gráficos de viajes |
| Emergencias | `emergencias_resumen`: cantidad y criticidad afectada por causa |
| Reclamos | `reclamos_resumen`: reclamos por causa y reclamos de tránsito o baches por barrio |
| Login | `autenticacion_resumen`: ingresos, renovaciones y cierres por departamento |
| EDA | El corte de eventos alimenta `tipos_recibidos`, deduplicado por `eventId`. Distribuidos y pendientes requieren datos publicados por EDA |

Los agregados Gold por causa no identifican qué registro fue provocado por un
evento en particular. El desglose por evento usa los IDs de los eventos o la
posición, hora y radio informados. Los conteos de estaciones distintas se
conservan en el nivel publicado.

Los filtros por estación y zona usan `afectaciones`, calculado a partir de
`EstacionUrbanaAfectada` e intervenciones con zona publicada o con una alerta
vinculada que informa la zona. El resumen general de los Parquet de Movilidad
e intervenciones carece de ese desglose.

El detalle de estaciones cruza `EstacionUrbanaAfectada` con
`EstacionUrbanaRestaurada` por `afectacionId`. El detalle de recorridos requiere
un `recorridoId` o `rutaId`, un evento identificado y una afectación explícita
del recorrido. Una intervención programada por sí sola no acredita un cambio.
Los recorridos afectados por causas como clima o incidentes llegan en
`afectaciones.recorridos_efectos`. El tipo proviene del efecto publicado o del
evento causal vinculado. El contador reúne ambas listas por identificador de recorrido.
El panel de impacto por evento público fue retirado de Espacios Públicos.
En Emergencias, la lista usa el aumento registrado por el productor. La
repetición de una causa requiere una confirmación explícita y los promedios
del Parquet no acreditan la atención de un caso individual.

### Reclamos

Los registros agregados del backend alimentan los KPI, gráficos y tabla. El
campo `row_count` representa la cantidad de reclamos del agregado.

### Emergencias

Estado, prioridad, categoría publicada y tiempos de despacho se calculan desde la API.

### Movilidad

El backend entrega viajes agregados. Los informes ejecutivo y de IA no se
muestran en modo API porque el contrato actual no incluye esos reportes.

### Espacios públicos y cultura

El adaptador reconoce el resumen de actividades de Gold y el contrato anterior de reservas.

### Residuos

La pantalla muestra alertas agregadas, intervenciones y recorridos publicados.

## Prueba manual

Primero comprobar el backend:

```bash
curl --fail http://localhost:8000/health
curl --fail -H "Authorization: Bearer <access-token>" http://localhost:8000/analytics/reclamos
```

Comprobar el perfil de sesión por separado en Login/LDAP:

```bash
curl --fail -H "Authorization: Bearer <access-token>" https://api.citypass-login.pp.ua/me
```

Luego iniciar el frontend:

```bash
npm run dev
```

Abrir las pantallas desde <http://localhost:5173/analytics>. En las herramientas
del navegador, la pestaña Network debe mostrar solicitudes `GET` a la URL base
configurada.

## Diagnóstico rápido

| Síntoma | Verificación |
| --- | --- |
| Falta configurar `VITE_DATA_SOURCE` | Crear `.env.local` y reiniciar Vite. |
| Falta configurar `VITE_API_BASE_URL` | Definir una URL absoluta y reiniciar Vite. |
| `Failed to fetch` | Revisar que el backend esté iniciado, la URL sea correcta y CORS permita el origen. |
| La API responde 4xx o 5xx | Probar el mismo endpoint con curl o Postman y revisar los logs del backend. |
| No aparecen datos para un período | Revisar `fecha_snapshot` y los filtros activos. |

No hay fallback automático de API a mock. Un error real se presenta como error,
no como datos de demostración.


## Ajustes del frontend verificados contra el deployment (18/11/2026)

- Se retiraron el tablero, la ruta y la navegación de EDA. Esto no modifica los servicios de eventos del proyecto.
- Las pantallas muestran el corte completo publicado. No hay selectores de tiempo ni un filtro oculto de siete días.
- El refresco de Parte 2 conserva los datos visibles durante la solicitud. Los gráficos no vuelven a animarse en cada actualización.
- Las categorías de actividades se agrupan al presentar los datos, sin modificar el JSON recibido ni los Parquet: Cultura/CULTURAL, diferencias de mayúsculas, espacios y la variante dañada M�sica.
- Las actividades por organizador pueden obtenerse de `organizadorTipo` y `cantidadActividades` del resumen de actividades.

### Emergencias: alcance de los datos

La respuesta real de `/analytics/seguridad-emergencias` incluye `causaTipo`.
El gráfico de vínculos agrupa todas las causas recibidas, incluyendo las no informadas.
Se presenta como **Emergencias por causa**, inmediatamente después de las tarjetas principales,
usando `SUM(cantidadEmergencias)` por `causaTipo` del endpoint principal.
`MOVILIDAD_BICICLETA` se presenta separado de `INCIDENTE_VIAL`; no se infiere la causa a partir de la categoría TRANSITO.
El corte consultado tiene cinco emergencias de bicicleta y ninguna fila con causa INCIDENTE_VIAL.

Si llega `tiempoPromResolucion`, se calcula el promedio por causa ponderando por
`cantidadEmergencias`, excluyendo los valores ausentes. El endpoint actual no trae ese campo.
La métrica c5b corresponde solamente a bicicletas y se mantiene en su tarjeta específica;
no llena el gráfico general de resolución ni se utiliza como tiempo de despacho. El valor de 866 min
correspondía al corte anterior; no se conserva como constante en el frontend.

### Residuos: paradas y recorridos

El evento `com.citypass.residuos.IntervencionActualizada` suministrado identifica una
intervención/parada, un camión, su estado, causa y actualización. No identifica recorrido,
zona, nombre del evento ni sus horarios. No se usa `camionId` ni `intervencionId` como ID de recorrido.

El frontend conserva el soporte para los detalles opcionales `afectaciones.recorridos_eventos`
y `afectaciones.recorridos_efectos`. El deployment consultado no entrega esos campos.
Si una fuente proporciona los envelopes originales en `intervenciones`, se puede calcular
la cantidad de paradas AFECTADA deduplicadas por `intervencionId`. No se muestran como recorridos.
Este campo opcional se usa en el mock local con el ejemplo suministrado; no se asume que
ya exista en el contrato del endpoint de producción y no se agrega otra solicitud HTTP.
La métrica c4 publicada tiene prioridad; si está ausente y existen los envelopes,
se cuentan IDs distintos con `estadoNuevo = AFECTADA` y `causaTipo = INCIDENTE_VIAL`.
Los reintentos con otro `eventId` y las intervenciones CANCELADA no suman.

Los ejemplos y respuestas de comparación permanecen en `testingDatos/`, ignorado por Git
y excluido del build y del deployment. No se modificó ningún archivo del backend ni Parquet.

### Cobertura visible de los casos de uso

Reclamos presenta tarjetas para `causaTipo = INCIDENTE_VIAL` y `RESERVA`, sumando
`row_count` del endpoint principal. Esos dos valores prevalecen sobre c4/c6 cuando existe
el campo. El caso 2 mantiene el agregado `datos[id=c2]` de reclamos distintos vinculados
a acciones de otros servicios; no se reconstruye a partir de la causa de origen.

Si faltan c2/c3/c4/c6 de Movilidad, se usan respectivamente los puntos Reclamo,
Evento público, Incidente vial y Reserva de `resumen_gold[id=mobility-stations]`.
Reserva y Evento público quedan separados en esas tarjetas, aunque la torta agrupe sus etiquetas.
Los valores explícitos publicados, incluido cero, tienen prioridad sobre el respaldo.
La tarjeta de afectación prevista utiliza el criterio EVENTO_PUBLICO solicitado; ese agregado
no acredita por sí solo que el evento sea masivo ni permite calcular cuándo empezará.

Movilidad separa c5 (viajes interrumpidos por accidente en bicicleta) del detalle de viajes
finalizados normalmente. No utiliza todas las interrupciones viales como sinónimo de bicicletas.
Espacios Públicos compara los organizadores CIUDADANO/CIUADANO y CIUDAD con el total del
mismo resumen principal, conservando en el total las actividades sin organizador informado.

Los indicadores pendientes de Reclamos, Emergencias y Movilidad permanecen visibles como
«Sin datos» cuando no existe un valor verificable. No se agregan endpoints ni datos sintéticos
al flujo de producción. Ver [cobertura y validación](cobertura-casos-dashboard.md).


### Presentación de tablas, filtros y rangos

El gráfico de inicios de viajes muestra estaciones con más de tres viajes por defecto.
Al escribir en la búsqueda, incluye todas las coincidencias por nombre, incluso con tres
viajes o menos. La búsqueda ignora mayúsculas y tildes; no cambia los KPI ni otros gráficos.

La tabla de alertas usa filtros locales de zona, prioridad y tipo de alerta. Ordena
Crítica, Alta, Media y Baja, conserva la paginación de diez filas y formatea los tiempos
con un máximo de dos decimales. Las filas recibidas no se modifican.
Los rangos de llenado se muestran como porcentajes; los valores ausentes (SIN RANGO)
no forman una porción de la torta, pero sus alertas se conservan en la tabla y los totales.
El filtro de zona de esa torta es independiente de los filtros de la tabla.

En Espacios Públicos se retiró la tarjeta genérica de espacios afectados y se movieron
las métricas de cancelaciones por clima y modificaciones por accidentes a la grilla superior.
La sección Impacto sobre eventos públicos utiliza los eventos identificados en
`eventos_zona`/`eventos_publicos`. El detalle y el filtro no se obtienen de un conteo agregado.
Las causas por evento sólo pueden filtrarse si se publica el desglose opcional `causas`;
`efecto` y `descripcion_efecto` se muestran únicamente si llegan informados.
No se infiere una afectación a partir de la cercanía o del nombre del evento.

En Residuos queda una sola lista de eventos y recorridos, con diez filas por página.
Los nombres se leen del vínculo publicado o de un catálogo con el mismo evento_id.
No se fabrican 28 nombres a partir de las 28 intervenciones agregadas por EVENTO_PUBLICO.
La sección separada Efectos sobre el recorrido fue eliminada.

### Verificación de los Parquet de Residuos suministrados

`intervenciones_resumen.parquet` (corte 17/11/2026) y el corte de semana 46
contienen únicamente `estado_actual`, `causaTipo`, `cantidadIntervenciones`,
`cantidadAfectadas` y `fecha_snapshot`. Para EVENTO_PUBLICO, el corte del 17/11
informa 14 AFECTADA y 12 PROGRAMADA: 26 intervenciones. No son 26 eventos identificados.
La respuesta del deployment del día 18 informa otro corte agregado (28); no se
sustituye ese dato más reciente por la suma del archivo anterior.

Los resúmenes de alertas de semanas 38–45 contienen zona, tipo, prioridad, rango
de llenado, cantidades y promedio de resolución. Ninguno aporta la relación
entre evento y recorrido. `rangoNivelLlenado = null` representa una medición no informada.
Estos cortes son acumulados y no se suman entre semanas para obtener el total actual.

Para completar la tabla por evento se necesita un detalle con la relación publicada
entre `evento_id` y `recorrido_id`, más sus nombres cuando estén disponibles.
El frontend lo admite en `afectaciones.recorridos_eventos`; no deduce esos vínculos
usando la zona, el camión ni el total de intervenciones. La inspección y las copias
JSON quedan en testingDatos, ignorado por Git. Los Parquet originales se conservaron intactos.

## Impacto territorial de eventos públicos

Se incorporó el cálculo en el navegador con coordenadas WGS84, distancia a puntos
 y al trazado completo de los recorridos, radio por defecto de 500 metros y
coincidencia temporal. La zona/barrio se utiliza para agrupar y filtrar, no como
sustituto de coordenadas. El detalle puede incorporarse en el campo opcional
`contexto_territorial` de la respuesta de Parte 2, sin otro endpoint.

El contrato completo, la propuesta de endpoint separado y un ejemplo de respuesta
están en [contrato-contexto-territorial.md](contrato-contexto-territorial.md).
Los agregados Parquet actuales no contienen la geometría y los IDs necesarios.
Los ejemplos del mock quedan en testingDatos; no se modificó el backend.
