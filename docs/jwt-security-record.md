# Acceso a los tableros de Analítica

El formulario del portal envía el usuario, la contraseña y el cliente
correspondiente al equipo a `POST /auth/login` de Login Federado. Para Analítica
Urbana, el cliente predeterminado es `citypass-analitica-web` y su audiencia
es `citypass-analitica-api`. El cliente administrativo sigue siendo compatible
cuando el token trae el módulo y los roles autorizados.

`GET /auth/session` del backend de Analítica recibe `Authorization: Bearer`
con el access token. Devuelve el módulo, los grupos, el vencimiento, el tablero
inicial y los tableros autorizados. El frontend usa esa respuesta para la
primera navegación, las rutas y el menú. La API verifica firma RS256 con el JWKS, emisor, vencimiento, audiencia
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

`GET /embed/{modulo}` entrega el HTML para aplicaciones que ya tienen su propia
sesión. El formulario de este portal consulta `GET /auth/session` para conocer
el destino y los tableros autorizados.

En el despliegue, verificar que `GET /auth/session` sin token responda `401`.
Si responde `404`, la versión desplegada del backend aún no incluye la ruta.
El origen del frontend debe estar habilitado tanto en el CORS de Login
Federado como en el de Analítica. Para desarrollo con el IdP real se puede
usar `http://localhost:5173` con `VITE_DATA_SOURCE=api`.
