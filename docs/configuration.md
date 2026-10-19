# Configuración y modos de datos

Vite expone al código del navegador únicamente variables con prefijo `VITE_`.
El proyecto requiere estas dos:

| Variable | Valores | Descripción |
| --- | --- | --- |
| `VITE_DATA_SOURCE` | `mock` o `api` | Selecciona la fuente utilizada por todos los tableros. |
| `VITE_API_BASE_URL` | URL HTTP(S) | URL base del backend, sin ruta de endpoint. |
| `VITE_AUTH_ENABLED` | `true` o vacío | Activa la protección JWT del panel. |
| `VITE_AUTH_LOGIN_ORIGIN` | origen HTTPS exacto | Origen de Login autorizado a entregar el JWT. |
| `VITE_AUTH_MODULE` | texto | Módulo que debe figurar en el claim `module`. |
| `VITE_AUTH_REQUIRED_GROUP` | texto opcional | Grupo al que el código concede acceso. |

## Configuración local

Crear un archivo ignorado por Git:

```bash
cp .env.example .env.local
```

Para trabajar sin backend:

```dotenv
VITE_DATA_SOURCE=mock
VITE_API_BASE_URL=http://localhost:8000
```

Para una prueba integrada:

```dotenv
VITE_DATA_SOURCE=api
VITE_API_BASE_URL=http://localhost:8000
```

Vite lee estas variables al iniciar. Después de modificarlas, detener y volver a
ejecutar `npm run dev`.

## Comportamiento de cada modo

### `mock`

- no realiza solicitudes al backend;
- usa los datasets incluidos en `src/data/mocks/`;
- permite desarrollar y demostrar la interfaz de manera aislada.

### `api`

- consulta los endpoints configurados en `src/api/analyticsApi.ts`;
- adapta los contratos del backend a las métricas de cada tablero;
- muestra el estado de error si la API falla;
- no cambia automáticamente a datos mock.

La ausencia de fallback automático es intencional: evita mostrar datos ficticios
como si fueran reales cuando el backend está caído.

## Variables de build

Las variables `VITE_*` se incorporan al JavaScript durante `npm run build`. No se
pueden cambiar después de desplegar los archivos estáticos sin volver a compilar.
En Docker también deben enviarse como argumentos de construcción.

Todo valor `VITE_*` es público para quien descargue la aplicación. No colocar
tokens, contraseñas, SAS de Azure ni secretos en estas variables.

## Autenticación delegada a Login

El panel no implementa login, no cifra ni firma JWT y no conserva tokens en
`localStorage`, `sessionStorage`, URL ni variables `VITE_*`. Login entrega cada
access token vigente con `window.postMessage` desde el origen exacto configurado:

```ts
window.postMessage({ type: 'citypass.auth.token', token }, 'https://analytics.citypass.example');
```

El token queda solo en memoria y se adjunta como `Authorization: Bearer <token>`
a la API. Al recargar, Login debe entregarlo de nuevo. El contrato mínimo de
claims es `sub` (ID permanente `U…`), `module`, `groups` y `exp` (segundos Unix).

El cliente descarta tokens expirados o que no correspondan al módulo/grupo solo
para proteger la interfaz. La API debe validar siempre firma, algoritmo
permitido, `iss`, `aud`, `exp`, usuario habilitado y autorización por grupo.
Los grupos son listas: únicamente un grupo configurado recibe significado de
permiso en este código.
