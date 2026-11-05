import proporcion from './marca-proporcion.json';

/** Logotipo horizontal (public/marca/logo.svg, generado por `npm run marca`). */
export function Logo({ alto = 34, tono = 'claro', className }: { alto?: number; tono?: 'claro' | 'oscuro'; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG estático
    <img
      src={tono === 'oscuro' ? '/marca/logo-oscuro.svg' : '/marca/logo.svg'}
      alt="PRAETORIA gestor de seguros"
      width={Math.round(alto * proporcion.logo)}
      height={alto}
      className={className}
    />
  );
}
