# Configuración y modos de datos

Vite expone al código del navegador únicamente variables con prefijo `VITE_`.
El proyecto requiere estas dos:

| Variable | Valores | Descripción |
| --- | --- | --- |
| `VITE_DATA_SOURCE` | `mock` o `api` | Selecciona la fuente utilizada por todos los tableros. |
| `VITE_API_BASE_URL` | URL HTTP(S) | URL base del backend, sin ruta de endpoint. |
| `VITE_AUTH_ENABLED` | `true` o vacío | Activa la protección JWT del panel. |
| `VITE_AUTH_LOGIN_ORIGIN` | origen HTTPS exacto | Origen de Login autorizado a entregar el JWT. |
| `VITE_IDP_BASE_URL` | URL HTTPS | Base del IdP para `auth/refresh` y `auth/logout`. |

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
`localStorage`, `sessionStorage`, URL ni variables `VITE_*`. Login entrega el
último par de tokens con `window.postMessage` desde el origen exacto configurado:

```ts
window.postMessage(
  { type: 'citypass.auth.tokens', access_token, refresh_token },
  'https://analytics.citypass.example',
);
```

Los dos tokens quedan solamente en memoria. El access token se adjunta como
`Authorization: Bearer <token>` a la API. Ante un `401`, el cliente usa el refresh
token exclusivamente contra el IdP; el IdP devuelve un access token y refresh token
nuevos, que reemplazan al par anterior antes de reintentar una única vez la consulta.
Si el refresh falla, se descarta toda la sesión.

El cliente controla la forma de los claims del contrato (`iss`, `sub`, `aud`,
`token_use`, `ver`, `preferred_username`, `module`, `groups`, `iat`, `exp`, `jti`)
para proteger la interfaz. Los permisos de pantalla se asignan explícitamente por
grupo en `src/auth/authorization.ts`; un grupo desconocido no da ningún acceso.
La API debe validar la firma y todas las restricciones criptográficas del contrato.
