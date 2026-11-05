import type { Metadata } from 'next';
import Link from 'next/link';
import { exigirUsuario } from '@/lib/auth/servidor';
import { listarTitulares } from '@/lib/datos/titulares';
import { listarRamos } from '@/lib/datos/polizas';
import { Enviar, Formulario } from '@/components/formulario';
import { CamposAnualidad, CamposPoliza } from '../campos';
import { accionCrearPoliza } from '../acciones';

export const metadata: Metadata = { title: 'Añadir póliza' };

export default async function NuevaPoliza({ searchParams }: { searchParams: Promise<{ titular?: string }> }) {
  const u = await exigirUsuario();
  const { titular } = await searchParams;
  const [titulares, ramos] = await Promise.all([listarTitulares(u), listarRamos()]);
  return (
    <>
      <div className="migas"><Link href="/">Pólizas</Link><span aria-hidden="true">/</span><span>Nueva</span></div>
      <div className="encabezado"><h1>Añadir póliza</h1></div>
      <div className="tarjeta tarjeta--pad">
        <Formulario accion={accionCrearPoliza} aria="Añadir póliza">
          <CamposPoliza titulares={titulares} ramos={ramos} titularInicial={titular} />
          <CamposAnualidad />
          <div className="pie-form">
            <Link className="boton" href="/">Cancelar</Link>
            <Enviar>Guardar póliza</Enviar>
          </div>
        </Formulario>
      </div>
      <p className="secundario pequeno" style={{ marginTop: 'var(--e-4)' }}>Después de guardarla podrás adjuntar la póliza, las condiciones generales, los suplementos y los recibos.</p>
    </>
  );
}
