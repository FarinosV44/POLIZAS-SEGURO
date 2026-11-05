import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { exigirUsuario } from '@/lib/auth/servidor';
import { listarTitulares } from '@/lib/datos/titulares';
import { listarRamos, obtenerPoliza } from '@/lib/datos/polizas';
import { NoEncontrado } from '@/lib/errores';
import { Enviar, Formulario } from '@/components/formulario';
import { CamposPoliza } from '../../campos';
import { accionArchivarPoliza, accionEditarPoliza } from '../../acciones';

export const metadata: Metadata = { title: 'Editar póliza' };

export default async function EditarPoliza({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await exigirUsuario();
  const p = await obtenerPoliza(u, id).catch((e) => { if (e instanceof NoEncontrado) notFound(); throw e; });
  const [titulares, ramos] = await Promise.all([listarTitulares(u), listarRamos()]);
  return (
    <>
      <div className="migas"><Link href="/">Pólizas</Link><span aria-hidden="true">/</span><Link href={`/polizas/${id}`}>{p.nombre}</Link><span aria-hidden="true">/</span><span>Editar</span></div>
      <div className="encabezado"><h1>Editar póliza</h1></div>
      <div className="tarjeta tarjeta--pad">
        <Formulario accion={accionEditarPoliza.bind(null, id)} aria="Editar póliza">
          <CamposPoliza titulares={titulares} ramos={ramos} p={p} conEstado />
          <p className="secundario pequeno">Los importes y las fechas se editan en cada anualidad, para conservar el histórico.</p>
          <div className="pie-form">
            <Link className="boton" href={`/polizas/${id}`}>Cancelar</Link>
            <Enviar>Guardar cambios</Enviar>
          </div>
        </Formulario>
      </div>
      <div className="tarjeta tarjeta--pad" style={{ marginTop: 'var(--e-5)' }}>
        <h2>{p.archivada_en ? 'Póliza archivada' : 'Archivar póliza'}</h2>
        <p className="secundario pequeno" style={{ margin: 'var(--e-2) 0 var(--e-4)' }}>
          {p.archivada_en
            ? 'No aparece en el panel ni cuenta en los totales. Su histórico y documentos se conservan.'
            : 'Deja de aparecer en el panel y en los totales, pero se conservan su histórico y sus documentos. Puedes recuperarla cuando quieras.'}
        </p>
        <form action={accionArchivarPoliza.bind(null, id, !p.archivada_en)}>
          <button className={`boton ${p.archivada_en ? '' : 'boton--peligro'}`} type="submit">{p.archivada_en ? 'Recuperar póliza' : 'Archivar póliza'}</button>
        </form>
      </div>
    </>
  );
}
