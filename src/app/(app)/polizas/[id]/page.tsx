import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { exigirUsuario } from '@/lib/auth/servidor';
import { listarAnualidades, obtenerPoliza, ESTADOS_POLIZA, type Anualidad } from '@/lib/datos/polizas';
import { listarDocumentos, maxBytes, TIPOS_DOCUMENTO, type Documento } from '@/lib/datos/documentos';
import { situacion } from '@/lib/datos/panel';
import { NoEncontrado } from '@/lib/errores';
import { costeAnual, deCentimos, formatoImporte, textoPeriodicidad } from '@/lib/dinero';
import { fechaLarga, fechaMedia, hoyMadrid, textoDias } from '@/lib/fechas';
import { Estado, Revisar } from '@/components/estado';
import { IconoDocumento, IconoRamo, IconoTelefono } from '@/components/iconos';
import { CampoArchivo, Enviar, Formulario, Selector } from '@/components/formulario';
import { accionEliminarDocumento, accionSubirDocumento } from '../acciones';

export const metadata: Metadata = { title: 'Póliza' };

const PESTANAS = [
  { clave: 'resumen', texto: 'Resumen' },
  { clave: 'anualidades', texto: 'Anualidades e historial' },
  { clave: 'documentos', texto: 'Documentos' },
] as const;

