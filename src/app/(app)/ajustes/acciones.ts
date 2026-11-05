'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { exigirUsuario, borrarCookieSesion } from '@/lib/auth/servidor';
import { manejar, type EstadoForm } from '@/lib/acciones';
import { formulario } from '@/lib/validacion';
import { activarUsuario, cambiarClave, crearUsuario, fijarAccesos } from '@/lib/datos/usuarios';
import { actualizarRamo, crearRamo } from '@/lib/datos/polizas';
import { Invalido } from '@/lib/errores';

export async function accionCambiarClave(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  return manejar(fd, async () => {
    const nueva = String(fd.get('nueva_clave') ?? '');
    if (nueva !== String(fd.get('nueva_clave2') ?? '')) throw new Invalido({ nueva_clave2: 'Las contraseñas no coinciden.' });
    try {
      await cambiarClave(await exigirUsuario(), String(fd.get('actual_clave') ?? ''), nueva);
    } catch (e) {
      if (e instanceof Invalido) throw new Invalido({ actual_clave: e.campos.actual ?? '', nueva_clave: e.campos.nueva ?? '' });
      throw e;
    }
    await borrarCookieSesion();
    redirect('/acceso?restablecida=1');
  });
}

export async function accionCrearUsuario(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  return manejar(fd, async () => {
    const d = formulario(fd);
    await crearUsuario(await exigirUsuario(), { ...d, clave: String(fd.get('nueva_clave') ?? '') });
    revalidatePath('/ajustes');
    return { ok: `Cuenta creada para ${d.email}. Comunícale la contraseña por un canal seguro y pídele que la cambie.`, n: Date.now() };
  });
}

export async function accionAccesos(usuarioId: string, _: EstadoForm, fd: FormData): Promise<EstadoForm> {
  return manejar(fd, async () => {
    await fijarAccesos(await exigirUsuario(), usuarioId, fd.getAll('titular').map(String));
    return { ok: 'Permisos guardados.', n: Date.now() };
  });
}

export async function accionActivar(usuarioId: string, activo: boolean) {
  await activarUsuario(await exigirUsuario(), usuarioId, activo);
  redirect(`/ajustes/usuarios/${usuarioId}`);
}

export async function accionCrearRamo(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  return manejar(fd, async () => {
    await crearRamo(await exigirUsuario(), formulario(fd));
    revalidatePath('/ajustes/tipos');
    return { ok: 'Tipo de seguro añadido.', n: Date.now() };
  });
}

export async function accionEditarRamo(id: string, _: EstadoForm, fd: FormData): Promise<EstadoForm> {
  return manejar(fd, async () => {
    await actualizarRamo(await exigirUsuario(), id, formulario(fd));
    revalidatePath('/ajustes/tipos');
    return { ok: 'Guardado.', n: Date.now() };
  });
}
