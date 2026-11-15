# Integración con el backend

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
| EDA e impactos por tablero | `GET /analytics/{area}/parte2` |

El perfil de sesión se consulta en `GET /me` de Login/LDAP, con la base
`VITE_IDP_BASE_URL`. No es un endpoint del backend de Analítica ni utiliza
`VITE_API_BASE_URL`. Login, perfil, refresh y logout se dirigen al IdP;
las consultas `/analytics/*` siguen utilizando el backend de Analítica.

El tablero de Login muestra el último corte del resumen de autenticación.
Los totales y el gráfico usan eventos agregados por departamento.

### Indicadores de la Parte 2

El backend busca `parte2/{area}.json` en Gold, donde `area` es `claims`,
`emergencies`, `mobility`, `culture`, `waste` o `eda`. Ejemplo:

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
con `etiqueta` y `valor` para comparaciones y desgloses. EDA usa los
identificadores `received`, `delivered`, `pending` y, si se publica, `critical`.
Puede incluir `informe` con el mismo contrato de análisis de los demás tableros.

Si el JSON aún no existe, el backend puede derivar algunos indicadores de
Reclamos y Emergencias cuando sus resúmenes Gold incluyen `causaTipo`.
Las tarjetas aparecen cuando el backend devuelve un valor, incluido el cero.

### Presentación de los seis casos

Los tableros consultan los impactos cada 15 segundos mientras están abiertos.
Los cambios aparecen en las tarjetas del módulo después de que el pipeline
publica los datos.

Para Espacios Públicos, los JSON agregados deben incluir `"version_cultura": 2`.
El backend puede calcular los indicadores desde un corte acumulado del endpoint
HTTPS definido en `PART2_EVENTS_URL`. Si la variable está vacía, lo busca en el
blob de Gold indicado por `PART2_EVENTS_BLOB` (por defecto,
`parte2/eventos.json`). El corte debe tener este formato:

```json
{
  "actualizado_en": "2026-11-13T15:05:00Z",
  "cobertura": ["culture", "emergencies"],
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

Para EDA y Espacios Públicos, el evento `EmergenciaVinculadaAContextoZona`
agrupa emergencias distintas por `referenciaExterna`, el ID del evento público.
El cálculo usa vínculos de origen Espacios y excluye el backfill.
Para probar el radio, publicar primero el contexto de Espacios y luego crear
una emergencia dentro del radio y durante su vigencia.

En la vista previa local, **Simular escenario** permite elegir cualquiera de
los seis casos y seguir sus resultados de ejemplo al cambiar de tablero.
`npm run dev:mock` carga los archivos `testingDatos/escenario-1.json` a
`testingDatos/escenario-6.json`, que contienen tanto los eventos de ensayo
como los resultados de ejemplo por tablero. Son archivos locales ignorados
por Git y Docker.

Los nombres y contratos del backend se mantienen en `src/api/types.ts`. La capa
`src/dataSources/apiAnalyticsDataSource.ts` convierte esos registros al modelo
que las pantallas ya utilizan.

## Diferencias entre los contratos reales y los mocks

### Reclamos

Los registros agregados del backend alimentan los KPI, gráficos y tabla. El
campo `row_count` representa la cantidad de reclamos del agregado.

### Emergencias

El backend no informa categoría. Por ese motivo, en modo API los gráficos por
categoría no tienen datos; estado, prioridad y tiempos de despacho sí se
calculan desde la respuesta real.

### Movilidad

El backend entrega viajes agregados. Los informes ejecutivo y de IA no se
muestran en modo API porque el contrato actual no incluye esos reportes.

### Espacios públicos y cultura

El adaptador calcula reservas, cancelaciones, inscripciones y ocupación desde los
agregados entregados por la API.

### Residuos

Los mocks describen toneladas y contenedores individuales, mientras que el
backend entrega alertas agregadas. Por eso la pantalla selecciona una vista
específica en modo API con alertas totales, resueltas, prioridad, rango de
llenado y tiempo de resolución. No se inventan toneladas ni contenedores que el
backend no provee.

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
| Se ven datos mock | Confirmar que el build activo fue compilado con `VITE_DATA_SOURCE=api`. |

No hay fallback automático de API a mock. Un error real se presenta como error,
no como datos de demostración.
