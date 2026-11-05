import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'PRAETORIA gestor de seguros',
    short_name: 'PRAETORIA',
    description: 'Gestión privada de pólizas, vencimientos y siniestros.',
    lang: 'es',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F9F9F9',
    theme_color: '#F9F9F9',
    icons: [
      { src: '/iconos/icono-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/iconos/icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/iconos/icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/marca/icono.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}
