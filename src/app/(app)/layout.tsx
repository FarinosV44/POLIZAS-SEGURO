import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Navegacion } from '@/components/navegacion';
import { exigirUsuario } from '@/lib/auth/servidor';
import { accionSalir } from '@/app/sesion-acciones';
import { IconoSalir } from '@/components/iconos';

// Todas las páginas privadas exigen sesión y se generan en cada petición (nunca se cachean).
export const dynamic = 'force-dynamic';

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const u = await exigirUsuario();
  return (
    <>
      <a className="saltar" href="#contenido">Saltar al contenido</a>
      <header className="cabecera">
        <div className="cabecera__in">
          <Link href="/" className="cabecera__marca" aria-label="PRAETORIA gestor de seguros — inicio"><Logo alto={34} /></Link>
          <Navegacion />
          <div className="cabecera__usuario">
            <span className="nombre-usuario">{u.nombre}</span>
            <form action={accionSalir}>
              <button className="boton boton--sutil boton--peq" type="submit"><IconoSalir /> Salir</button>
            </form>
          </div>
        </div>
      </header>
      <main id="contenido" className="principal">{children}</main>
      <Navegacion movil />
    </>
  );
}
