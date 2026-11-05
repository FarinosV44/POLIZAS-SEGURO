import 'server-only';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { usuarioDeToken, type Usuario, DURACION_DIAS } from './sesiones';

const seguro = () => (process.env.APP_URL ?? '').startsWith('https://');
// En HTTPS se usa el prefijo __Host- (solo HTTPS, sin dominio, ruta /).
export const nombreCookie = () => (seguro() ? '__Host-praetoria' : 'praetoria_sesion');

export async function guardarCookieSesion(t: string) {
  (await cookies()).set(nombreCookie(), t, {
    httpOnly: true, secure: seguro(), sameSite: 'lax', path: '/', maxAge: DURACION_DIAS * 86400,
  });
}

export async function borrarCookieSesion() {
  (await cookies()).delete(nombreCookie());
}

export async function tokenActual() {
  return (await cookies()).get(nombreCookie())?.value ?? null;
}

/** Usuario de la petición actual (una consulta por petición). */
export const usuarioActual = cache(async (): Promise<Usuario | null> => usuarioDeToken(await tokenActual()));

/** Exige sesión; si no la hay, envía al acceso conservando el destino. */
export async function exigirUsuario(destino?: string): Promise<Usuario> {
  const u = await usuarioActual();
  if (!u) redirect(`/acceso${destino ? `?destino=${encodeURIComponent(destino)}` : ''}`);
  return u;
}

export async function exigirAdmin(): Promise<Usuario> {
  const u = await exigirUsuario();
  if (u.rol !== 'admin') redirect('/');
  return u;
}

export async function ipCliente() {
  const h = await headers();
  return (h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'local').slice(0, 64);
}
