import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { exigirAdmin } from '@/lib/auth/servidor';
import { listarUsuarios } from '@/lib/datos/usuarios';
import { listarTitulares } from '@/lib/datos/titulares';
import { Enviar, Formulario } from '@/components/formulario';
import { accionAccesos, accionActivar } from '../../acciones';

export const metadata: Metadata = { title: 'Permisos' };

export default async function Permisos({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await exigirAdmin();
  const x = (await listarUsuarios(admin)).find((v) => v.id === id);
  if (!x || x.id === admin.id) notFound();
  const titulares = await listarTitulares(admin);
  return (
    <>
      <div className="migas"><Link href="/ajustes">Ajustes</Link><span aria-hidden="true">/</span><span>{x.nombre}</span></div>
      <div className="encabezado"><div><h1>{x.nombre}</h1><p className="secundario pequeno">{x.email}</p></div></div>
      <div className="dos-columnas">
        <div className="tarjeta tarjeta--pad">
          <h2 style={{ marginBottom: 'var(--e-4)' }}>Titulares a los que tiene acceso</h2>
          {x.rol === 'admin' ? <p className="secundario">Es administrador: ve todos los titulares.</p> : (
            <Formulario accion={accionAccesos.bind(null, id)} aria="Permisos por titular">
              <fieldset>
                <legend className="sr">Titulares</legend>
                {titulares.map((t) => (
                  <label key={t.id} className="casilla">
                    <input type="checkbox" name="titular" value={t.id} defaultChecked={x.titulares.includes(t.id)} />
                    <span>{t.nombre} <span className="secundario">· {t.tipo === 'empresa' ? 'Empresa' : 'Particular'}</span></span>
                  </label>
                ))}
              </fieldset>
              <div><Enviar>Guardar permisos</Enviar></div>
              <p className="secundario pequeno">Los permisos se comprueban en el servidor en cada consulta, descarga y exportación.</p>
            </Formulario>
          )}
        </div>
        <div className="tarjeta tarjeta--pad">
          <h2 style={{ marginBottom: 'var(--e-3)' }}>{x.activo ? 'Desactivar cuenta' : 'Cuenta desactivada'}</h2>
          <p className="secundario pequeno" style={{ marginBottom: 'var(--e-4)' }}>{x.activo ? 'Cierra sus sesiones al momento y le impide entrar. Se puede reactivar.' : 'No puede entrar.'}</p>
          <form action={accionActivar.bind(null, id, !x.activo)}>
            <button className={`boton ${x.activo ? 'boton--peligro' : ''}`} type="submit">{x.activo ? 'Desactivar' : 'Reactivar'}</button>
          </form>
        </div>
      </div>
    </>
  );
}
