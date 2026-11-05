'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { cerrarSesion } from '@/lib/auth/sesiones';
import { borrarCookieSesion, guardarCookieSesion, ipCliente, tokenActual, usuarioActual } from '@/lib/auth/servidor';
import { acceder, crearRecuperacion, restablecerClave } from '@/lib/datos/usuarios';
import { auditar } from '@/lib/auditoria';
import { manejar, type EstadoForm } from '@/lib/acciones';
import { enviarCorreo, correoConfigurado } from '@/lib/correo';
import { Invalido } from '@/lib/errores';
import { borrarSuscripcion } from '@/lib/datos/avisos';

/** Solo se aceptan destinos internos tras iniciar sesión (evita redirecciones abiertas). */
function destinoSeguro(v: FormDataEntryValue | null) {
  const d = typeof v === 'string' ? v : '';
  return d.startsWith('/') && !d.startsWith('//') && !d.startsWith('/\\') ? d : '/';
}

export async function accionAcceder(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const email = String(fd.get('email') ?? '');
  const r = await acceder(email, String(fd.get('clave') ?? ''), await ipCliente(), (await headers()).get('user-agent'));
  if (!r.ok) {
    return {
      error: r.motivo === 'bloqueado'
        ? 'Demasiados intentos fallidos. Espera 15 minutos antes de volver a intentarlo.'
        : 'Correo o contraseña incorrectos.',
      valores: { email }, n: Date.now(),
    };
  }
  await guardarCookieSesion(r.token);
  redirect(destinoSeguro(fd.get('destino')));
}

export async function accionSalir(fd?: FormData) {
  const u = await usuarioActual();
  const endpoint = fd?.get('endpoint');
  if (u && typeof endpoint === 'string' && endpoint) await borrarSuscripcion(u, endpoint);
  await cerrarSesion(await tokenActual());
  await borrarCookieSesion();
  if (u) await auditar(u.id, 'salida', 'usuario', u.id);
  redirect('/acceso');
}

export async function accionRecuperar(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  return manejar(fd, async () => {
    const email = String(fd.get('email') ?? '').trim();
    if (!email.includes('@')) throw new Invalido({ email: 'Escribe tu correo.' });
    if (!correoConfigurado()) {
      return { error: 'El envío de correos no está configurado. Pide a un administrador que restablezca tu contraseña.' };
    }
    const t = await crearRecuperacion(email, await ipCliente());
    if (t) {
      const url = `${process.env.APP_URL ?? ''}/restablecer?t=${encodeURIComponent(t)}`;
      await enviarCorreo({
        para: email,
        asunto: 'Restablecer tu contraseña · PRAETORIA gestor de seguros',
        texto: `Has pedido restablecer tu contraseña.\n\nAbre este enlace en la próxima hora:\n${url}\n\nSi no lo has pedido tú, ignora este mensaje.`,
      }).catch((e) => console.error('[recuperar] envío fallido', (e as Error).message));
    }
    // Misma respuesta exista o no la cuenta.
    return { ok: 'Si el correo corresponde a una cuenta activa, recibirás un enlace para restablecer la contraseña.' };
  });
}

export async function accionRestablecer(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  return manejar(fd, async () => {
    const nueva = String(fd.get('clave') ?? '');
    if (nueva !== String(fd.get('clave2') ?? '')) throw new Invalido({ clave2: 'Las contraseñas no coinciden.' });
    try {
      await restablecerClave(String(fd.get('t') ?? ''), nueva);
    } catch (e) {
      if (e instanceof Invalido && e.campos.nueva) throw new Invalido({ clave: e.campos.nueva });
      throw e;
    }
    redirect('/acceso?restablecida=1');
  });
}
