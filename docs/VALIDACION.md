# Validación por issue (#9)

Estado a 5 de noviembre de 2026. **Evidencia** = prueba automática que se ejecuta en CI (`npm test` con PostgreSQL real y `npx playwright test` con Chrome, axe y datos sintéticos). **Pendiente** = requiere un despliegue real, credenciales o dispositivos que no hay en el entorno de desarrollo. Ningún issue se cierra hasta que su fila esté completa.

## #11 · Identidad visual

| Criterio | Estado | Evidencia |
| --- | --- | --- |
| Nombre en interfaz y metadatos de instalación | ✔ | `e2e/interfaz.spec.ts` (título), `e2e/avisos.spec.ts` (manifest) |
| Tipografía y tokens globales | ✔ | `src/app/tokens.css`; ningún color suelto en pantallas |
| Capturas acceso, panel y ficha en móvil y escritorio | ✔ | `docs/capturas/` |
| Contraste y foco (naranja) | ✔ | `tests/contraste.test.ts`, axe WCAG 2.1 AA en todas las pruebas de interfaz |
| Logo con referencias del grupo y activos favicon/PWA | ⏳ | Propuesta en `docs/MARCA.md`; **falta tu aprobación** y, si existe, el maestro vectorial del logotipo horizontal del grupo |

## #1 · Base y separación por titular

| Criterio | Estado | Evidencia |
| --- | --- | --- |
| Dos empresas y un particular, filtrar y editar sin mezclar | ✔ | `tests/acceso.test.ts`, `e2e/interfaz.spec.ts` |
| Sin permisos no se accede cambiando URL o ID | ✔ | `tests/acceso.test.ts`, `tests/siniestros.test.ts`, `tests/copias-exportar.test.ts` |
| Persistencia tras cerrar sesión y desde otro dispositivo | ✔ / ⏳ | Persistencia en PostgreSQL probada; prueba manual en dos dispositivos pendiente del despliegue |
| README, variables sin secretos, migraciones, decisiones | ✔ | `README.md`, `.env.example`, `db/migrations`, `docs/ARQUITECTURA.md` |
| Pruebas de aislamiento y póliza-anualidad | ✔ | `tests/acceso.test.ts`, `tests/polizas.test.ts` |

## #2 · Documentos y extracción

| Criterio | Estado | Evidencia |
| --- | --- | --- |
| PDF de texto, escaneado, imagen e ilegible (sintéticos) | ✔ / ⏳ | Texto y verificación de citas con PDF sintéticos; ilegible y caída del proveedor probados con proveedor controlado. **Lectura real de escaneados e imágenes pendiente de `ANTHROPIC_API_KEY`** |
| OCR fallido no confirma ni inventa fechas | ✔ | `tests/extraccion-renovacion.test.ts` |
| Correcciones humanas prevalecen | ✔ | ídem (relectura no sobrescribe) |
| Enlace campo → documento/página; descarga no anónima | ✔ | revisión con página y cita; `e2e/interfaz.spec.ts` (404 sin sesión) |
| Duplicados y suplemento sin borrar la versión anterior | ✔ | `tests/documentos.test.ts`; anualidades e histórico en `tests/polizas.test.ts` |

## #3 · Panel

| Criterio | Estado | Evidencia |
| --- | --- | --- |
| Tipo, titular, precio y vencimiento sin abrir la póliza | ✔ | `e2e/interfaz.spec.ts`, capturas |
| 375 px sin scroll horizontal, navegación accesible | ✔ | `e2e/*.spec.ts` (móvil + axe) |
| Totales mensual/trimestral/anual, monedas, datos incompletos | ✔ | `tests/polizas.test.ts` |
| Filtros sin mezclar titulares y conservados al volver | ✔ | `e2e/interfaz.spec.ts` |

## #4 · Avisos

