import { Logo } from '@/components/logo';

export default function LayoutPublico({ children }: { children: React.ReactNode }) {
  return (
    <main className="acceso">
      <div className="acceso__caja">
        <Logo alto={64} className="acceso__logo" />
        {children}
        <p className="acceso__pie">Acceso privado. Si necesitas una cuenta, pídesela al administrador.</p>
      </div>
    </main>
  );
}
