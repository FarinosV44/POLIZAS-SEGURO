import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Navegacion } from '@/components/navegacion';
import { exigirUsuario } from '@/lib/auth/servidor';
import { accionSalir } from '@/app/sesion-acciones';
import { BotonSalir } from '@/components/boton-salir';
import { RegistroSW } from '@/components/registro-sw';
import { contarPendientes } from '@/lib/datos/avisos';

// Todas las páginas privadas exigen sesión y se generan en cada petición (nunca se cachean).
export const dynamic = 'force-dynamic';

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const u = await exigirUsuario();
  const pendientes = await contarPendientes(u);
  return (
    <>
      <a className="saltar" href="#contenido">Saltar al contenido</a>
      <header className="cabecera">
        <div className="cabecera__in">
          <Link href="/" className="cabecera__marca" aria-label="PRAETORIA gestor de seguros — inicio"><Logo alto={34} /></Link>
          <Navegacion avisos={pendientes} />
          <div className="cabecera__usuario">
            <span className="nombre-usuario">{u.nombre}</span>
            <BotonSalir accion={accionSalir} />
          </div>
        </div>
      </header>
      <main id="contenido" className="principal">{children}</main>
      <Navegacion movil avisos={pendientes} />
      <RegistroSW />
    </>
  );
}