export default async function Ficha({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ pestana?: string; volver?: string; creada?: string }> }) {
  const { id } = await params;
  const { pestana = 'resumen', volver, creada } = await searchParams;
  const u = await exigirUsuario();
  const p = await obtenerPoliza(u, id).catch((e) => { if (e instanceof NoEncontrado) notFound(); throw e; });
  const [anualidades, documentos] = await Promise.all([listarAnualidades(u, id), listarDocumentos(u, id)]);
  const hoy = hoyMadrid();
  // Anualidad actual: la vigente hoy; si no hay, la más reciente.
  const actual = anualidades.find((a) => a.inicio && a.inicio <= hoy && (!a.fin || a.fin > hoy)) ?? anualidades[0];
  const { situacion: sit, dias } = situacion({ estado: p.estado, fin: actual?.fin ?? null }, hoy);
  const coste = actual ? costeAnual(actual) : null;
  const volverA = volver && volver.startsWith('/') && !volver.startsWith('//') ? volver : '/';
  const q = (k: string) => `/polizas/${id}?pestana=${k}${volver ? `&volver=${encodeURIComponent(volverA)}` : ''}`;

  return (
    <>
      <div className="migas"><Link href={volverA}>← Pólizas</Link></div>
      {creada && <div className="aviso aviso--ok" role="status" style={{ marginBottom: 'var(--e-4)' }}>Póliza guardada. Ahora puedes adjuntar sus documentos.</div>}
      {p.archivada_en && <div className="aviso aviso--info" style={{ marginBottom: 'var(--e-4)' }}>Póliza archivada: no aparece en el panel ni en los totales.</div>}

      <div className="ficha-cab">
        <div className="titular-ramo" style={{ alignItems: 'flex-start' }}>
          <IconoRamo icono={p.ramo_icono} etiqueta={p.ramo_nombre} />
          <div>
            <span className="tpoliza__titular">{p.titular_nombre} · {p.titular_tipo === 'empresa' ? 'Empresa' : 'Particular'}</span>
            <h1>{p.nombre}</h1>
            <p className="secundario">{p.ramo_nombre} · {p.aseguradora}{p.numero ? ` · Nº ${p.numero}` : ''}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'var(--e-2)' }}>
              <Estado situacion={sit} />
              {actual && !actual.datos_confirmados && <Revisar />}
            </div>
          </div>
        </div>
        <div className="acciones">
          <Link className="boton" href={`/polizas/${id}/editar`}>Editar</Link>
          <Link className="boton boton--oscuro" href={`/polizas/${id}/anualidades/nueva`}>Registrar renovación</Link>
        </div>
      </div>

      <dl className="tarjeta datos-clave">
        <div>
          <dt>Prima anual</dt>
          <dd>
            {coste ? formatoImporte(deCentimos(coste.centimos), p.moneda) : <span className="pendiente">Pendiente</span>}
            {coste?.tipo === 'estimado' && <small>estimada a partir del recibo</small>}
          </dd>
        </div>
        <div>
          <dt>Recibo</dt>
          <dd>
            {actual?.importe_recibo ? formatoImporte(actual.importe_recibo, p.moneda) : <span className="pendiente">Pendiente</span>}
            <small>{textoPeriodicidad(actual?.periodicidad) || 'Forma de pago pendiente'}</small>
          </dd>
        </div>
        <div>
          <dt>Vencimiento</dt>
          <dd>
            {actual?.fin ? fechaMedia(actual.fin) : <span className="pendiente">Pendiente</span>}
            {dias !== null && <small>{textoDias(dias)}</small>}
          </dd>
        </div>
        <div>
          <dt>Límite para oponerse a la prórroga</dt>
          <dd>
            {actual?.plazo_oposicion ? fechaMedia(actual.plazo_oposicion) : <span className="pendiente">No registrado</span>}
            {actual?.plazo_oposicion && <small>{actual.plazo_oposicion_confirmado ? `Comprobado · ${actual.plazo_oposicion_fuente}` : 'Sin comprobar en el contrato'}</small>}
          </dd>
        </div>
      </dl>

      <nav className="pestanas" aria-label="Secciones de la póliza">
        {PESTANAS.map((t) => (
          <Link key={t.clave} href={q(t.clave)} aria-current={pestana === t.clave ? 'page' : undefined} scroll={false}>
            {t.texto}{t.clave === 'documentos' ? ` (${documentos.length})` : t.clave === 'anualidades' ? ` (${anualidades.length})` : ''}
          </Link>
        ))}
      </nav>

      {pestana === 'anualidades' ? <Anualidades id={id} anualidades={anualidades} actualId={actual?.id} moneda={p.moneda} documentos={documentos} />
        : pestana === 'documentos' ? <Documentos id={id} documentos={documentos} anualidades={anualidades} />
        : (
          <div className="dos-columnas">
            <section className="tarjeta tarjeta--pad" aria-labelledby="t-datos">
              <h2 id="t-datos" style={{ marginBottom: 'var(--e-4)' }}>Datos de la póliza</h2>
              <dl className="lista-datos">
                <dt>Titular</dt><dd>{p.titular_nombre}</dd>
                <dt>Tipo de seguro</dt><dd>{p.ramo_nombre}</dd>
                <dt>Objeto asegurado</dt><dd>{p.riesgo ?? <span className="pendiente">Sin indicar</span>}</dd>
                <dt>Aseguradora</dt><dd>{p.aseguradora}</dd>
                <dt>Número de póliza</dt><dd>{p.numero ?? <span className="pendiente">Pendiente</span>}</dd>
                <dt>Tomador</dt><dd>{p.tomador ?? <span className="pendiente">Sin indicar</span>}</dd>
                <dt>Asegurado</dt><dd>{p.asegurado ?? <span className="pendiente">Sin indicar</span>}</dd>
                {p.beneficiario && <><dt>Beneficiario</dt><dd>{p.beneficiario}</dd></>}
                <dt>Vigencia actual</dt><dd>{actual?.inicio || actual?.fin ? `${fechaLarga(actual?.inicio) || 'inicio pendiente'} – ${fechaLarga(actual?.fin) || 'vencimiento pendiente'}` : <span className="pendiente">Pendiente</span>}</dd>
                <dt>Renovación automática</dt><dd>{p.renovacion_automatica === null ? <span className="pendiente">No consta</span> : p.renovacion_automatica ? 'Sí' : 'No'}</dd>
                <dt>Estado</dt><dd>{ESTADOS_POLIZA[p.estado]}</dd>
                {p.moneda !== 'EUR' && <><dt>Moneda</dt><dd>{p.moneda}</dd></>}
                {p.notas && <><dt>Notas</dt><dd style={{ whiteSpace: 'pre-wrap' }}>{p.notas}</dd></>}
              </dl>
            </section>
            <aside className="tarjeta tarjeta--pad contactos" aria-labelledby="t-contactos">
              <h2 id="t-contactos" style={{ marginBottom: 'var(--e-4)' }}>Contactos</h2>
              {!p.mediador && !p.mediador_telefono && !p.asistencia_telefono && !p.mediador_email
                ? <p className="secundario pequeno">Sin contactos. Añádelos en <Link href={`/polizas/${id}/editar`}>Editar</Link>.</p>
                : (
                  <div style={{ display: 'grid', gap: 'var(--e-4)' }}>
                    {(p.mediador || p.mediador_telefono || p.mediador_email) && (
                      <div>
                        <p className="secundario pequeno">Mediador</p>
                        {p.mediador && <p style={{ fontWeight: 700 }}>{p.mediador}</p>}
                        {p.mediador_telefono && <a className="boton boton--peq" style={{ marginTop: 6 }} href={`tel:${p.mediador_telefono.replace(/[^\d+]/g, '')}`}><IconoTelefono /> {p.mediador_telefono}</a>}
                        {p.mediador_email && <p style={{ marginTop: 6 }}><a href={`mailto:${p.mediador_email}`}>{p.mediador_email}</a></p>}
                      </div>
                    )}
                    {p.asistencia_telefono && (
                      <div>
                        <p className="secundario pequeno">Asistencia y siniestros</p>
                        <a className="boton boton--peq" style={{ marginTop: 6 }} href={`tel:${p.asistencia_telefono.replace(/[^\d+]/g, '')}`}><IconoTelefono /> {p.asistencia_telefono}</a>
                      </div>
                    )}
                  </div>
                )}
            </aside>
          </div>
        )}
    </>
  );
}

