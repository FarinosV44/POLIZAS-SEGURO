import type { Metadata } from 'next';
import Link from 'next/link';
import { exigirAdmin } from '@/lib/auth/servidor';
import { Enviar, Formulario } from '@/components/formulario';
import { CamposTitular } from '../campos';
import { accionCrearTitular } from '../acciones';

export const metadata: Metadata = { title: 'Nuevo titular' };

export default async function NuevoTitular() {
  await exigirAdmin();
  return (
    <>
      <div className="migas"><Link href="/titulares">Titulares</Link><span aria-hidden="true">/</span><span>Nuevo</span></div>
      <div className="encabezado"><h1>Nuevo titular</h1></div>
      <div className="tarjeta tarjeta--pad" style={{ maxWidth: 760 }}>
        <Formulario accion={accionCrearTitular} aria="Nuevo titular">
          <CamposTitular />
          <div className="pie-form">
            <Link className="boton" href="/titulares">Cancelar</Link>
            <button className="boton" type="submit" name="despues" value="lista">Guardar</button>
            <Enviar nombre="despues" valor="poliza">Guardar y añadir póliza</Enviar>
          </div>
        </Formulario>
      </div>
    </>
  );
}
