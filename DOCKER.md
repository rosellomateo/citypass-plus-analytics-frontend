# Ejecutar el frontend con Docker

Esta guía explica cómo construir y ejecutar localmente el frontend de CityPass+.
La imagen utiliza Node.js 22 para compilar React y Nginx para servir los archivos
estáticos de producción.

## Requisitos

- Docker Engine o Docker Desktop en ejecución.
- Acceso a una terminal ubicada en la raíz de este repositorio.

Comprobar la instalación:

```bash
docker version
```

## Construir la imagen

Desde la carpeta `citypass-plus-analytics-frontend`:

```bash
docker build --tag citypass-frontend:local .
```

Durante la construcción Docker ejecuta `npm ci`, TypeScript y el build de Vite.
Si alguno de esos pasos falla, la imagen no se genera.

Para reconstruirla ignorando la caché:

```bash
docker build --no-cache --tag citypass-frontend:local .
```

## Ejecutar el contenedor

En primer plano:

```bash
docker run --rm --publish 8080:80 citypass-frontend:local
```

La aplicación queda disponible en <http://localhost:8080>.

Para ejecutarla en segundo plano:

```bash
docker run --detach \
  --name citypass-frontend \
  --publish 8080:80 \
  citypass-frontend:local
```

## Verificar el funcionamiento

Comprobar el endpoint de salud:

```bash
curl --fail http://localhost:8080/health
```

La respuesta esperada es:

```text
ok
```

También se puede comprobar una ruta administrada por React Router:

```bash
curl --head http://localhost:8080/analytics/emergencies
```

Debe responder con estado HTTP `200`. Nginx está configurado para devolver
`index.html` cuando se recarga directamente una ruta del frontend.

## Consultar logs y estado

```bash
docker ps --filter name=citypass-frontend
docker logs --follow citypass-frontend
docker inspect --format '{{.State.Health.Status}}' citypass-frontend
```

El estado de salud debería cambiar a `healthy` después de iniciar.

## Detener el contenedor

```bash
docker stop citypass-frontend
docker rm citypass-frontend
```

Si el contenedor se inició con `--rm`, Docker lo elimina automáticamente después
de detenerlo y el segundo comando no es necesario.

## Ejecutar una imagen publicada

El workflow de CD publica imágenes versionadas en GitHub Container Registry
(GHCR). Para una imagen pública:

```bash
docker pull ghcr.io/rosellomateo/citypass-plus-analytics-frontend:1.0.0
docker run --rm --publish 8080:80 \
  ghcr.io/rosellomateo/citypass-plus-analytics-frontend:1.0.0
```

Si el paquete es privado, primero hay que autenticarse en GHCR con un token que
tenga permiso `read:packages`:

```bash
docker login ghcr.io
```

## Problemas frecuentes

### El puerto 8080 está ocupado

Publicar otro puerto del host, por ejemplo `8081`:

```bash
docker run --rm --publish 8081:80 citypass-frontend:local
```

La aplicación estará en <http://localhost:8081>.

### Los cambios recientes no aparecen

La aplicación se compila dentro de la imagen. Es necesario reconstruirla y
volver a crear el contenedor después de modificar el código.

### Falla `npm ci` durante el build

Verificar que `package.json` y `package-lock.json` estén sincronizados y que
Docker tenga acceso a `registry.npmjs.org`.

### Variables de entorno de Vite

Las variables cuyo nombre comienza con `VITE_` se incorporan en el momento del
build y quedan visibles en el JavaScript del navegador. No deben contener
contraseñas, tokens ni otros secretos. El frontend actual todavía utiliza datos
mock y no requiere una URL externa de API para arrancar.

## Validaciones automatizadas

El workflow `.github/workflows/ci.yml` ejecuta en `develop` y `main`:

1. instalación reproducible con `npm ci`;
2. lint;
3. tests con cobertura;
4. build de producción;
5. construcción de la imagen Docker sin publicarla.

La imagen sólo se publica en GHCR cuando el workflow de CD recibe un tag con el
formato `v*.*.*`.