function Anualidades({ id, anualidades, actualId, moneda, documentos }: { id: string; anualidades: Anualidad[]; actualId?: string; moneda: string; documentos: Documento[] }) {
  return (
    <section className="tarjeta" aria-label="Anualidades">
      <ul className="lista-simple">
        {anualidades.map((a, i) => {
          const c = costeAnual(a);
          const anterior = anualidades[i + 1];
          const cAnt = anterior ? costeAnual(anterior) : null;
          const variacion = c && cAnt && cAnt.centimos > 0 ? ((c.centimos - cAnt.centimos) / cAnt.centimos) * 100 : null;
          const docs = documentos.filter((d) => d.anualidad_id === a.id).length;
          return (
            <li key={a.id}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 700 }}>
                  {a.inicio || a.fin ? `${fechaMedia(a.inicio) || 'Inicio pendiente'} – ${fechaMedia(a.fin) || 'vencimiento pendiente'}` : 'Fechas pendientes'}
                  {a.id === actualId && <span className="estado estado--neutro" style={{ marginLeft: 8 }}>Actual</span>}
                  {!a.datos_confirmados && <span style={{ marginLeft: 6 }}><Revisar /></span>}
                </p>
                <p className="linea-2">
                  {c ? `${formatoImporte(deCentimos(c.centimos), moneda)} al año${c.tipo === 'estimado' ? ' (estimado)' : ''}` : 'Prima pendiente'}
                  {variacion !== null && ` · ${variacion >= 0 ? '+' : ''}${variacion.toFixed(1).replace('.', ',')} % respecto a la anterior`}
                  {a.periodicidad && ` · ${textoPeriodicidad(a.periodicidad)}`}
                  {` · ${docs} ${docs === 1 ? 'documento' : 'documentos'}`}
                </p>
              </div>
              <Link className="boton boton--peq" href={`/polizas/${id}/anualidades/${a.id}`}>Corregir</Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Documentos({ id, documentos, anualidades }: { id: string; documentos: Documento[]; anualidades: Anualidad[] }) {
  const opcionesAnualidad = anualidades.map((a) => ({ valor: a.id, texto: a.inicio || a.fin ? `${fechaMedia(a.inicio) || '¿?'} – ${fechaMedia(a.fin) || '¿?'}` : 'Fechas pendientes' }));
  const tamano = (b: string) => { const n = Number(b); return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(n / 1024))} KB`; };
  return (
    <div className="dos-columnas">
      <section className="tarjeta" aria-label="Documentos de la póliza">
        {documentos.length === 0 ? (
          <div className="vacio">
            <h2>Sin documentos</h2>
            <p>Adjunta la póliza, las condiciones generales, los suplementos y los recibos. Se guardan en un almacén privado.</p>
          </div>
        ) : (
          <ul className="lista-simple">
            {documentos.map((d) => {
              const anualidad = opcionesAnualidad.find((o) => o.valor === d.anualidad_id);
              return (
                <li key={d.id}>
                  <div className="titular-ramo" style={{ minWidth: 0, flex: 1 }}>
                    <span className="icono-ramo"><IconoDocumento /></span>
                    <div style={{ minWidth: 0 }}>
                      <a href={`/api/documentos/${d.id}`} target="_blank" rel="noopener" style={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{d.nombre_original}</a>
                      <p className="linea-2">
                        {TIPOS_DOCUMENTO[d.tipo]}{anualidad ? ` · ${anualidad.texto}` : ''} · {tamano(d.bytes)} · subido {fechaMedia(hoyMadrid(new Date(d.subido_en)))}
                      </p>
                      {d.duplicado_de && <p className="linea-2" style={{ color: 'var(--color-aviso-texto)' }}>Idéntico a «{d.duplicado_de}»</p>}
                    </div>
                  </div>
                  <div className="acciones">
                    <a className="boton boton--peq" href={`/api/documentos/${d.id}?descargar=1`}>Descargar</a>
                    <form action={accionEliminarDocumento.bind(null, d.id)}>
                      <button className="boton boton--peq boton--sutil" type="submit" aria-label={`Eliminar ${d.nombre_original}`}>Eliminar</button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <aside className="tarjeta tarjeta--pad" aria-labelledby="t-subir">
        <h2 id="t-subir" style={{ marginBottom: 'var(--e-4)' }}>Adjuntar documentos</h2>
        <Formulario accion={accionSubirDocumento.bind(null, id)} encType="multipart/form-data" aria="Adjuntar documentos">
          <CampoArchivo nombre="archivo" etiqueta="Archivos" multiple accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,.heic"
            ayuda={`PDF o foto (JPEG, PNG, WebP, HEIC). Máximo ${Math.round(maxBytes() / 1024 / 1024)} MB por archivo.`} />
          <Selector nombre="tipo" etiqueta="Tipo de documento" defecto="condiciones_particulares" opciones={Object.entries(TIPOS_DOCUMENTO).map(([valor, texto]) => ({ valor, texto }))} />
          <Selector nombre="anualidad_id" etiqueta="Anualidad a la que corresponde" defecto={anualidades[0]?.id ?? ''} vacio="Sin anualidad concreta" opciones={opcionesAnualidad} />
          <Enviar pendiente="Subiendo…">Subir</Enviar>
          <p className="ayuda secundario pequeno">La lectura automática de los datos del documento llegará en la siguiente entrega; por ahora se guardan como originales consultables.</p>
        </Formulario>
      </aside>
    </div>
  );
}
