'use client';

import { useRef } from 'react';
import { IconoSalir } from './iconos';

/**
 * Al salir se da de baja la suscripción push de este dispositivo (para que no lleguen avisos
 * a un teléfono sin sesión) y se envía su endpoint para revocarla también en el servidor.
 */
export function BotonSalir({ accion }: { accion: (fd: FormData) => Promise<void> }) {
  const campo = useRef<HTMLInputElement>(null);
  async function antes(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    if (form.dataset.listo) return;
    e.preventDefault();
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) { if (campo.current) campo.current.value = sub.endpoint; await sub.unsubscribe(); }
    } catch { /* sin soporte: se sale igualmente */ }
    form.dataset.listo = '1';
    form.requestSubmit();
  }
  return (
    <form action={accion} onSubmit={antes}>
      <input ref={campo} type="hidden" name="endpoint" />
      <button className="boton boton--sutil boton--peq" type="submit"><IconoSalir /> Salir</button>
    </form>
  );
}
