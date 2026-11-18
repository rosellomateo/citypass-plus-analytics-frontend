# Datos para el impacto de eventos públicos en un radio de 500 metros

El cálculo ya está implementado en el frontend. No se modificó el backend.
El mock incluye ejemplos en `testingDatos/contexto-territorial.mjs`, ignorado por Git.

## Qué se calcula en el navegador

1. Seleccionar eventos de Espacios Públicos: `tipo = EVENTO_PUBLICO` o `EVENTO_ESPACIO_PUBLICO`. Un incidente vial no es un evento público en este cálculo.
2. Comparar la ubicación del evento con cada recurso. Usar el radio informado o 500 metros si no se informó otro.
3. Para estaciones y recursos puntuales, medir la distancia entre coordenadas. Para recorridos de Residuos, medir la distancia mínima al **trazado completo**, incluidos sus segmentos intermedios.
4. Exigir coincidencia temporal. La creación de la emergencia/alerta/reclamo debe caer dentro del evento. El turno del recorrido debe superponerse al horario del evento.
5. Contar cada ID una vez por evento. Un recurso puede estar cerca de dos eventos, pero no se cuenta dos veces dentro del mismo evento.
6. Conservar los efectos confirmados que ya publique el backend. La cercanía por sí sola no cambia una prioridad, no cierra una estación y no modifica el recorrido del camión.

