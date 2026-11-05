import type { Metadata } from 'next';
import Link from 'next/link';
import { exigirUsuario } from '@/lib/auth/servidor';
import { preferencias } from '@/lib/datos/avisos';
import { clavePublicaVapid } from '@/lib/avisos/push';
import { correoConfigurado } from '@/lib/correo';
import { Casilla, Enviar, Formulario, Radios } from '@/components/formulario';
import { PanelDispositivo } from './panel-dispositivo';
import { accionPreferencias } from '../acciones';

export const metadata: Metadata = { title: 'Avisos en este móvil' };

export default async function Dispositivo() {
  const u = await exigirUsuario();
  const p = await preferencias(u);
  return (
    <>
      <div className="migas"><Link href="/avisos">← Avisos</Link></div>
      <div className="encabezado"><div><h1>Avisos en este móvil</h1><p className="secundario pequeno">Las notificaciones llegan aunque la aplicación esté cerrada.</p></div></div>
      <PanelDispositivo clavePublica={clavePublicaVapid()} />
      <section className="tarjeta tarjeta--pad bloque" aria-labelledby="t-pref" style={{ marginTop: 'var(--e-5)', maxWidth: 760 }}>
        <h2 id="t-pref" style={{ marginBottom: 'var(--e-4)' }}>Preferencias</h2>
        <Formulario accion={accionPreferencias} aria="Preferencias de avisos">
          <Radios nombre="correo_avisos" etiqueta="Correo electrónico" defecto={p.correo_avisos} opciones={[
            { valor: 'respaldo', texto: 'Solo si no llega la notificación' },
            { valor: 'siempre', texto: 'Siempre' },
            { valor: 'nunca', texto: 'Nunca' },
          ]} />
          {!correoConfigurado() && <p className="pequeno" style={{ color: 'var(--color-aviso-texto)' }}>El envío de correo aún no está configurado en el servidor.</p>}
          <Casilla nombre="push_detallado" defecto={p.push_detallado} etiqueta="Mostrar el detalle en la notificación" ayuda="Por defecto la pantalla bloqueada solo dice que hay un aviso, sin titular, aseguradora ni importe." />
          <div><Enviar>Guardar preferencias</Enviar></div>
        </Formulario>
      </section>
    </>
  );
}
