# Despliegue (#9)

> No se ha contratado ningún servicio. Este documento describe un despliegue reproducible en un servidor propio; el proveedor lo elige el propietario.

## Requisitos

- Un servidor Linux con Docker y Docker Compose (por ejemplo, un VPS de 2 GB en la UE).
- Un dominio o subdominio apuntando a su IP (p. ej. `seguros.tudominio.es`). HTTPS es obligatorio para la app instalable y las notificaciones; Caddy lo obtiene solo (Let's Encrypt).
- Opcional: cuenta SMTP para correos, clave de Anthropic para la IA.

## Pasos

```bash
git clone https://github.com/FarinosV44/POLIZAS-SEGURO.git && cd POLIZAS-SEGURO
cp .env.example .env
```

Edita `.env` **en el servidor** (nunca en el repositorio):

| Variable | Valor |
| --- | --- |
| `DOMINIO` | `seguros.tudominio.es` (lo usa Caddy) |
| `APP_URL` | `https://seguros.tudominio.es` |
| `POSTGRES_PASSWORD` | contraseña larga aleatoria (`openssl rand -base64 24`) |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | `npx web-push generate-vapid-keys`; `VAPID_SUBJECT=mailto:tu-correo` |
| `SMTP_*` | datos de tu proveedor de correo (opcional) |
| `ANTHROPIC_API_KEY` | clave de la API (opcional; sin ella la IA queda «sin configurar») |
| `COPIAS_CLAVE` | `openssl rand -base64 32` — **guárdala también en tu gestor de contraseñas** |
| `CRON_SECRET` | solo si usas cron por HTTP en vez del worker |

`DATABASE_URL`, `STORAGE_DIR` y `COPIAS_DIR` los fija `docker-compose.yml`.

```bash
docker compose up -d --build                 # db, migraciones, web, worker y Caddy
docker compose run --rm web npm run usuario:crear -- --email tu@correo.es --nombre "Tu nombre"
```

## Comprobaciones de salud

| Qué | Cómo | Esperado |
| --- | --- | --- |
| Web y base de datos | `curl https://seguros.tudominio.es/api/salud` | `{"ok":true}` |
| Worker | `docker compose logs worker --tail 20` | «iniciado · copias configuradas · IA … · push configurado» y una línea cada 5 min |
| Planificador | Ajustes › Estado y avisos | «Activo · hace N min» (N ≤ 20) |
| Push | Ajustes › Estado y avisos; en el móvil, Avisos en este móvil › Enviar prueba | «Configuradas» y notificación recibida con la app cerrada |
| Correo | Recuperar contraseña con tu correo | Llega el enlace |
| IA | Ajustes › Estado y avisos | «Clave configurada»; analizar un siniestro de prueba |
| Copias | Ajustes › Estado y avisos (tras las 3:00) o `docker compose run --rm worker npm run copia` | «Última: fecha» y archivo en el volumen `copias` |

## Copias de seguridad y restauración

- El worker hace una copia cifrada al día (`COPIAS_HORA`, 3:00 Madrid) de la base de datos **y** los documentos, y borra las de más de `COPIAS_RETENCION_DIAS` (30).
- **Saca las copias del servidor** (otro equipo u otro proveedor): `docker compose cp worker:/datos/copias ./copias-locales` o una tarea de `rsync`. Una copia en el mismo disco no protege de su pérdida.
- Restauración probada (prueba automática `tests/copias-exportar.test.ts`) en una base **vacía**:

```bash
docker compose run --rm -e COPIAS_CLAVE=... worker npm run copia:restaurar -- \
  --archivo /datos/copias/praetoria-seguros-AAAAMMDD-HHMMSS.copia \
  --base postgres://polizas:CLAVE@db:5432/polizas_restaurada --documentos /datos/documentos-restaurados
```

Después apunta `DATABASE_URL`/`STORAGE_DIR` a los destinos restaurados y ejecuta `npm run db:migrate`. Los avisos ya enviados no se repiten.

## Actualizar

```bash
git pull && docker compose up -d --build     # el servicio «migrar» aplica las migraciones nuevas
```

## Alternativas

- **Sin Docker**: Node 22, PostgreSQL ≥ 14 (con `pg_dump` de la misma versión), `npm ci && npm run build && npm run db:migrate`, `npm start` y `npm run worker` como servicios (systemd) detrás de un proxy HTTPS.
- **Plataformas sin procesos permanentes**: cron externo cada 5 minutos a `POST /api/tareas/avisos` con `Authorization: Bearer $CRON_SECRET`. En ese caso las lecturas con IA y las copias deben programarse aparte (`npm run copia`).