Las distancias se calculan geográficamente en metros con Turf: [distancia entre puntos](https://turfjs.org/docs/api/distance) y [distancia de un punto a una línea](https://turfjs.org/docs/api/pointToLineDistance). Compartir barrio o zona no demuestra estar a menos de 500 metros; un recurso de una zona vecina también puede entrar en el radio.

Se incluye el límite de 500 metros. El inicio del evento se incluye y su fin se excluye. CANCELADA/CANCELADO/CANCELLED y SUSPENDIDA/SUSPENDIDO no generan coincidencias. Los eventos finalizados pueden conservar relaciones históricas cuando los datos incluyen la fecha de creación o el turno correspondiente.

Una estación sin intervalo de disponibilidad se compara contra los eventos activos en el momento de la consulta. Si tiene `desde` y `hasta`, se usa la superposición de esos intervalos.

## Datos que hoy faltan

Los resúmenes Parquet actuales aportan cantidades, estados, causas y zonas/barrio, pero no aportan conjuntamente los IDs, coordenadas, geometrías y horarios necesarios. El frontend puede hacer el cálculo, pero necesita esos datos de detalle.

No se asignan coordenadas aproximadas al centro de un barrio y no se interpretan las 28 intervenciones agregadas como 28 eventos identificados.

## Entrega recomendada: ampliar la respuesta ya utilizada

Agregar un campo opcional **`contexto_territorial`** a la respuesta existente de:

```text
GET /analytics/{area}/parte2
```

Así se reutiliza la consulta y el refresco ya implementados: no hace falta otro endpoint ni trasladar los cálculos al backend. Cada área debe recibir el catálogo de eventos públicos y los recursos que sus permisos permitan consultar. Analítica puede recibir el conjunto completo.

Se conservan `datos`, `resumen_gold` y los demás campos existentes; el ejemplo deja `datos` vacío sólo para mostrar la estructura del detalle.

El backend debe exponer los datos desde sus fuentes de detalle/EDA; no pueden recuperarse IDs y geometrías perdidos en un agregado.

### Formato que el frontend ya admite

Coordenadas WGS84 en orden GeoJSON **`[longitud, latitud]`**, fechas ISO 8601 con zona horaria y radio en metros. Los siguientes nombres son ejemplos de contrato, no registros de producción.

```json
{
  "fecha_snapshot": "2026-11-18",
  "datos": [],
  "contexto_territorial": {
    "cobertura": ["emergencia", "recorrido_residuos", "estacion"],
    "eventos": [
      {
        "evento_id": "festival-001",
        "tipo": "EVENTO_ESPACIO_PUBLICO",
        "nombre": "Festival de la plaza",
        "zona": "Caballito",
        "coordenadas": [-58.438, -34.607],
        "radio_metros": 500,
        "inicio": "2026-11-18T14:00:00Z",
        "fin": "2026-11-18T20:00:00Z",
        "estado": "ACTIVE"
      }
    ],
    "recursos": [
      {
        "recurso_id": "recorrido-001",
        "tipo": "recorrido_residuos",
        "nombre": "Circuito de la plaza",
        "zona": "Caballito",
        "trazado": [[-58.448, -34.607], [-58.428, -34.607]],
        "desde": "2026-11-18T15:00:00Z",
        "hasta": "2026-11-18T18:00:00Z"
      },
      {
        "recurso_id": "emergencia-001",
        "tipo": "emergencia",
        "nombre": "Atención médica",
        "zona": "Caballito",
        "coordenadas": [-58.439, -34.607],
        "creado_en": "2026-11-18T16:00:00Z",
        "estado": "DESPACHADA",
        "criticidad_original": "MEDIA",
        "criticidad": "ALTA",
        "criticidad_elevada": true,
        "respondida": true
      },
      {
        "recurso_id": "estacion-001",
        "tipo": "estacion",
        "nombre": "Estación de la plaza",
        "zona": "Caballito",
        "coordenadas": [-58.437, -34.607],
        "desde": "2026-01-01T00:00:00Z",
        "hasta": "2027-01-01T00:00:00Z"
      }
    ]
  }
}
```

### Campos necesarios por recurso

| Tipo | Campos mínimos para calcular la cercanía | Datos opcionales para la pantalla |
|---|---|---|
| Evento público | `evento_id`, `coordenadas`, `inicio`, `fin`; radio 500 m por defecto | `nombre`, `zona`, `tipo`, `estado`, `radio_metros` |
| `recorrido_residuos` | `recurso_id`, `trazado` de al menos dos coordenadas, `desde`, `hasta` | `nombre`, `zona`, `estado` |
| `emergencia` | `recurso_id`, `coordenadas`, `creado_en` | Tipo en `nombre`, `zona`, `estado`, `criticidad`, `criticidad_original`, `criticidad_elevada`, `respondida` |
| `estacion` | `recurso_id`, `coordenadas` | `nombre`, `zona`, `desde`, `hasta`, `estado` |
| `alerta_residuos` | `recurso_id`, `coordenadas`, `creado_en` | `nombre`, `zona` |
| `intervencion_residuos` | `recurso_id`, `coordenadas`, `creado_en` | `nombre`, `zona`, `estado` |
| `reclamo` | `recurso_id`, `coordenadas`, `creado_en` | `nombre`, `zona`, `estado` |

`cobertura` declara los tipos para los cuales se entregó el conjunto completo dentro del alcance consultado. Permite distinguir un cero real de la falta de información. Si falta cobertura o faltan datos necesarios de un recurso potencial, el conteo de ese tipo se presenta como no disponible; no se reemplaza por cero.

Los puntos e intervalos pueden usar `desde`/`hasta` para una disponibilidad explícita. En un recorrido son obligatorios. La posición del camión en un instante no reemplaza la geometría del recorrido.

## Si prefieren crear un endpoint separado

Nombre propuesto:

```http
GET /analytics/contexto-territorial?desde=2026-11-18T00:00:00Z&hasta=2026-11-19T00:00:00Z
Authorization: Bearer <token>
```

- **Recibe:** token de acceso y, opcionalmente, `desde`, `hasta`, `zona` y `evento_id` como query params. No necesita body ni recibir las geometrías desde el navegador.
- **Devuelve:** `fecha_snapshot`, `actualizado_en` y el mismo objeto `contexto_territorial` del ejemplo. Mantener IDs estables y evitar datos personales innecesarios.
- **Origen de datos:** catálogo de eventos, ubicaciones de recursos y trazados/turnos de recorridos. El backend autoriza la información por perfil.
- **Filtro de zona:** puede seleccionar los eventos de una zona, pero debe conservar los recursos cercanos del otro lado del límite barrial. El radio no sigue los límites del barrio.
- **Errores:** 401/403 para autenticación/permisos, 422 para parámetros inválidos y respuesta válida con listas vacías y cobertura explícita cuando no existan registros.

Este endpoint separado es una propuesta y **no se invoca actualmente**. Si se implementa, bastará incorporar su payload al mismo adaptador del front. Extender la respuesta de Parte 2 evita ese paso adicional.

## Resultado que arma y muestra el frontend

- Espacios Públicos: barras de cantidad de actividades/eventos por zona a partir de `zona` o `barrio` y `cantidadActividades`; al final, selector de evento y conteos por recurso dentro de su radio y horario.
- Residuos: lista evento–recorrido, zona y distancia mínima al trazado. Dos eventos próximos al mismo recorrido generan dos relaciones y un único recorrido en el contador de IDs distintos.
- Movilidad: lista de estaciones cercanas, evento asociado, zona y distancia. No modifica el bloqueo real de la estación.
- Emergencias: lista de emergencias dentro del radio, ordenadas por criticidad informada. La vista de aumentos confirmados usa `criticidad_elevada = true` o una prioridad original y actual válidas que demuestren el aumento. La proximidad sin esos datos queda separada de la confirmación.
- Reclamos, alertas e intervenciones: conteos espaciales en la ficha del evento cuando se entreguen sus coordenadas y tiempos.

Los resultados publicados en `eventos_zona`, `emergencias_zona` y `afectaciones.recorridos_eventos` se conservan y tienen prioridad sobre las relaciones derivadas. El front no persiste alteraciones en servicios de otros grupos, no inventa cuánto debe subir una prioridad y no modifica los Parquet.

Si ya se consumen envelopes `EmergenciaVinculadaAContextoZona`, se pueden publicar sus vínculos explícitos en `emergencias_zona`: `emergenciaId` → `emergencia_id`, `referenciaExterna` → `evento_id`, `radioMetros` → `radio_metros` y `vinculadaEn` → `vinculada_en`. Debe tratarse de un contexto de Espacios Públicos. Tipo, estado y prioridades necesitan los datos de la emergencia; el vínculo geográfico no contiene por sí mismo el aumento confirmado.

## Archivos del frontend

- `src/utils/territorialImpact.ts`: cruce geográfico y temporal, deduplicación y combinación con efectos publicados.
- `src/types/territorial.ts`: contrato de datos de detalle.
- `src/hooks/useDashboardImpact.ts`: conexión con la respuesta actual de Parte 2.
- `src/__tests__/territorialImpact.test.ts`: límites de radio, recorridos que cruzan el área, horarios, datos ausentes y prioridades.
