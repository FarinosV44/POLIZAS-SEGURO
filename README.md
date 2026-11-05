# PRAETORIA gestor de seguros

Aplicación privada para gestionar las pólizas de empresas y particulares: qué seguros hay, cuánto cuestan, cuándo vencen, sus documentos y su histórico. Plan completo en el issue #10.

> Repositorio **público**: no contiene ni debe contener pólizas reales, datos personales ni credenciales.

## Qué funciona (primera entrega)

- Inicio y cierre de sesión, recuperación de contraseña por correo (si hay SMTP), sin registro público.
- Roles **administrador** y **colaborador** con acceso explícito por titular, comprobado en servidor.
- Titulares de tipo **empresa** o **particular**; tipos de seguro editables.
- Alta y edición manual de pólizas; **anualidades** con histórico (renovar no borra la anterior).
- **Panel** con titular, tipo de seguro, prima anual, recibo y periodicidad, vencimiento y días restantes; filtros combinables, búsqueda, orden y totales por moneda. Tabla en escritorio y tarjetas en móvil.
- **Documentos** privados por póliza y anualidad (PDF e imágenes), con vista y descarga autorizadas.
- Identidad visual del grupo (ver `docs/MARCA.md`).
- **Avisos** un mes natural antes del vencimiento, antes del plazo de oposición confirmado, recordatorio y póliza vencida; centro de avisos con reconocer, posponer y «en negociación»; worker sin depender de visitas, con cola idempotente y reintentos (ver `docs/AVISOS.md`).
- **App instalable** (PWA) con notificaciones push en iPhone (iOS ≥ 16.4, instalada) y Android, pantalla «Avisos en este móvil» con prueba y diagnóstico, correo de respaldo y estado del servicio. *Push y correo requieren configurar sus credenciales; la prueba en dispositivo real está pendiente.*

- **Siniestros** con la anualidad vigente en la fecha del hecho, archivos, seguimiento, plantilla de comunicación y **asistente de cobertura** con citas comprobadas contra el PDF (ver `docs/SINIESTROS.md`).
- **Lectura de documentos** revisable: el original junto a la propuesta, con página, cita y confianza; nada se aplica sin confirmar.
- **Renegociación**: ofertas, comparación que señala franquicias superiores y exclusiones nuevas, borrador para el mediador y decisión (renovar, cambiar de compañía o baja).
- *El asistente y la lectura requieren `ANTHROPIC_API_KEY`; sin ella aparecen como «sin configurar».*

Pendiente: copias cifradas y exportación (#8), validación integral en despliegue real (#9).

## Arranque local

Requisitos: Node 22 y PostgreSQL 14 o superior.

```bash
npm install
cp .env.example .env            # y edita DATABASE_URL
npm run db:migrate
npm run usuario:crear -- --email tu@correo.es --nombre "Tu nombre"   # pide la contraseña
npm run dev                     # http://localhost:3000
npm run worker                  # en otra terminal: avisos y envíos
```

Datos de demostración **sintéticos** (solo en una base de datos vacía de pruebas):

```bash
DEMO_PERMITIDA=1 npm run demo:sintetica    # demo@ejemplo.test / demo-sintetica-2026
```

## Variables de entorno

| Variable | Obligatoria | Uso |
| --- | --- | --- |
| `DATABASE_URL` | Sí | Conexión PostgreSQL |
| `APP_URL` | En producción | URL pública con HTTPS (activa cookies `__Host-` seguras y los enlaces de los correos) |
| `STORAGE_DIR` | Sí | Carpeta privada de documentos, fuera de `public/` y con copia de seguridad |
| `MAX_UPLOAD_MB` | No (25) | Tamaño máximo por documento |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | No | Correo de recuperación y avisos de respaldo; sin ellos aparece «sin configurar» |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Para push | Notificaciones (`npx web-push generate-vapid-keys`) |
| `CRON_SECRET` | No | Activa `POST /api/tareas/avisos` como alternativa al worker |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | Para IA | Asistente de siniestros y lectura de documentos (por defecto `claude-sonnet-5-5`) |

Despliegue de referencia con Docker Compose (web + worker + PostgreSQL + Caddy con HTTPS): `docker-compose.yml`.

## Comprobaciones

```bash
npm run lint && npm run typecheck
npm test                 # PostgreSQL real; usa DATABASE_URL_TEST (por defecto polizas_test en localhost)
npm run build
npx playwright test      # interfaz, accesibilidad (axe) y capturas con CAPTURAS=1; requiere la demo sintética y Chrome
```

## Documentación

- `docs/ARQUITECTURA.md` — decisiones técnicas y modelo de datos.
- `docs/SEGURIDAD.md` — medidas de protección, retención y pendientes.
- `docs/SINIESTROS.md` — asistente, lectura de documentos y renegociación.
- `docs/AVISOS.md` — reglas, worker, canales y requisitos de iPhone/Android.
- `docs/MARCA.md` — paleta, contraste, referencias del logotipo y archivos de marca.
- `docs/capturas/` — capturas en móvil y escritorio con datos sintéticos.
