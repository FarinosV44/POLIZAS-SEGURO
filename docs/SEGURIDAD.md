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

## Inteligencia artificial

- Proveedor configurable (`AI_PROVIDER`, por defecto Anthropic, modelo `ANTHROPIC_MODEL`); la clave (`ANTHROPIC_API_KEY`) solo existe en el servidor y nunca llega al navegador.
- Solo se llama a la IA por acción expresa de una persona con permiso sobre el titular («Analizar», «Leer datos»). Límite de 20 operaciones por persona y día.
- Se envía exclusivamente lo indicado en `docs/SINIESTROS.md` («Qué se envía»). Nunca se mezclan documentos de otros titulares: la selección se hace en el servidor a partir de las pólizas autorizadas del expediente.
- Documentos y relatos se tratan como datos no confiables (instrucciones incrustadas ignoradas y señaladas).
- Los resultados se guardan en la base de datos con la lista de documentos usados; no se registran contenidos en los registros del servidor.
- Retención en el proveedor: la que establezcan sus condiciones de API vigentes; el responsable debe revisarlas antes de usar datos reales, en especial **información de salud** (pólizas de salud o vida). Para no usar IA basta con no configurar la clave.

## Copias y exportación

- Copia diaria cifrada (AES-256-GCM, clave `COPIAS_CLAVE` solo en el servidor y en el gestor de contraseñas del responsable) de la base de datos y los documentos; retención configurable (30 días). Restauración en base vacía probada automáticamente, incluida la no duplicación de avisos.
- Las copias deben copiarse fuera del servidor (ver `docs/DESPLIEGUE.md`).
- Exportación CSV (separador «;», sin fórmulas ejecutables) y ZIP por póliza o siniestro, siempre con los permisos del usuario y auditada. No incluye secretos ni datos de otros titulares.

## Pendiente

- Decidir el alojamiento y el destino externo de las copias.
- Revisar las condiciones de tratamiento de datos de los proveedores (alojamiento, correo, IA) antes de cargar datos reales, en especial de salud.
