import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'PRAETORIA gestor de seguros', template: '%s · PRAETORIA gestor de seguros' },
  description: 'Gestión privada de pólizas, vencimientos y siniestros.',
  applicationName: 'PRAETORIA gestor de seguros',
  robots: { index: false, follow: false },
  icons: {
    icon: [{ url: '/favicon.ico', sizes: '48x48' }, { url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: { capable: true, title: 'PRAETORIA', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#F9F9F9',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
