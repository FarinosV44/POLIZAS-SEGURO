import type { Metadata } from 'next';
import Link from 'next/link';
import { Campo, Enviar, Formulario } from '@/components/formulario';
import { accionRecuperar } from '@/app/sesion-acciones';

export const metadata: Metadata = { title: 'Recuperar contraseña' };

export default function Recuperar() {
  return (
    <div className="tarjeta">
      <h1>Recuperar contraseña</h1>
      <Formulario accion={accionRecuperar} aria="Recuperar contraseña">
        <p className="secundario pequeno">Te enviaremos un enlace válido durante una hora.</p>
        <Campo nombre="email" etiqueta="Correo electrónico" tipo="email" autoComplete="username" requerido />
        <Enviar pendiente="Enviando…">Enviar enlace</Enviar>
        <p className="pequeno" style={{ textAlign: 'center' }}><Link href="/acceso">Volver al acceso</Link></p>
      </Formulario>
    </div>
  );
}
