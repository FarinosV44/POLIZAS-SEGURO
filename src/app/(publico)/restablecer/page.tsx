import type { Metadata } from 'next';
import { Campo, Enviar, Formulario } from '@/components/formulario';
import { accionRestablecer } from '@/app/sesion-acciones';

export const metadata: Metadata = { title: 'Nueva contraseña' };

export default async function Restablecer({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  return (
    <div className="tarjeta">
      <h1>Nueva contraseña</h1>
      <Formulario accion={accionRestablecer} aria="Nueva contraseña">
        <input type="hidden" name="t" value={t ?? ''} />
        <Campo nombre="clave" etiqueta="Nueva contraseña" tipo="password" autoComplete="new-password" ayuda="Al menos 12 caracteres." requerido />
        <Campo nombre="clave2" etiqueta="Repite la contraseña" tipo="password" autoComplete="new-password" requerido />
        <Enviar>Guardar contraseña</Enviar>
      </Formulario>
    </div>
  );
}
