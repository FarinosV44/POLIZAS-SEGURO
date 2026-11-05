# Arquitectura y decisiones

Estado: primera entrega (issues #11, #1, base de #8, #3 y adjuntos de #2).

## Resumen

| Pieza | Elección | Por qué |
| --- | --- | --- |
| Aplicación | **Next.js 16 (App Router) + TypeScript**, un solo servicio Node | Misma base que el resto de proyectos del grupo (praetoria-web, Praetoria Vacacional). Páginas renderizadas en servidor: los datos no salen del servidor sin autorización y el panel funciona aunque falle el JavaScript. |
| Base de datos | **PostgreSQL** con SQL directo (`pg`) y migraciones en `db/migrations/*.sql` | Persistencia real, transacciones, `daterange` para evitar anualidades solapadas. Sin ORM: menos dependencias y el SQL se revisa tal cual. Funciona con cualquier PostgreSQL ≥ 14 (propio, Supabase, Neon…). |
| Documentos | **Almacén privado en disco** (`STORAGE_DIR`) detrás de una interfaz (`src/lib/almacen.ts`) | Los archivos nunca están en `public/` ni tienen URL permanente: se sirven por `/api/documentos/[id]` tras comprobar sesión y permiso. La interfaz permite cambiar a S3 compatible sin tocar el resto. |
| Sesiones | Propias: cookie `httpOnly` + `SameSite=Lax` (`__Host-` en HTTPS), token aleatorio de 256 bits cuyo **SHA-256** se guarda en la tabla `sesiones` | Revocables al instante (cambio de contraseña, desactivar cuenta), caducidad absoluta (30 días) y por inactividad (14 días). |
| Contraseñas | `scrypt` (N=2¹⁵) de Node, mínimo 12 caracteres | Sin dependencias nativas. |
| Autorización | En servidor, `src/lib/acceso.ts`; todas las consultas filtran por titulares permitidos | Administrador: todo. Colaborador: solo titulares concedidos. Un id ajeno responde 404, igual que uno inexistente. |
| Avisos (entrega 2) | Proceso **worker** con cola en PostgreSQL (`FOR UPDATE SKIP LOCKED`) y claves de idempotencia | Funciona con la web cerrada y sin servicios externos de colas. |
| Push (entrega 2) | Web Push estándar (VAPID) con PWA | iPhone (iOS ≥ 16.4, instalada en pantalla de inicio) y Android. |
| IA (entregas siguientes) | Proveedor intercambiable (`AI_PROVIDER`), credenciales solo en servidor | Si no hay clave, la función aparece como «sin configurar» y nunca se simula. |

## Modelo de datos

```
usuarios ─┬─ sesiones
          └─ accesos_titular ── titulares ── polizas ─┬─ anualidades (una por renovación; histórico intacto)
                                                     └─ documentos (originales privados, hash, tipo, anualidad)
ramos (editables) ── polizas
auditoria (acciones sensibles, sin contenido de documentos)
limites (intentos de acceso y operaciones costosas)
```

- **Titular** = empresa o particular con el que se organiza la aplicación. **Tomador, asegurado y beneficiario** son campos de la póliza y pueden no coincidir con el titular.
- **Anualidad**: inicio, vencimiento, prima anual real, periodicidad, importe del recibo, fecha límite de oposición (con fuente y confirmación) y si los datos están revisados. Renovar crea una fila nueva; corregir una anualidad audita los valores anteriores de fechas e importes.
- Lo que no se conoce queda **NULL / «Pendiente»**. Nada se rellena por defecto.
- **Coste anual**: la prima anual real; si falta, recibo × recibos al año, marcado como «estimado». Las monedas se suman por separado.
- **Anualidad actual**: la que contiene hoy (`[inicio, fin)`); si no la hay, la más reciente.
- **Situación**: vencida (fin < hoy), vence pronto (fin ≤ hoy + 1 mes natural), sin fecha, vigente, en negociación, anulada o sustituida. Se calcula con la fecha de Madrid.

## Estructura

```
db/migrations/        SQL versionado
src/lib/              lógica de servidor (datos, acceso, sesiones, fechas, importes, almacén)
src/app/(publico)/    acceso y recuperación de contraseña
src/app/(app)/        pantallas privadas (panel, pólizas, titulares, ajustes)
src/app/api/          descargas autorizadas
src/app/tokens.css    paleta y tipografía (única fuente)
scripts/              migraciones, alta de usuarios, demo sintética, marca
tests/                pruebas con PostgreSQL real (datos sintéticos)
e2e/                  pruebas de interfaz, accesibilidad y capturas
```

## Alojamiento previsto

Cualquier servidor con Node 22 y PostgreSQL, detrás de HTTPS (por ejemplo, un VPS con Caddy, o Docker). El worker de avisos necesita un proceso que siga vivo. No se ha contratado ningún servicio: la elección del proveedor queda pendiente del propietario (#9).
