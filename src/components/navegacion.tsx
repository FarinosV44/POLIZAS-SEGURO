'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconoAjustes, IconoPolizas, IconoTitulares } from './iconos';

const ENLACES = [
  { href: '/', texto: 'Pólizas', icono: IconoPolizas, activo: (p: string) => p === '/' || p.startsWith('/polizas') },
  { href: '/titulares', texto: 'Titulares', icono: IconoTitulares, activo: (p: string) => p.startsWith('/titulares') },
  { href: '/ajustes', texto: 'Ajustes', icono: IconoAjustes, activo: (p: string) => p.startsWith('/ajustes') },
];

export function Navegacion({ movil = false }: { movil?: boolean }) {
  const ruta = usePathname();
  return (
    <nav className={movil ? 'barra-movil' : 'nav'} aria-label={movil ? 'Navegación principal (móvil)' : 'Navegación principal'} style={movil ? ({ '--n': ENLACES.length } as React.CSSProperties) : undefined}>
      {ENLACES.map(({ href, texto, icono: I, activo }) => (
        <Link key={href} href={href} aria-current={activo(ruta) ? 'page' : undefined}>
          {movil && <I />}
          {texto}
        </Link>
      ))}
    </nav>
  );
}
