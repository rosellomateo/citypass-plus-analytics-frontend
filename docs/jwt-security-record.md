# Acceso a los tableros de Analítica

El formulario envía el usuario, la contraseña y el identificador del cliente
compartido `citypass-admin-web` a `POST /auth/login` de Login Federado. El token
tiene audiencia `citypass-admin-api` y conserva el módulo y los roles del
usuario. El backend debe aceptar esa audiencia antes de desplegar el cliente
compartido; su compatibilidad no se habilita por cambiar el frontend.
`VITE_AUTH_CLIENT_ID` permite configurar el cliente durante el build.

`GET /me` de Login/LDAP devuelve el perfil, el módulo y los grupos. El frontend
usa `uid` (o `preferred_username`), `module` y `groups` para la sesión y calcula
la visibilidad de rutas y menú con las reglas siguientes. No consulta
`/auth/session` en Analítica ni necesita `dashboards` o `expires_at` de ese servicio.
El vencimiento para programar el refresh sale de `expires_in` de Login/refresh.
La preferencia opcional `initial_dashboard` solo afecta la navegación si coincide
con un tablero visible. Su ausencia no impide iniciar sesión.

Estas reglas controlan únicamente la interfaz. El backend de Analítica mantiene
la responsabilidad de validar el JWT y autorizar cada petición de datos.

- Analítica Urbana con el rol `admin` o `analitica-urbana` tiene los ocho tableros.
- Los equipos con rol `admin`, `delegados` u `operadores` reciben el tablero
  de su módulo.
- Reclamos también admite `soporte-n2` y `guardia-finde` para su tablero.
- El equipo de Login Federado tiene un solo tablero en `/analytics/login`.
  Para compatibilidad con su cliente administrativo, el menú reconoce los módulos
  `admin` y `login`; ambos siguen requiriendo uno de los grupos de equipo indicados.
- Una sesión sin roles autorizados devuelve una lista vacía. Un endpoint de datos
  devuelve `401` por token inválido o ausente y `403` por falta de permisos.

El access token se envía solo por la cabecera `Authorization`. El refresh se
hace en Login y vuelve a consultar `/me` antes de actualizar la sesión.

`GET /embed/{modulo}` entrega el HTML a aplicaciones que ya tienen su propia
sesión. El formulario de este portal consulta `/me` de Login/LDAP para obtener
el perfil; no necesita `/auth/session` en Analítica.

El origen del frontend debe estar habilitado tanto en el CORS de Login
Federado como en el de Analítica. Para desarrollo con el IdP real se puede
usar `http://localhost:5173` con `VITE_DATA_SOURCE=api`.
