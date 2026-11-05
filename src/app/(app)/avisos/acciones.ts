'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { exigirUsuario } from '@/lib/auth/servidor';
import { manejar, type EstadoForm } from '@/lib/acciones';
import { atender, borrarSuscripcion, guardarAjustesAvisos, guardarPreferencias, guardarSuscripcion, suscripcionDe } from '@/lib/datos/avisos';
import { enviarPush, pushConfigurado } from '@/lib/avisos/push';
import { formulario } from '@/lib/validacion';
import { registrarIntento, superaLimite } from '@/lib/auth/limites';

export async function accionAtender(id: string, _: EstadoForm, fd: FormData): Promise<EstadoForm> {
  return manejar(fd, async () => {
    const u = await exigirUsuario();
    const accion = String(fd.get('accion') ?? '');
    const a = await atender(u, id, accion, String(fd.get('hasta') ?? '') || null);
    revalidatePath('/avisos');
    if (accion === 'negociar') redirect(`/polizas/${a.poliza_id}`);
    return { ok: accion === 'posponer' ? 'Aviso pospuesto. Volverá en la fecha elegida.' : 'Aviso marcado como atendido.', n: Date.now() };
  });
}

type Sub = { endpoint: string; keys: { p256dh: string; auth: string } };

export async function accionGuardarSuscripcion(sub: Sub) {
  const u = await exigirUsuario();
  await guardarSuscripcion(u, sub, (await headers()).get('user-agent'));
  return { ok: true };
}

export async function accionBorrarSuscripcion(endpoint: string) {
  const u = await exigirUsuario();
  await borrarSuscripcion(u, endpoint);
  return { ok: true };
}

export async function accionEstadoSuscripcion(endpoint: string) {
  const u = await exigirUsuario();
  const s = await suscripcionDe(u, endpoint);
  return s ? { registrada: !s.revocada_en, ultimoExito: s.ultimo_exito?.toISOString() ?? null, ultimoError: s.ultimo_error } : { registrada: false, ultimoExito: null, ultimoError: null };
}

/** Envía una notificación de prueba a este dispositivo (no pasa por la cola de avisos). */
export async function accionProbarPush(endpoint: string): Promise<{ ok: boolean; mensaje: string }> {
  const u = await exigirUsuario();
  if (!pushConfigurado()) return { ok: false, mensaje: 'El servidor no tiene configuradas las claves de notificaciones (VAPID).' };
  if (await superaLimite(`push-prueba:${u.id}`, 10, 60)) return { ok: false, mensaje: 'Demasiadas pruebas seguidas. Espera unos minutos.' };
  await registrarIntento(`push-prueba:${u.id}`, false);
  const s = await suscripcionDe(u, endpoint);
  if (!s || s.revocada_en) return { ok: false, mensaje: 'Este dispositivo no está suscrito.' };
  const r = await enviarPush(s, { title: 'PRAETORIA', body: 'Notificación de prueba: los avisos llegarán a este dispositivo.', url: '/avisos/dispositivo', tag: 'prueba' });
  if (r.ok) return { ok: true, mensaje: 'Enviada al servicio de notificaciones. Debería aparecer en unos segundos, también con la aplicación cerrada.' };
  if (r.caducada) await borrarSuscripcion(u, endpoint);
  return { ok: false, mensaje: r.caducada ? 'La suscripción ha caducado. Vuelve a activar los avisos.' : `El servicio de notificaciones respondió con un error: ${r.error}` };
}

export async function accionPreferencias(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  return manejar(fd, async () => {
    await guardarPreferencias(await exigirUsuario(), { correo_avisos: String(fd.get('correo_avisos') ?? ''), push_detallado: fd.get('push_detallado') === 'on' });
    return { ok: 'Preferencias guardadas.', n: Date.now() };
  });
}

export async function accionAjustesAvisos(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  return manejar(fd, async () => {
    await guardarAjustesAvisos(await exigirUsuario(), formulario(fd));
    return { ok: 'Ajustes de avisos guardados. Se aplican en la próxima ejecución del planificador.', n: Date.now() };
  });
}
