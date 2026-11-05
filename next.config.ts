import type { NextConfig } from 'next';

// Aplicación privada: ninguna página se indexa ni se puede incrustar en otro sitio.
const cabeceras = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'same-origin' }, // no-referrer haría que el navegador envíe «Origin: null» en los formularios
  { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), interest-cohort=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js necesita scripts en línea para la hidratación.
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-src 'self'",
      "worker-src 'self'",
      "manifest-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

const config: NextConfig = {
  poweredByHeader: false,
  output: 'standalone',
  serverExternalPackages: ['pg'],
  experimental: {
    serverActions: { bodySizeLimit: `${Number(process.env.MAX_UPLOAD_MB ?? 25) + 1}mb` },
  },
  async headers() {
    return [
      // Los documentos llevan sus propias cabeceras (src/app/api/documentos): se pueden previsualizar
      // dentro de la ficha (mismo origen) pero nunca desde otro sitio.
      { source: '/((?!api/documentos/).*)', headers: cabeceras },
    ];
  },
};

export default config;
