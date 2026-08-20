# Despliegue en Docker (Hostinger VPS)

## 1. Construir la imagen

```bash
docker build -t ghcr.io/heywinmeneseshp/api-rest-banarica:latest .
```

## 2. Iniciar el contenedor

```bash
docker run -d \
  --name api-rest-banarica \
  --restart unless-stopped \
  --env-file .env \
  -p 3001:3000 \
  ghcr.io/heywinmeneseshp/api-rest-banarica:latest
```

## 3. Detenerlo

```bash
docker stop api-rest-banarica
```

## 4. Reiniciarlo

```bash
docker restart api-rest-banarica
```

## 5. Ver logs

```bash
docker logs -f api-rest-banarica
```

## 6. Puerto interno

La API escucha en el puerto **3000** dentro del contenedor (`process.env.PORT || 3000`, sobre `0.0.0.0`). Mapea ese puerto al que necesites publicar (`-p <puerto-host>:3000`), o déjalo solo en la red interna de Docker si Traefik lo va a enrutar.

## 7. Variables de entorno

Ver `.env.example` para el listado completo. Resumen de las críticas para producción:

| Variable | Descripción |
|---|---|
| `NODE_ENV` | Debe ser `production` |
| `PORT` | Puerto interno (por defecto 3000) |
| `API_KEY`, `SECRET`, `RECOVERY_SECRET` | Autenticación (JWT, API key servidor-a-servidor) |
| `CORS_ORIGIN`, `FRONTEND_URL` | Orígenes permitidos |
| `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_NAME` | Credenciales MySQL |
| `DATABASE_HOST` | **Ver sección 8** |
| `DATABASE_PORT` | Puerto MySQL (por defecto `3306`) |
| `CORBANA_API_URL`, `CORBANA_API_KEY` | Integración con api-rest-corbana |

Nunca metas el `.env` dentro de la imagen (`.dockerignore` ya lo excluye) — pásalo con `--env-file` o como variables de entorno del contenedor.

## 8. Configuración de `DATABASE_HOST`

**Importante**: como la API corre dentro de un contenedor Docker y MySQL también corre dentro de otro contenedor Docker en el mismo VPS, `DATABASE_HOST` **NO debe ser** `localhost` ni `127.0.0.1` — esas direcciones apuntan al contenedor de la propia API, no al de MySQL.

`DATABASE_HOST` debe ser el **nombre DNS del servicio/contenedor de MySQL** dentro de la red Docker que administra Hostinger (por ejemplo, el nombre del servicio tal como aparece en el `docker-compose`/stack de Hostinger, algo como `mysql`, `db`, o el nombre específico que le haya puesto Hostinger a ese contenedor).

Este repositorio **no puede determinar ese nombre exacto** — no gestiona el contenedor de MySQL. Se dejó como placeholder en `.env.example`:

```
DATABASE_HOST=mysql
```

**Debes reemplazarlo por el nombre real del servicio MySQL de tu proyecto en el Administrador de Docker de Hostinger** antes de desplegar. Revisa ahí el nombre del contenedor/servicio de MySQL (o pregunta en soporte de Hostinger si no es evidente).

## 9. Conectar la API al contenedor de MySQL

Para que la API pueda resolver ese nombre DNS, el contenedor de la API **debe estar en la misma red Docker** que el contenedor de MySQL. Desde el Administrador de Docker de Hostinger, agrega el contenedor de esta API a la red externa donde ya vive MySQL (no crees una red nueva aislada). Este repo no crea ni modifica esa red — solo queda preparado para conectarse a ella.

## 10. Comprobar `/health`

```bash
curl http://localhost:3001/health
# {"status":"ok"}
```

No requiere API key — solo confirma que el proceso Express está arriba.

## 11. Comprobar `/health/db`

```bash
curl http://localhost:3001/health/db
# {"status":"ok","database":"ok"}          -> conexión a MySQL OK
# {"status":"error","database":"unavailable"} (HTTP 503) -> no puede conectar
```

Nunca expone credenciales, host completo, ni stack traces — solo un estado genérico.

## 12. Hostinger + Docker + Traefik

- Hostinger ya tiene Traefik corriendo — **no instales Nginx ni otro Traefik**.
- Este repo no incluye configuración de Traefik ni la modifica.
- Para exponer la API vía Traefik, agrega las labels correspondientes al contenedor desde el Administrador de Docker de Hostinger (o el `docker-compose` que gestiona Hostinger), apuntando al puerto interno **3000**.
- Conecta el contenedor a la red Docker externa que administra Hostinger para que Traefik y MySQL puedan alcanzarlo.
