# Seguridad y protección de datos (#8)

Este documento describe las medidas aplicadas. **No declara cumplimiento normativo automático**: la evaluación RGPD (base jurídica, encargados del tratamiento, registro de actividades) corresponde al responsable.

## Medidas ya implementadas

- **Repositorio público sin datos**: `.gitignore` excluye `.env*`, `datos/`, copias, exportaciones, volcados y PDF sueltos. Pruebas y demo usan exclusivamente datos sintéticos.
- **Sin registro público**. Las cuentas se crean con `npm run usuario:crear` o desde Ajustes por un administrador.
- **Sesiones**: cookie `httpOnly`, `SameSite=Lax`, `Secure` y prefijo `__Host-` en HTTPS; en la base de datos solo se guarda el SHA-256 del token. Caducidad 30 días (absoluta) y 14 días sin actividad. Cambiar la contraseña o desactivar la cuenta cierra todas las sesiones.
- **Limitación de intentos**: 5 fallos por cuenta y 20 por IP cada 15 minutos; 5 solicitudes de recuperación por IP y hora; 60 subidas por usuario y hora. Mensajes que no revelan si una cuenta existe.
- **Autorización en servidor** en todas las páginas, acciones y descargas (`src/lib/acceso.ts`). Un id ajeno o inexistente responde igual (404). Pruebas: `tests/acceso.test.ts`.
- **Documentos privados**: fuera de `public/`, permisos de archivo 0600, nombre interno aleatorio; servidos solo por `/api/documentos/[id]` con `Cache-Control: no-store`, `nosniff`, CSP sin scripts y `frame-ancestors 'self'`. Tipo validado por contenido (PDF, JPEG, PNG, WebP, HEIC), tamaño máximo configurable y hash SHA-256.
- **Cabeceras**: CSP restrictiva, `X-Frame-Options: DENY`, `noindex`, `Referrer-Policy: same-origin`, `Permissions-Policy`.
- **Auditoría** (`auditoria`): accesos y fallos, altas y cambios de titulares, pólizas y anualidades (con valor anterior de fechas e importes), subidas, descargas y bajas de documentos, permisos. Sin contenido de documentos ni datos de salud.

## Retención y eliminación (política operativa propuesta)

- Eliminar un documento lo retira **al instante** de la aplicación y de las descargas. El archivo físico se purga tras **30 días** (periodo para deshacer errores); la purga automática se implementa con el worker (entrega 2).
- Pólizas y titulares se **archivan**, no se borran, para conservar el histórico de primas y siniestros.
- Registros de intentos (`limites`) se limpian a las 48 horas; la auditoría se conserva mientras exista la aplicación salvo instrucción del responsable.

## Pendiente (próximas entregas)

- Copias automáticas cifradas de base de datos y documentos, retención configurable y restauración probada.
- Exportación CSV por titular y paquete de expediente con permisos.
- Purga de archivos eliminados y limpieza de sesiones caducadas desde el worker.
- Política de envío a IA (qué se envía, a quién y cómo desactivarlo) cuando se integre el proveedor.
