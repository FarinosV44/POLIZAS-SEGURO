import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Campo, Enviar, Formulario } from '@/components/formulario';
import { accionAcceder } from '@/app/sesion-acciones';
import { usuarioActual } from '@/lib/auth/servidor';

export const metadata: Metadata = { title: 'Acceso' };

export default async function Acceso({ searchParams }: { searchParams: Promise<{ destino?: string; restablecida?: string }> }) {
  const { destino, restablecida } = await searchParams;
  if (await usuarioActual()) redirect('/');
  return (
    <div className="tarjeta">
      <h1>Iniciar sesión</h1>
      {restablecida && <div className="aviso aviso--ok" role="status" style={{ marginBottom: 'var(--e-4)' }}>Contraseña cambiada. Ya puedes entrar.</div>}
      <Formulario accion={accionAcceder} aria="Iniciar sesión">
        <input type="hidden" name="destino" value={destino ?? '/'} />
        <Campo nombre="email" etiqueta="Correo electrónico" tipo="email" autoComplete="username" inputMode="email" requerido autoFocus />
        <Campo nombre="clave" etiqueta="Contraseña" tipo="password" autoComplete="current-password" requerido />
        <Enviar pendiente="Entrando…">Entrar</Enviar>
        <p className="pequeno" style={{ textAlign: 'center' }}><Link href="/recuperar">¿Has olvidado la contraseña?</Link></p>
      </Formulario>
    </div>
  );
}
