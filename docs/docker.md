# Uso con Docker

La imagen usa Node.js 22 para compilar la aplicación y Nginx para servir los
archivos estáticos.

## Construir en modo mock

```bash
docker build \
  --build-arg VITE_DATA_SOURCE=mock \
  --build-arg VITE_API_BASE_URL=http://localhost:8000 \
  --tag citypass-frontend:mock .
```

## Construir conectado a la API

```bash
docker build \
  --build-arg VITE_DATA_SOURCE=api \
  --build-arg VITE_API_BASE_URL=http://localhost:8000 \
  --tag citypass-frontend:api .
```

La URL es utilizada por el navegador del usuario, no por el contenedor. Para un
despliegue remoto debe ser una URL pública accesible desde el navegador, por
ejemplo `https://api.example.com`.

Los argumentos se incorporan durante el build. Pasar `VITE_API_BASE_URL` con
`docker run --env` no cambia una imagen ya compilada.

## Ejecutar

```bash
docker run --rm --publish 8080:80 citypass-frontend:api
```

Abrir <http://localhost:8080>. El backend debe permitir ese origen mediante
`CORS_ALLOWED_ORIGINS=http://localhost:8080`.

## Health check

Nginx expone un health check propio:

```bash
curl --fail http://localhost:8080/health
```

Respuesta esperada:

```text
ok
```

Este endpoint solo comprueba Nginx y los archivos del frontend; no valida la
conexión con la API.

## Segundo plano y logs

```bash
docker run --detach \
  --name citypass-frontend \
  --publish 8080:80 \
  citypass-frontend:api

docker logs --follow citypass-frontend
docker inspect --format '{{.State.Health.Status}}' citypass-frontend
docker stop citypass-frontend
docker rm citypass-frontend
```

Si se inició con `--rm`, el contenedor se elimina al detenerse.

## Problemas frecuentes

### El puerto está ocupado

Publicar otro puerto, por ejemplo `--publish 8081:80`, y agregar
`http://localhost:8081` a CORS en el backend.

### No aparecen cambios

Los archivos se compilan dentro de la imagen. Reconstruirla después de modificar
el código o las variables `VITE_*`.

### La interfaz intenta llamar a localhost en producción

La imagen fue construida sin la URL pública de la API. Volver a compilar con
`--build-arg VITE_API_BASE_URL=https://<backend>`.

### Una ruta funciona al navegar pero falla al recargar

El servidor debe redirigir las rutas desconocidas a `index.html`. La
configuración Nginx incluida ya implementa este fallback.
