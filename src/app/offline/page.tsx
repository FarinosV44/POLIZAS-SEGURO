import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sin conexión' };

// Página estática que el service worker muestra si no hay red. No contiene datos.
export default function SinConexion() {
  return (
    <main className="acceso">
      <div className="acceso__caja" style={{ textAlign: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/marca/logo.svg" alt="PRAETORIA gestor de seguros" className="acceso__logo" width={260} height={64} />
        <div className="tarjeta tarjeta--pad">
          <h1 style={{ marginBottom: 'var(--e-3)' }}>Sin conexión</h1>
          <p className="secundario">Las pólizas y los documentos no se guardan en el teléfono por seguridad. Vuelve a intentarlo cuando tengas conexión.</p>
          {/* Recarga completa a propósito: sin red no hay navegación del lado del cliente. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className="boton boton--oscuro" href="/" style={{ marginTop: 'var(--e-5)' }}>Reintentar</a>
        </div>
      </div>
    </main>
  );
}
