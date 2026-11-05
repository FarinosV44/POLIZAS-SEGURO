'use server';

import { redirect } from 'next/navigation';
import { exigirUsuario } from '@/lib/auth/servidor';
import { manejar, type EstadoForm } from '@/lib/acciones';
import { formulario } from '@/lib/validacion';
import { actualizarTitular, archivarTitular, crearTitular } from '@/lib/datos/titulares';

export async function accionCrearTitular(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  return manejar(fd, async () => {
    const id = await crearTitular(await exigirUsuario(), formulario(fd));
    redirect(fd.get('despues') === 'poliza' ? `/polizas/nueva?titular=${id}` : `/titulares?creado=${id}`);
  });
}

export async function accionEditarTitular(id: string, _: EstadoForm, fd: FormData): Promise<EstadoForm> {
  return manejar(fd, async () => {
    await actualizarTitular(await exigirUsuario(), id, formulario(fd));
    redirect('/titulares');
  });
}

export async function accionArchivarTitular(id: string, archivar: boolean) {
  await archivarTitular(await exigirUsuario(), id, archivar);
  redirect('/titulares');
}
