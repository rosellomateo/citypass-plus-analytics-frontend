# Configuración y modos de datos

Vite expone al código del navegador únicamente variables con prefijo `VITE_`.
Estas variables configuran el portal:

| Variable | Valores | Descripción |
| --- | --- | --- |
| `VITE_DATA_SOURCE` | `api` | Fuente del portal. El build embebido configura su propio modo. |
| `VITE_API_BASE_URL` | URL HTTP(S) | URL base del backend, sin ruta de endpoint. |
| `VITE_IDP_BASE_URL` | URL HTTPS | Base de Login/LDAP para `/me`, `/auth/login`, `/auth/refresh` y `/auth/logout`. Por defecto `https://api.citypass-login.pp.ua`. |
| `VITE_AUTH_CLIENT_ID` | texto asignado por IdP | Cliente LDAP de Analítica (por defecto, `citypass-analitica-web`). |
| `VITE_AUTH_LOGIN_ENDPOINT` | URL HTTPS | Endpoint del IdP que recibe usuario, contraseña y `clientId`. |

## Configuración local

Crear un archivo ignorado por Git:

```bash
cp .env.example .env.local
```

Para una prueba integrada:

```dotenv
VITE_DATA_SOURCE=api
VITE_API_BASE_URL=http://localhost:8000
```

Vite lee estas variables al iniciar. Después de modificarlas, detener y volver a
ejecutar `npm run dev`.

## Comportamiento de cada modo

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
el cliente de Analítica configurado en `VITE_AUTH_CLIENT_ID` (`citypass-analitica-web`).

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

El cliente de Analítica se configura con `VITE_AUTH_CLIENT_ID`. En Docker se incorpora
durante el build; los workflows de test y producción toman la variable de GitHub
y usan `citypass-analitica-web` si no está definida. No se usa `VITE_AUTH_LOGIN_CLIENT_ID`.

Este cliente emite tokens para `citypass-analitica-api`, que coincide con
`JWT_AUDIENCE` del backend actual. El acceso a los datos requiere un usuario de
Analítica con grupo `admin`. La visibilidad del menú por sí sola no concede permisos.
Si se define `VITE_AUTH_CLIENT_ID` en GitHub, ese valor prevalece sobre el predeterminado:
debe mantener la compatibilidad con el backend. Cambiarlo requiere reconstruir la imagen;
una variable de Azure o un reinicio no modifica el JavaScript ya compilado.

Login Federado debe permitir por CORS el origen del portal para `GET /me`,
`POST /auth/login`, `POST /auth/refresh` y `POST /auth/logout`, incluida la cabecera
`Authorization`. El backend de Analítica también
debe permitir ese origen y la cabecera `Authorization`.
