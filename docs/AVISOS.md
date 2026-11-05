# Avisos, app instalable y notificaciones (#4, #5)

## Reglas

| Aviso | Cuándo | Condición |
| --- | --- | --- |
| Renovación | **Un mes natural antes** del vencimiento. Si ese día no existe, el último día válido del mes (31-03 → 28-02, o 29-02 en bisiesto). Nunca «30 días». | Última anualidad de una póliza activa o en negociación, no archivada, con vencimiento conocido |
| Plazo de oposición | *Margen* días antes de la fecha límite (15 por defecto) | Solo si la fecha límite está **confirmada con su fuente** en la anualidad. No se deduce del ramo ni de ninguna norma |
| Recordatorio | *N* días antes del vencimiento (7 por defecto; 0 lo desactiva) | Igual que el de renovación |
| Póliza vencida | El día siguiente al vencimiento, una vez | Sin anualidad nueva registrada. Nunca dice «vence en un mes» |

- Calendario y horas de **Europe/Madrid**; no se envía nada antes de la hora configurada (9:00 por defecto).
- Un aviso sin atender se repite cada 7 días, como máximo 2 veces. «Ya está gestionado», «Posponer» (hasta una fecha; no cambia el vencimiento ni el plazo) y «En negociación» detienen las repeticiones.
- Si una póliza se da de alta ya dentro de la ventana, el aviso sale en la siguiente ejecución. Si entran a la vez el de un mes y el recordatorio, solo sale el más próximo.
- Renovar, corregir fechas, anular, archivar o desactivar el recordatorio deja **obsoletos** los avisos que ya no corresponden y descarta sus envíos pendientes.

Ajustes en **Ajustes › Estado y avisos** (administrador).

## Cómo funciona sin abrir la web

`npm run worker` es un proceso permanente:

- cada 5 minutos: planifica (crea los avisos que tocan, con clave única `anualidad:tipo:referencia:fecha`), emite los que han llegado y limpia sesiones caducadas y documentos eliminados hace más de 30 días;
- cada minuto: procesa la cola de envíos.

Garantías:
- **Sin duplicados**: claves únicas en `avisos` y `envios` (aviso + emisión + canal + destinatario); `pg_try_advisory_lock` evita dos planificaciones simultáneas y `FOR UPDATE SKIP LOCKED` que dos procesos envíen lo mismo.
- **Reintentos**: 1 min, 5 min, 30 min, 2 h y 12 h; después «fallido», visible en el aviso y en *Estado del servicio*.
- **Recuperación**: tras una caída, la siguiente ejecución emite lo pendiente.
- Alternativa al worker: `POST /api/tareas/avisos` con `Authorization: Bearer $CRON_SECRET` (mínimo 32 caracteres) desde un cron externo cada 5 minutos, o `npm run avisos:ejecutar` desde el cron del sistema.

Estados de cada envío: **enviado** = aceptado por el servicio de notificaciones o de correo (no garantiza que se haya visto); **leído** = la persona abrió el aviso en la aplicación.

## Canales

| Canal | Configuración | Sin configurar |
| --- | --- | --- |
| Centro de avisos (aplicación) | Siempre | — |
| Push | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | La pantalla «Avisos en este móvil» lo indica y no ofrece activar |
| Correo | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | No se encola correo; *Estado del servicio* lo indica |

Cada persona elige el correo: *solo si no llega la notificación* (por defecto: sin dispositivos suscritos o si el push falla de forma definitiva), *siempre* o *nunca*.

La notificación en pantalla bloqueada es **discreta por defecto** («Tienes una póliza que vence pronto»); el detalle (póliza, titular, aseguradora, importe) solo si la persona lo activa.

### Generar las claves VAPID

```bash
npx web-push generate-vapid-keys
```

Copiar la pública y la privada al `.env` del servidor (nunca al repositorio) con `VAPID_SUBJECT=mailto:tu-correo`. Comprobar en *Ajustes › Estado y avisos* que «Notificaciones push» aparece como configurado y, desde el móvil, *Avisos › Avisos en este móvil › Activar avisos › Enviar notificación de prueba*.

## Requisitos de los teléfonos (comprobados en noviembre de 2026)

- **iPhone / iPad**: iOS o iPadOS **16.4 o posterior**. La aplicación debe **añadirse a la pantalla de inicio desde Safari** y abrirse desde el icono; en una pestaña de Safari no existe la API de push. El permiso solo puede pedirse tras pulsar un botón. El manifest declara `display: standalone`. No hace falta cuenta de desarrollador de Apple; los envíos van por `*.push.apple.com` (si el servidor filtra salidas, permitir ese dominio). Fuente: [WebKit — Web Push for Web Apps on iOS and iPadOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/).
- **Android**: Chrome (o Edge, Firefox, Samsung Internet) admite push también sin instalar; se recomienda instalar desde el menú ⋮ › «Instalar aplicación». Los envíos van por `fcm.googleapis.com`.
- Requiere **HTTPS** en producción (en `localhost` funciona sin él).

## Privacidad en el teléfono

El service worker (`public/sw.js`) solo muestra notificaciones y una página «sin conexión». No guarda pólizas, documentos ni datos personales en caché. Al pulsar **Salir**, se da de baja la suscripción push de ese dispositivo y se revoca en el servidor.

## Prueba en dispositivo real: PENDIENTE

Las pruebas automáticas cubren reglas, calendario (fin de mes, bisiestos, cambios de hora), idempotencia, reintentos, caducidad de suscripciones, respaldo por correo y destinatarios. **No se ha podido comprobar todavía la recepción con la app cerrada en un iPhone y un Android reales**: requiere un despliegue con HTTPS y las claves VAPID. Pasos para la validación:

1. Desplegar con HTTPS, `VAPID_*` configuradas y `npm run worker` en marcha.
2. En el iPhone (iOS ≥ 16.4): Safari › Compartir › Añadir a pantalla de inicio › abrir › entrar › Avisos en este móvil › Activar avisos › Enviar notificación de prueba. Cerrar la app y repetir la prueba desde otro dispositivo.
3. En Android: Chrome › entrar › Avisos en este móvil › Activar › prueba con la app cerrada.
4. Pulsar la notificación: debe abrir el aviso; si la sesión caducó, pide entrar y vuelve al aviso.
5. Probar permiso denegado (mensaje y ruta de ajustes) y «Salir» (deja de recibir avisos ese dispositivo).
