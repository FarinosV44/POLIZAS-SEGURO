'use client';

import { useCallback, useEffect, useState } from 'react';
import { accionBorrarSuscripcion, accionEstadoSuscripcion, accionGuardarSuscripcion, accionProbarPush } from '../acciones';

type Diagnostico = {
  soporte: boolean; instalada: boolean; ios: boolean; android: boolean; iosVersion: number | null;
  permiso: NotificationPermission | 'no-disponible'; suscrita: boolean; registrada: boolean;
  ultimoExito: string | null; ultimoError: string | null;
};

function base64aBytes(b64: string) {
  const s = atob((b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

async function diagnosticar(): Promise<Diagnostico> {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const m = ua.match(/OS (\d+)_(\d+)/);
  const instalada = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
  const soporte = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  let suscrita = false, registrada = false;
  let ultimoExito: string | null = null, ultimoError: string | null = null;
  if (soporte) {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    suscrita = !!sub;
    if (sub) ({ registrada, ultimoExito, ultimoError } = await accionEstadoSuscripcion(sub.endpoint));
  }
  return {
    soporte, instalada, ios, android: /Android/.test(ua), iosVersion: m ? Number(m[1]) + Number(m[2]) / 10 : null,
    permiso: 'Notification' in window ? Notification.permission : 'no-disponible', suscrita, registrada, ultimoExito, ultimoError,
  } satisfies Diagnostico;
}

/** Pantalla «Avisos en este móvil» (#5): instalación, permiso, suscripción, prueba y diagnóstico. */
export function PanelDispositivo({ clavePublica }: { clavePublica: string | null }) {
  const [d, setD] = useState<Diagnostico | null>(null);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const comprobar = useCallback(async () => setD(await diagnosticar()), []);

  useEffect(() => {
    let vivo = true;
    diagnosticar().then((r) => { if (vivo) setD(r); });
    return () => { vivo = false; };
  }, []);


  // El permiso se pide SOLO tras pulsar el botón (requisito de iPhone).
  async function activar() {
    setOcupado(true); setMensaje(null);
    try {
      if (!clavePublica) throw new Error('El servidor aún no tiene configuradas las notificaciones (faltan las claves VAPID).');
      const permiso = await Notification.requestPermission();
      if (permiso !== 'granted') throw new Error(permiso === 'denied' ? 'Has bloqueado las notificaciones para esta aplicación. Actívalas en los ajustes del teléfono y vuelve a intentarlo.' : 'No se ha concedido el permiso.');
      const reg = await navigator.serviceWorker.ready;
      const previa = await reg.pushManager.getSubscription();
      const sub = previa ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64aBytes(clavePublica) });
      await accionGuardarSuscripcion(sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } });
      setMensaje({ ok: true, texto: 'Avisos activados en este dispositivo. Envía una prueba para comprobarlo.' });
    } catch (e) {
      setMensaje({ ok: false, texto: (e as Error).message });
    } finally { setOcupado(false); await comprobar(); }
  }

  async function desactivar() {
    setOcupado(true); setMensaje(null);
    try {
      const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
      if (sub) { await accionBorrarSuscripcion(sub.endpoint); await sub.unsubscribe(); }
      setMensaje({ ok: true, texto: 'Avisos desactivados en este dispositivo.' });
    } finally { setOcupado(false); await comprobar(); }
  }

  async function probar() {
    setOcupado(true); setMensaje(null);
    try {
      const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
      if (!sub) throw new Error('Este dispositivo no está suscrito.');
      const r = await accionProbarPush(sub.endpoint);
      setMensaje({ ok: r.ok, texto: r.mensaje });
    } catch (e) { setMensaje({ ok: false, texto: (e as Error).message }); } finally { setOcupado(false); await comprobar(); }
  }

  if (!d) return <p className="secundario">Comprobando este dispositivo…</p>;
  const iosSinInstalar = d.ios && !d.instalada;
  const listo = d.suscrita && d.registrada && d.permiso === 'granted';
  const si = (v: boolean, t = 'Sí', f = 'No') => (v ? t : f);

  return (
    <div className="dos-columnas">
      <section className="tarjeta tarjeta--pad" aria-labelledby="t-estado">
        <h2 id="t-estado" style={{ marginBottom: 'var(--e-3)' }}>{listo ? 'Avisos activos en este dispositivo' : 'Avisos no activos en este dispositivo'}</h2>
        {mensaje && <div className={`aviso aviso--${mensaje.ok ? 'ok' : 'error'}`} role="status" style={{ marginBottom: 'var(--e-4)' }}>{mensaje.texto}</div>}
        {!clavePublica && <div className="aviso aviso--atencion" style={{ marginBottom: 'var(--e-4)' }}>Las notificaciones push aún no están configuradas en el servidor. Los avisos siguen apareciendo en la aplicación y, si hay correo configurado, por correo.</div>}

        {iosSinInstalar ? (
          <div className="aviso aviso--info">
            <div>
              <strong>En iPhone hay que instalar la aplicación primero</strong>
              <ol className="pasos">
                <li>Abre esta página en <strong>Safari</strong>.</li>
                <li>Pulsa el botón <strong>Compartir</strong> (cuadrado con flecha).</li>
                <li>Elige <strong>Añadir a pantalla de inicio</strong> y confirma.</li>
                <li>Abre <strong>PRAETORIA</strong> desde el icono, entra y vuelve a esta pantalla para activar los avisos.</li>
              </ol>
              <p className="pequeno" style={{ marginTop: 'var(--e-2)' }}>Necesita iOS 16.4 o posterior{d.iosVersion ? ` (este dispositivo: iOS ${d.iosVersion.toFixed(1).replace('.', ',')})` : ''}.</p>
            </div>
          </div>
        ) : !d.soporte ? (
          <div className="aviso aviso--atencion">Este navegador no admite notificaciones push. Puedes recibir los avisos por correo (abajo) o usar Chrome en Android o la app instalada en iPhone.</div>
        ) : (
          <div className="acciones">
            {!listo && <button className="boton boton--principal" onClick={activar} disabled={ocupado || !clavePublica} type="button">Activar avisos</button>}
            {listo && <button className="boton boton--oscuro" onClick={probar} disabled={ocupado} type="button">Enviar notificación de prueba</button>}
            {d.suscrita && <button className="boton boton--sutil" onClick={desactivar} disabled={ocupado} type="button">Desactivar en este dispositivo</button>}
          </div>
        )}
        {d.permiso === 'denied' && <p className="pequeno" style={{ marginTop: 'var(--e-3)', color: 'var(--color-peligro-texto)' }}>Las notificaciones están bloqueadas. {d.ios ? 'Ajustes › Notificaciones › PRAETORIA' : 'Configuración del sitio en el navegador › Notificaciones'} › Permitir.</p>}
        {d.android && !d.instalada && d.soporte && <p className="pequeno secundario" style={{ marginTop: 'var(--e-3)' }}>Consejo: en Chrome, menú ⋮ › «Instalar aplicación» para abrirla como una app.</p>}
      </section>
      <aside className="tarjeta tarjeta--pad" aria-labelledby="t-diag">
        <h2 id="t-diag" style={{ marginBottom: 'var(--e-3)' }}>Diagnóstico</h2>
        <dl className="diagnostico">
          <div><dt>Abierta como aplicación instalada</dt><dd>{si(d.instalada)}</dd></div>
          <div><dt>Navegador compatible con push</dt><dd>{si(d.soporte)}</dd></div>
          <div><dt>Permiso de notificaciones</dt><dd>{{ granted: 'Concedido', denied: 'Bloqueado', default: 'Sin pedir', 'no-disponible': 'No disponible' }[d.permiso]}</dd></div>
          <div><dt>Suscripción en el dispositivo</dt><dd>{si(d.suscrita)}</dd></div>
          <div><dt>Registrada en el servidor</dt><dd>{si(d.registrada)}</dd></div>
          <div><dt>Servidor de push configurado</dt><dd>{si(!!clavePublica)}</dd></div>
          <div><dt>Último envío correcto</dt><dd>{d.ultimoExito ? new Date(d.ultimoExito).toLocaleString('es-ES') : '—'}</dd></div>
          {d.ultimoError && <div><dt>Último error</dt><dd style={{ color: 'var(--color-peligro-texto)' }}>{d.ultimoError}</dd></div>}
        </dl>
      </aside>
    </div>
  );
}
