# Configuración y modos de datos

Vite expone al código del navegador únicamente variables con prefijo `VITE_`.
Estas variables configuran el portal:

| Variable | Valores | Descripción |
| --- | --- | --- |
| `VITE_DATA_SOURCE` | `mock` o `api` | Selecciona la fuente utilizada por todos los tableros. |
| `VITE_API_BASE_URL` | URL HTTP(S) | URL base del backend, sin ruta de endpoint. |
| `VITE_IDP_BASE_URL` | URL HTTPS | Base del IdP para `auth/refresh` y `auth/logout`. |
| `VITE_AUTH_CLIENT_ID` | texto asignado por IdP | Cliente de Analítica Urbana (por defecto, citypass-admin-web). |
| `VITE_AUTH_LOGIN_ENDPOINT` | URL HTTPS | Endpoint del IdP que recibe usuario, contraseña y `clientId`. |

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

En modo API, la pantalla de ingreso envía los campos `username`, `password`
y `clientId` a `POST /auth/login` de Login Federado. El equipo seleccionado
determina el cliente de Login. Analítica lee el módulo y los roles del token
verificado para determinar el acceso.

El frontend confirma la sesión en `GET /auth/session` del backend de Analítica.
Las consultas usan el access token en la cabecera `Authorization: Bearer`.
El refresh token se usa en Login para renovar y cerrar la sesión. Ambos tokens
viven en memoria.

Los clientes de DAP y de Login se pueden ajustar mediante `VITE_AUTH_DAP_CLIENT_ID`
y `VITE_AUTH_LOGIN_CLIENT_ID`. El backend configura la audiencia y el módulo
asociados a cada uno.

Login Federado debe permitir por CORS el origen del portal para `POST /auth/login`,
`POST /auth/refresh` y `POST /auth/logout`. El backend de Analítica también
debe permitir ese origen y la cabecera `Authorization`.

El modo `mock` muestra los tableros con datos de demostración y no pide una sesión.
