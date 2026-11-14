# Acceso a los tableros de Analítica

El formulario del portal envía el usuario, la contraseña y el cliente
correspondiente al equipo a `POST /auth/login` de Login Federado. Para Analítica
Urbana, el cliente predeterminado es `citypass-analitica-web` y su audiencia
es `citypass-analitica-api`. El cliente administrativo sigue siendo compatible
cuando el token trae el módulo y los roles autorizados.

`GET /auth/session` devuelve el módulo, los grupos, el vencimiento y la lista
de tableros autorizados por Analítica. El frontend usa esa lista para las rutas
y el menú. La API verifica firma RS256 con el JWKS, emisor, vencimiento, audiencia
del módulo, tipo de token humano y versión del contrato en cada petición.
Acepta `aud` como texto o lista.

- Analítica Urbana con el rol `admin` o `analitica-urbana` tiene los ocho tableros.
- Los equipos con rol `admin`, `delegados` u `operadores` reciben el tablero
  de su módulo.
- Reclamos también admite `soporte-n2` y `guardia-finde` para su tablero.
- El equipo de Login Federado tiene un solo tablero en `/analytics/login`.
- Una sesión sin roles autorizados devuelve una lista vacía. Un endpoint de datos
  devuelve `401` por token inválido o ausente y `403` por falta de permisos.

El access token se envía solo por la cabecera `Authorization`. El refresh se
hace en Login y vuelve a validarse con Analítica antes de actualizar la sesión.