| Criterio | Estado | Evidencia |
| --- | --- | --- |
| Reloj controlado: fin de mes, bisiesto, cambio de hora, límite de día | ✔ | `tests/avisos.test.ts`, `tests/fechas-dinero.test.ts` |
| Repetir la tarea no duplica | ✔ | `tests/avisos.test.ts` (también tras restaurar una copia) |
| App cerrada recibe el aviso en dispositivo real | ⏳ | Requiere despliegue HTTPS + VAPID |
| Fallo de push → respaldo e incidencia visible | ✔ | `tests/avisos.test.ts`, Estado del servicio |
| Renovar o corregir fecha anula alertas antiguas | ✔ | `tests/avisos.test.ts`, `tests/extraccion-renovacion.test.ts` |

## #5 · App instalable y push

| Criterio | Estado | Evidencia |
| --- | --- | --- |
| Instalar y abrir en modo app | ✔ / ⏳ | Manifest standalone e iconos verificados (`e2e/avisos.spec.ts`); instalación real pendiente |
| Push con app cerrada en iPhone y Android, abre el destino | ⏳ | Pasos en `docs/AVISOS.md` |
| Permiso denegado, suscripción caducada, cierre de sesión | ✔ / ⏳ | Caducada probada (`tests/avisos.test.ts`); denegado y salida implementados, prueba en dispositivo pendiente |

## #6 · Renegociación

| Criterio | Estado | Evidencia |
| --- | --- | --- |
| Aviso → ofertas → decisión → renovación con histórico intacto | ✔ | `tests/extraccion-renovacion.test.ts`, `e2e/siniestros.spec.ts` |
| Oferta con franquicia superior y exclusión nueva visibles | ✔ | ídem |
| Generar borrador no cierra ni desactiva avisos | ✔ | ídem |

## #7 · Siniestros

| Criterio | Estado | Evidencia |
| --- | --- | --- |
| Casos con cobertura, exclusión, franquicia, póliza renovada/vencida, documento ausente | ✔ | `tests/siniestros.test.ts` (proveedor controlado) |
| Afirmaciones rastreables; borrador sin hechos no facilitados | ✔ | verificación de citas contra el PDF y detección de datos añadidos |
| Pregunta ambigua, prompt injection, acceso cruzado | ✔ | ídem |
| Condiciones de la fecha del hecho tras renovar | ✔ | ídem |
| Calidad con el proveedor real | ⏳ | Requiere `ANTHROPIC_API_KEY` y una batería con documentos sintéticos realistas |

## #8 · Seguridad

| Criterio | Estado | Evidencia |
| --- | --- | --- |
| Anónimo y no autorizado sin registros, PDF, exportaciones ni IA | ✔ | `tests/*`, `e2e/interfaz.spec.ts` |
| Restauración recupera relaciones, archivos y calendario sin duplicar | ✔ | `tests/copias-exportar.test.ts` |
| Exportación por titular con permisos | ✔ | ídem |
| Bundle y repositorio sin secretos | ✔ | paso de CI «Secretos en el código del navegador»; `.gitignore` |
| Revocación afecta a enlaces y trabajos futuros | ✔ | desactivar usuario cierra sesiones; permisos retirados; avisos solo a usuarios con acceso (`tests/avisos.test.ts`) |
| Copias fuera del servidor | ⏳ | Decisión de alojamiento del propietario (`docs/DESPLIEGUE.md`) |

## Pendiente global

1. Elegir alojamiento y dominio; desplegar con `docs/DESPLIEGUE.md`.
2. Configurar `VAPID_*`, `SMTP_*`, `ANTHROPIC_API_KEY`, `COPIAS_CLAVE`.
3. Prueba en iPhone y Android reales con la app cerrada; prueba de persistencia desde dos dispositivos.
4. Aprobar o ajustar el logotipo.
5. Prueba integral completa en el entorno desplegado (crear titular → subir documento → confirmar lectura → aviso → push → renegociar → renovar → siniestro de la anualidad anterior con citas y borrador).
