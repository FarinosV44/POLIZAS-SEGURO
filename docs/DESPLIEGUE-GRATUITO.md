# Despliegue sin coste (Vercel + Supabase + GitHub Actions)

Elegido por el propietario el 5 de noviembre de 2026: **0 € al mes**, sin tarjeta.

| Pieza | Servicio gratuito | Qué hace |
| --- | --- | --- |
| Web | **Vercel Hobby** | La aplicación (Next.js), con funciones de hasta 300 s |
| Base de datos | **Supabase** (proyecto `praetoria-abogados`, Frankfurt) | Esquema **`seguros`** y usuario **`seguros_app`** propios, sin acceso a las tablas del portal del despacho y no expuestos por la API pública |
| Documentos | **Supabase Storage**, bucket privado `seguros-documentos` | Los archivos se suben directamente desde el navegador con una autorización de un solo uso (Vercel limita las peticiones a 4,5 MB); solo el servidor puede leerlos |
| Avisos sin abrir la web | **GitHub Actions** (`.github/workflows/tareas.yml`) | Cada 10 minutos llama a `POST /api/tareas/avisos` con `CRON_SECRET` |
| Copia diaria cifrada | **GitHub Actions** (`.github/workflows/copias.yml`) | `pg_dump` del esquema + documentos, AES-256-GCM, al bucket privado `seguros-copias` |
| Análisis y lectura con IA | Al pedirlos (después de responder) y, de respaldo, en la tarea de 10 minutos | |

## Límites a tener en cuenta

- **Supabase gratuito**: 500 MB de base de datos y 1 GB de archivos para todo el proyecto (compartido con el portal del despacho). Pausa tras 7 días sin actividad: la tarea de cada 10 minutos lo mantiene activo.
- **Vercel Hobby**: sus condiciones lo reservan para uso personal y no comercial. Si se considera uso empresarial, el plan Pro cuesta 20 $/mes; la alternativa gratuita es un servidor propio (`docs/DESPLIEGUE.md`).
- **GitHub Actions** puede retrasar unos minutos las ejecuciones programadas. Los avisos son diarios (a partir de las 9:00 de Madrid), así que no afecta.
- Copias en el mismo proveedor que los datos: protegen de errores y borrados, no de perder la cuenta. Descarga una de vez en cuando (Supabase → Storage → `seguros-copias`).

## Pasos (una sola vez)

1. **Clave secreta de Supabase**: Supabase → proyecto `praetoria-abogados` → *Project Settings › API Keys* → *Secret keys* → *Create new* (nombre: `seguros`). Cópiala.
2. **Host del pooler**: Supabase → *Connect* → *Transaction pooler* → copia el host (`aws-…-eu-central-1.pooler.supabase.com`).
3. **Vercel**: entra en vercel.com con tu cuenta de GitHub (plan *Hobby*) → *Add New › Project* → importa `FarinosV44/POLIZAS-SEGURO` → en *Environment Variables* pega el archivo de variables que te ha dado Claude (no está en el repositorio), con la clave y el host de los pasos 1 y 2 → *Deploy*.
4. Copia la dirección que te da Vercel (`https://….vercel.app`), ponla en la variable `APP_URL` de Vercel y pulsa *Redeploy*.
5. **GitHub** → *Settings › Secrets and variables › Actions*: variable `APP_URL` (la misma dirección) y secreto `CRON_SECRET` (el del archivo). Opcional para las copias: `COPIAS_CLAVE`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `DATABASE_URL_COPIAS`.
6. Entra con tu correo y la contraseña temporal y cámbiala en *Ajustes*.
7. Comprueba *Ajustes › Estado y avisos*: planificador «Activo» a los pocos minutos y notificaciones «Configuradas».

## Migraciones futuras

*Actions › Migraciones (manual) › Run workflow* (usa `DATABASE_URL_COPIAS`), o pídeselo a Claude, que puede aplicarlas con el conector de Supabase.
