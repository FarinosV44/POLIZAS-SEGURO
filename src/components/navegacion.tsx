'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconoAjustes, IconoAvisos, IconoPolizas, IconoTitulares } from './iconos';

const ENLACES = [
  { href: '/', texto: 'Pólizas', icono: IconoPolizas, activo: (p: string) => p === '/' || p.startsWith('/polizas') },
  { href: '/avisos', texto: 'Avisos', icono: IconoAvisos, activo: (p: string) => p.startsWith('/avisos') },
  { href: '/titulares', texto: 'Titulares', icono: IconoTitulares, activo: (p: string) => p.startsWith('/titulares') },
  { href: '/ajustes', texto: 'Ajustes', icono: IconoAjustes, activo: (p: string) => p.startsWith('/ajustes') },
];

export function Navegacion({ movil = false, avisos = 0 }: { movil?: boolean; avisos?: number }) {
  const ruta = usePathname();
  return (
    <nav className={movil ? 'barra-movil' : 'nav'} aria-label={movil ? 'Navegación principal (móvil)' : 'Navegación principal'} style={movil ? ({ '--n': ENLACES.length } as React.CSSProperties) : undefined}>
      {ENLACES.map(({ href, texto, icono: I, activo }) => (
        <Link key={href} href={href} aria-current={activo(ruta) ? 'page' : undefined}>
          {movil && <I />}
          <span>
            {texto}
            {href === '/avisos' && avisos > 0 && <span className="insignia" aria-label={`${avisos} sin atender`}>{avisos}</span>}
          </span>
        </Link>
      ))}
    </nav>
  );
}
