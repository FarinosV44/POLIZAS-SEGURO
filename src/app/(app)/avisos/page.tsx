import type { Metadata } from 'next';
import Link from 'next/link';
import { exigirUsuario } from '@/lib/auth/servidor';
import { listarAvisos } from '@/lib/datos/avisos';
import { ItemAviso } from './componentes';

export const metadata: Metadata = { title: 'Avisos' };

export default async function Avisos({ searchParams }: { searchParams: Promise<{ historial?: string }> }) {
  const u = await exigirUsuario();
  const historial = !!(await searchParams).historial;
  const avisos = await listarAvisos(u, { historial });
  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Avisos</h1>
          <p className="secundario pequeno">Un mes natural antes de cada vencimiento y antes de la fecha límite de oposición confirmada.</p>
        </div>
        <Link className="boton" href="/avisos/dispositivo">Avisos en este móvil</Link>
      </div>
      <nav className="segmentos" aria-label="Vista" style={{ marginBottom: 'var(--e-4)' }}>
        <Link href="/avisos" aria-current={!historial ? 'true' : undefined}>Pendientes</Link>
        <Link href="/avisos?historial=1" aria-current={historial ? 'true' : undefined}>Historial</Link>
      </nav>
      <div className="tarjeta">
        {avisos.length === 0
          ? <div className="vacio"><h2>{historial ? 'Sin historial' : 'Nada pendiente'}</h2><p>{historial ? 'Aquí aparecerán los avisos ya atendidos.' : 'Cuando una póliza entre en su mes de renovación aparecerá aquí y te llegará una notificación.'}</p></div>
          : <ul className="lista-simple" style={{ display: 'block' }}>{avisos.map((a) => <ItemAviso key={a.id} a={a} />)}</ul>}
      </div>
    </>
  );
}
