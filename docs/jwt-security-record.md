# Acceso a los tableros de Analítica

El formulario del portal envía el usuario, la contraseña y el cliente
correspondiente al equipo a `POST /auth/login` de Login Federado. Para Analítica
Urbana, el cliente predeterminado es `citypass-analitica-web` y su audiencia
es `citypass-analitica-api`. El cliente administrativo sigue siendo compatible
cuando el token trae el módulo y los roles autorizados.

`GET /me` de Login/LDAP devuelve el perfil, el módulo y los grupos. El frontend
usa `uid` (o `preferred_username`), `module` y `groups` para la sesión y calcula
la visibilidad de rutas y menú con las reglas siguientes. No consulta
`/auth/session` en Analítica ni necesita `dashboards` o `expires_at` de ese servicio.
El vencimiento para programar el refresh sale de `expires_in` de Login/refresh.

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
