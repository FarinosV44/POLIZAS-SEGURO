import type { Metadata } from 'next';
import Link from 'next/link';
import { exigirUsuario } from '@/lib/auth/servidor';
import { listarUsuarios } from '@/lib/datos/usuarios';
import { Campo, Enviar, Formulario, Selector } from '@/components/formulario';
import { fechaMedia, hoyMadrid } from '@/lib/fechas';
import { accionCambiarClave, accionCrearUsuario } from './acciones';

export const metadata: Metadata = { title: 'Ajustes' };

export default async function Ajustes() {
  const u = await exigirUsuario();
  const usuarios = u.rol === 'admin' ? await listarUsuarios(u) : [];
  return (
    <>
      <div className="encabezado"><div><h1>Ajustes</h1><p className="secundario pequeno">{u.nombre} · {u.email} · {u.rol === 'admin' ? 'Administrador' : 'Colaborador'}</p></div></div>

      {u.rol === 'admin' && (
        <section className="bloque" aria-labelledby="t-usuarios">
          <div className="bloque__titulo">
            <h2 id="t-usuarios">Usuarios y permisos</h2>
            <div className="acciones">
              <Link className="boton boton--peq" href="/ajustes/estado">Estado y avisos</Link>
              <Link className="boton boton--peq" href="/ajustes/tipos">Tipos de seguro</Link>
            </div>
          </div>
          <div className="dos-columnas">
            <div className="tarjeta">
              <ul className="lista-simple">
                {usuarios.map((x) => (
                  <li key={x.id}>
                    <div>
                      <p style={{ fontWeight: 700 }}>{x.nombre}{!x.activo && <span className="estado estado--neutro" style={{ marginLeft: 8 }}>Desactivado</span>}</p>
                      <p className="linea-2">{x.email} · {x.rol === 'admin' ? 'Administrador: ve todos los titulares' : `Colaborador: ${x.titulares.length} ${x.titulares.length === 1 ? 'titular' : 'titulares'}`}{x.ultimo_acceso ? ` · último acceso ${fechaMedia(hoyMadrid(new Date(x.ultimo_acceso)))}` : ''}</p>
                    </div>
                    {x.id !== u.id && <Link className="boton boton--peq" href={`/ajustes/usuarios/${x.id}`}>Permisos</Link>}
                  </li>
                ))}
              </ul>
            </div>
            <div className="tarjeta tarjeta--pad">
              <h3 style={{ marginBottom: 'var(--e-4)' }}>Nueva cuenta</h3>
              <Formulario accion={accionCrearUsuario} aria="Nueva cuenta">
                <Campo nombre="nombre" etiqueta="Nombre" requerido autoComplete="off" />
                <Campo nombre="email" etiqueta="Correo" tipo="email" requerido autoComplete="off" />
                <Selector nombre="rol" etiqueta="Rol" defecto="colaborador" opciones={[{ valor: 'colaborador', texto: 'Colaborador (titulares concretos)' }, { valor: 'admin', texto: 'Administrador (todo)' }]} />
                <Campo nombre="nueva_clave" etiqueta="Contraseña inicial" tipo="password" autoComplete="new-password" ayuda="Al menos 12 caracteres." requerido />
                <Enviar>Crear cuenta</Enviar>
              </Formulario>
            </div>
          </div>
        </section>
      )}

      <section className="bloque" aria-labelledby="t-movil">
        <div className="bloque__titulo"><h2 id="t-movil">Avisos</h2></div>
        <div className="tarjeta tarjeta--pad" style={{ maxWidth: 560 }}>
          <p className="secundario pequeno" style={{ marginBottom: 'var(--e-3)' }}>Instala la aplicación en el teléfono, activa las notificaciones y elige si quieres correo de respaldo.</p>
          <Link className="boton" href="/avisos/dispositivo">Avisos en este móvil</Link>
        </div>
      </section>

      <section className="bloque" aria-labelledby="t-clave">
        <div className="bloque__titulo"><h2 id="t-clave">Cambiar contraseña</h2></div>
        <div className="tarjeta tarjeta--pad" style={{ maxWidth: 560 }}>
          <Formulario accion={accionCambiarClave} aria="Cambiar contraseña">
            <Campo nombre="actual_clave" etiqueta="Contraseña actual" tipo="password" autoComplete="current-password" requerido />
            <Campo nombre="nueva_clave" etiqueta="Nueva contraseña" tipo="password" autoComplete="new-password" ayuda="Al menos 12 caracteres. Se cerrarán todas tus sesiones." requerido />
            <Campo nombre="nueva_clave2" etiqueta="Repite la nueva contraseña" tipo="password" autoComplete="new-password" requerido />
            <div><Enviar>Cambiar contraseña</Enviar></div>
          </Formulario>
        </div>
      </section>
    </>
  );
}
