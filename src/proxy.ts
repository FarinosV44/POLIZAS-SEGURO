import { NextResponse, type NextRequest } from 'next/server';

// Primer filtro barato: sin cookie de sesión se envía al acceso conservando el destino
// (útil al abrir un aviso push). La validación real de la sesión se hace en el servidor en cada página y API.
const PUBLICAS = ['/acceso', '/recuperar', '/restablecer', '/manifest.webmanifest', '/sw.js', '/offline'];

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (PUBLICAS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) || pathname.startsWith('/api/')) return NextResponse.next();
  const tiene = req.cookies.has('__Host-praetoria') || req.cookies.has('praetoria_sesion');
  if (!tiene) {
    const url = req.nextUrl.clone();
    url.pathname = '/acceso';
    url.search = pathname === '/' ? '' : `?destino=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/|favicon|apple-touch-icon|iconos/|marca/|.*\\.(?:png|svg|ico|webmanifest)$).*)'],
};
