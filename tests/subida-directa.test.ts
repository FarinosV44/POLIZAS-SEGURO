import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Usuario } from '../src/lib/auth/sesiones';
import { confirmarSubidas, prepararSubidas } from '../src/lib/datos/subidas';
import { documentoParaDescarga, listarDocumentos } from '../src/lib/datos/documentos';
import { almacen } from '../src/lib/almacen';
import { fijarAccesos } from '../src/lib/datos/usuarios';
import { poliza, titular, usuario } from './ayudas';

// Simula Supabase Storage en memoria: comprueba que solo se usa la API privada con la clave secreta.
const objetos = new Map<string, Buffer>();
const URL = 'https://proyecto-sintetico.supabase.co';
const firmas = new Set<string>();
const falsoFetch = vi.fn(async (entrada: string | URL | Request, init?: RequestInit) => {
  const u = new globalThis.URL(String(entrada));
  const h = new Headers(init?.headers);
  const ruta = u.pathname.replace('/storage/v1/', '');
  if (ruta.startsWith('object/upload/sign/') && init?.method === 'POST') {
    if (h.get('apikey') !== 'sb_secret_prueba') return new Response('', { status: 403 });
    const clave = ruta.replace('object/upload/sign/', '');
    const token = Math.random().toString(36).slice(2);
    firmas.add(`${clave}?${token}`);
    return Response.json({ url: `/object/upload/sign/${clave}?token=${token}` });
  }
  if (ruta.startsWith('object/upload/sign/') && init?.method === 'PUT') {
    const clave = ruta.replace('object/upload/sign/', '');
    if (!firmas.delete(`${clave}?${u.searchParams.get('token')}`)) return new Response('', { status: 403 });
    objetos.set(clave, Buffer.from(await new Response(init.body as BodyInit).arrayBuffer()));
    return new Response('{}');
  }
  if (h.get('apikey') !== 'sb_secret_prueba') return new Response('', { status: 403 });
  if (ruta.startsWith('object/authenticated/')) {
    const o = objetos.get(ruta.replace('object/authenticated/', ''));
    return o ? new Response(new Uint8Array(o), { headers: { 'content-length': String(o.length) } }) : new Response('', { status: 404 });
  }
  if (init?.method === 'DELETE') {
    for (const p of JSON.parse(String(init.body)).prefixes) objetos.delete(`${ruta.replace('object/', '')}/${p}`);
    return new Response('[]');
  }
  if (init?.method === 'POST' && ruta.startsWith('object/')) {
    objetos.set(ruta.replace('object/', ''), Buffer.from(init.body as Uint8Array));
    return new Response('{}');
  }
  return new Response('', { status: 400 });
});

describe('subida directa al almacén privado de Supabase', () => {
  let admin: Usuario, ajeno: Usuario, pol: string;
  beforeAll(async () => {
    Object.assign(process.env, { STORAGE_DRIVER: 'supabase', SUPABASE_URL: URL, SUPABASE_SECRET_KEY: 'sb_secret_prueba', SUPABASE_BUCKET: 'seguros-documentos' });
    vi.stubGlobal('fetch', falsoFetch);
    admin = await usuario('admin');
    ajeno = await usuario('colaborador');
    const t = await titular(admin, 'empresa', 'Empresa Sintética Subida Directa');
    pol = await poliza(admin, t);
    await fijarAccesos(admin, ajeno.id, []);
  });
  afterAll(() => { process.env.STORAGE_DRIVER = 'disco'; vi.unstubAllGlobals(); });

  it('autoriza, sube, valida y registra; el original se lee con la clave secreta', async () => {
    const pdf = Buffer.from('%PDF-1.4\n% póliza sintética subida directa\n%%EOF\n');
    const [p] = await prepararSubidas(admin, 'poliza', pol, [{ nombre: 'cp-directa.pdf', bytes: pdf.length }]);
    expect(p!.url).toMatch(/^https:\/\/proyecto-sintetico\.supabase\.co\/storage\/v1\/object\/upload\/sign\/seguros-documentos\//);
    expect((await fetch(p!.url, { method: 'PUT', body: pdf })).ok).toBe(true);
    // La autorización es de un solo uso
    expect((await fetch(p!.url, { method: 'PUT', body: pdf })).ok).toBe(false);
    const [r] = await confirmarSubidas(admin, 'poliza', pol, [p!.clave], { tipo: 'condiciones_particulares' });
    const d = await documentoParaDescarga(admin, r!.id);
    expect((await almacen().leerBuffer(d.clave_almacen)).equals(pdf)).toBe(true);
    // No se puede confirmar dos veces la misma clave
    await expect(confirmarSubidas(admin, 'poliza', pol, [p!.clave], { tipo: 'otro' })).rejects.toThrow(/Revisa/);
  });

  it('archivo falso: no se registra y se borra del almacén', async () => {
    const malo = Buffer.from('MZ ejecutable disfrazado de PDF');
    const [p] = await prepararSubidas(admin, 'poliza', pol, [{ nombre: 'falso.pdf', bytes: malo.length }]);
    await fetch(p!.url, { method: 'PUT', body: malo });
    await expect(confirmarSubidas(admin, 'poliza', pol, [p!.clave], { tipo: 'otro' })).rejects.toThrow(/Revisa/);
    expect(objetos.has(`seguros-documentos/${p!.clave}`)).toBe(false);
    expect((await listarDocumentos(admin, pol)).map((x) => x.nombre_original)).not.toContain('falso.pdf');
  });

  it('sin permiso no se autoriza ni se puede confirmar una clave ajena', async () => {
    await expect(prepararSubidas(ajeno, 'poliza', pol, [{ nombre: 'x.pdf', bytes: 10 }])).rejects.toThrow(/No se ha encontrado/);
    const [p] = await prepararSubidas(admin, 'poliza', pol, [{ nombre: 'y.pdf', bytes: 10 }]);
    await expect(confirmarSubidas(ajeno, 'poliza', pol, [p!.clave], { tipo: 'otro' })).rejects.toThrow(/No se ha encontrado/);
    await expect(prepararSubidas(admin, 'poliza', pol, [{ nombre: 'grande.pdf', bytes: 999 * 1024 * 1024 }])).rejects.toThrow(/Revisa/);
  });
});
