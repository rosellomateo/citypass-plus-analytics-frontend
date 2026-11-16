# Configuración y modos de datos

Vite expone al código del navegador únicamente variables con prefijo `VITE_`.
Estas variables configuran el portal:

| Variable | Valores | Descripción |
| --- | --- | --- |
| `VITE_DATA_SOURCE` | `mock` o `api` | Selecciona la fuente utilizada por todos los tableros. |
| `VITE_API_BASE_URL` | URL HTTP(S) | URL base del backend, sin ruta de endpoint. |
| `VITE_IDP_BASE_URL` | URL HTTPS | Base de Login/LDAP para `/me`, `/auth/login`, `/auth/refresh` y `/auth/logout`. Por defecto `https://api.citypass-login.pp.ua`. |
| `VITE_AUTH_CLIENT_ID` | texto asignado por IdP | Cliente compartido del portal (por defecto, `citypass-admin-web`). |
| `VITE_AUTH_LOGIN_ENDPOINT` | URL HTTPS | Endpoint del IdP que recibe usuario, contraseña y `clientId`. |

## Configuración local

Crear un archivo ignorado por Git:

```bash
cp .env.example .env.local
```

Para trabajar sin backend, ejecutar `npm run dev:mock`.

Para una prueba integrada:

```dotenv
VITE_DATA_SOURCE=api
VITE_API_BASE_URL=http://localhost:8000
```

Vite lee estas variables al iniciar. Después de modificarlas, detener y volver a
ejecutar `npm run dev`.

## Comportamiento de cada modo

### `mock`

- ofrece accesos rápidos con sesiones de prueba en `npm run dev:mock`;
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
En Docker también deben enviarse como argumentos de construcción. Los workflows
de test y producción pasan `VITE_IDP_BASE_URL` y `VITE_AUTH_LOGIN_ENDPOINT`
desde las variables de GitHub (repositorio en test, environment `production`
en producción). La URL de Login es opcional: si está vacía, se usa
`VITE_IDP_BASE_URL` seguido de `/auth/login`.

Todo valor `VITE_*` es público para quien descargue la aplicación. No colocar
tokens, contraseñas, SAS de Azure ni secretos en estas variables.

## Autenticación delegada a Login

En modo API, la pantalla de ingreso envía los campos `username`, `password`
y `clientId` a `POST /auth/login` de Login Federado. Todos los usuarios usan
el cliente compartido configurado en `VITE_AUTH_CLIENT_ID`.

El frontend consulta el perfil en `GET /me` de Login/LDAP con
`Authorization: Bearer <access_token>`. Se espera un objeto con `uid`, `module`
y `groups` (también se admite `preferred_username` como nombre de usuario).
Los campos adicionales de nombre y correo no son necesarios para iniciar sesión.
La lista visible de tableros se calcula a partir del módulo y los grupos del
perfil, con las reglas documentadas en `docs/jwt-security-record.md`.
Si el perfil incluye un `initial_dashboard` opcional, se usa solamente cuando
pertenece a los tableros visibles del usuario. Si no está presente o no es válido,
se abre el primer tablero visible. No se requiere que LDAP devuelva ese campo.

Login y refresh deben devolver `access_token`, `refresh_token` y `expires_in`
en segundos. El frontend renueva antes del vencimiento y conserva siempre el
refresh token rotado. No necesita `dashboards` ni `expires_at` en `/me`.
Ambos tokens viven en memoria.

`VITE_API_BASE_URL` sigue apuntando exclusivamente a Analítica para las consultas
de datos. No se requiere una ruta `/auth/session` en Analítica. Cada endpoint de
datos del backend sigue siendo responsable de validar el JWT y sus permisos;
la visibilidad del menú no autoriza el acceso a los datos.

Los errores distinguen un fallo al obtener tokens de Login de un fallo al consultar
el perfil en `/me`. Un `401` o `403` del perfil se considera acceso inválido;
un `404`, un error de red o una respuesta de perfil mal formada informa que no
se pudo consultar el perfil y mantiene el portal sin sesión.

El cliente compartido se configura con `VITE_AUTH_CLIENT_ID`. En Docker se incorpora
durante el build; los workflows de test y producción toman la variable de GitHub
y usan `citypass-admin-web` si no está definida. No se usa `VITE_AUTH_LOGIN_CLIENT_ID`.

La API debe aceptar la audiencia emitida para el cliente elegido antes de desplegar
el portal. Con el cliente compartido se espera `citypass-admin-api`; un backend
configurado únicamente para `citypass-analitica-api` puede rechazar esas consultas
con 401. Integrar este frontend no modifica el contrato ni la configuración del backend.

Login Federado debe permitir por CORS el origen del portal para `GET /me`,
`POST /auth/login`, `POST /auth/refresh` y `POST /auth/logout`, incluida la cabecera
`Authorization`. El backend de Analítica también
debe permitir ese origen y la cabecera `Authorization`.

El modo local `mock` muestra primero la pantalla de acceso y usa datos de demostración.

## Modo presentación

Ejecutar `npm run dev:presentation` y abrir <http://127.0.0.1:5175/presentacion>.
Los ocho botones leen perfiles simulados de `testingDatos/sesiones-presentacion.json`.
Cada perfil tiene un identificador con prefijo `local-demo:`, un usuario
ficticio y su lista de tableros. El directorio está ignorado por Git y Docker.

El inicio de sesión normal envía usuario y contraseña a Login/LDAP. El perfil
proviene de `/me`; el backend de Analítica valida el JWT al consultar datos. En modo API,
los tableros consumen los JSON del backend, incluido el informe de IA cuando
la respuesta lo trae.
