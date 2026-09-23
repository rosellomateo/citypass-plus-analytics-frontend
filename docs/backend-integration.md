# Integración con el backend

## Requisitos para una prueba local

1. Backend disponible en `http://localhost:8000`.
2. `CORS_ALLOWED_ORIGINS=http://localhost:5173` en el backend.
3. Frontend configurado con `VITE_DATA_SOURCE=api`.
4. `VITE_API_BASE_URL=http://localhost:8000` en el frontend.

El frontend invoca al backend directamente desde el navegador. La URL base no
debe terminar con una ruta de analítica y puede llevar o no una barra final.

## Mapeo de pantallas y endpoints

| Pantalla | Endpoint del backend |
| --- | --- |
| Reclamos | `GET /analytics/reclamos` |
| Emergencias | `GET /analytics/seguridad-emergencias` |
| Movilidad | `GET /analytics/movilidad-urbana` |
| Espacios y cultura | `GET /analytics/espacios-cultura` |
| Residuos | `GET /analytics/residuos` |

`GET /analytics/eventos` está definido en el cliente, pero no alimenta un
tablero actual.

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
curl --fail http://localhost:8000/analytics/residuos
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
