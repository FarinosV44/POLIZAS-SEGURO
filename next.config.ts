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
      `connect-src 'self'${process.env.STORAGE_DRIVER === 'supabase' && process.env.SUPABASE_URL ? ` ${process.env.SUPABASE_URL}` : ''}`, // subida directa al almacén privado
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
  // En un servidor propio (Docker) se genera la versión autónoma; Vercel usa su propio empaquetado.
  output: process.env.VERCEL ? undefined : 'standalone',
  // pdfjs carga su «worker» de forma dinámica: se incluye para que funcione en funciones sin servidor.
  outputFileTracingIncludes: { '/**': ['./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'] },
  serverExternalPackages: ['pg', 'pdfjs-dist'],
  experimental: {
    serverActions: { bodySizeLimit: `${Number(process.env.MAX_UPLOAD_MB ?? 25) + 1}mb` },
  },
  async headers() {
    return [
      // Los documentos llevan sus propias cabeceras (src/app/api/documentos): se pueden previsualizar
      // dentro de la ficha (mismo origen) pero nunca desde otro sitio.
      { source: '/((?!api/documentos/|api/siniestros/archivos/).*)', headers: cabeceras },
      // El service worker siempre se revisa en el servidor para que las actualizaciones lleguen enseguida.
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }, { key: 'Content-Type', value: 'application/javascript; charset=utf-8' }] },
    ];
  },
};

export default config;
