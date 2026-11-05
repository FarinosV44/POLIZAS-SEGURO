// Genera la marca de «PRAETORIA gestor de seguros» a partir de los originales del grupo.
//   npm run marca
//
// Referencias (ver docs/MARCA.md): los SVG de scripts/marca/referencias-grupo/ son copia literal de
// FarinosV44/praetoria-web (scripts/marca/fuentes/*.svg y public/favicon.svg, commit 3244d09).
// Se reutilizan los mismos trazos de «PRAETORIA», la composición apilada PRAE / TORIA / descriptor
// y las proporciones; solo cambian la paleta y el descriptor («SEGUROS» / «GESTOR DE SEGUROS»).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import opentype from 'opentype.js';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const REF = 'scripts/marca/referencias-grupo';
const OUT = 'public/marca';
const ICONOS = 'public/iconos';
mkdirSync(OUT, { recursive: true });
mkdirSync(ICONOS, { recursive: true });

// Paleta (#11). Debe coincidir con src/app/tokens.css.
const ACENTO = '#ff4200';
const OSCURO = '#28282B';
const FONDO = '#F9F9F9';

// Descriptor: misma familia geométrica que «ABOGADOS» / «VACACIONAL» del grupo (Montserrat, OFL).
const fuente = opentype.parse(
  readFileSync(require.resolve('@fontsource/montserrat/files/montserrat-latin-600-normal.woff')).buffer,
);

const leer = (f) => readFileSync(`${REF}/${f}`, 'utf8');
const trazos = (svg) => [...svg.matchAll(/<path fill="([^"]+)" d="([^"]+)"\/>/g)].map((m) => ({ fill: m[1], d: m[2] }));

/** Caja de un trazo con comandos absolutos M/L/Q/Z (los del grupo). */
function caja(d) {
  const n = d.match(/-?\d+(?:\.\d+)?/g).map(Number);
  const xs = n.filter((_, i) => i % 2 === 0);
  const ys = n.filter((_, i) => i % 2 === 1);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

/** Texto en trazos con espaciado para ocupar exactamente `ancho`, alineado a la línea base `base`. */
function textoAjustado(texto, { x, base, altoMayus, ancho }) {
  const escala = altoMayus / fuente.tables.os2.sCapHeight;
  const tam = fuente.unitsPerEm * escala;
  const glifos = fuente.stringToGlyphs(texto);
  const avances = glifos.map((g) => g.advanceWidth * escala);
  // Se descuenta el espacio lateral del último glifo para que el bloque sea ópticamente exacto.
  const ultimo = glifos.at(-1);
  const sobrante = ((ultimo.advanceWidth - ultimo.xMax) * escala);
  const natural = avances.reduce((a, b) => a + b, 0) - sobrante;
  const primero = glifos[0].xMin * escala;
  const tracking = (ancho - natural + primero) / (glifos.length - 1);
  let cx = x - primero;
  const partes = [];
  for (let i = 0; i < glifos.length; i++) {
    partes.push(glifos[i].getPath(cx, base, tam).toPathData(2));
    cx += avances[i] + tracking;
  }
  return partes.join('');
}


/** Aplica escala y traslación a un trazo absoluto M/L/Q. */
function transformar(d, { s = 1, dx = 0, dy = 0 }) {
  let par = 0;
  return d.replace(/-?\d+(?:\.\d+)?/g, (v) => {
    const r = par % 2 === 0 ? Number(v) * s + dx : Number(v) * s + dy;
    par++;
    return r.toFixed(2).replace(/\.?0+$/, '');
  });
}

// ---------- Iconos cuadrados: misma composición PRAE / TORIA / descriptor del grupo ----------
function iconoCuadrado(origen, { fondo = FONDO, rx } = {}) {
  const svg = leer(origen);
  const [prae, toria, descriptor] = trazos(svg);
  const rect = svg.match(/<rect[^>]*\/>/)[0];
  const radio = rx ?? (rect.match(/rx="(\d+)"/)?.[1] ?? null);
  const b = caja(descriptor.d);
  // La «O» y la «G» de ABOGADOS rebasan la altura de mayúsculas: se mide con la «A» inicial.
  const altoMayus = (b.y1 - b.y0) * 0.975;
  const seguros = textoAjustado('SEGUROS', { x: b.x0, base: b.y1 - (b.y1 - b.y0) * 0.0125, altoMayus, ancho: b.x1 - b.x0 });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512"${radio ? ` rx="${radio}"` : ''} fill="${fondo}"/><path fill="${ACENTO}" d="${prae.d}"/><path fill="${ACENTO}" d="${toria.d}"/><path fill="${OSCURO}" d="${seguros}"/></svg>\n`;
}

function faviconPequeno() {
  // Hasta 48 px solo PRAE / TORIA, igual que el favicon del grupo.
  return leer('favicon-grupo.svg').replace(/fill="#fff"/, `fill="${FONDO}"`).replaceAll('#B3242A', ACENTO);
}

function insignia() {
  // Insignia monocroma de las notificaciones Android (solo cuenta la transparencia).
  return leer('insignia.svg');
}

// ---------- Logotipo horizontal: PRAETORIA en una línea + descriptor espaciado debajo ----------
function horizontal({ descriptorColor, fondo }) {
  const [prae, toria] = trazos(leer('completo.svg'));
  const bp = caja(prae.d);
  const bt = caja(toria.d);
  // «TORIA» se reescala a la altura de «PRAE» (en el icono va comprimida para justificar el bloque).
  // La «O» rebasa: la altura de referencia es la de la «T» (primer trazo recto).
  const altoPrae = bp.y1 - bp.y0;
  const altoToria = 335.11 - 242.42;
  const s = altoPrae / altoToria;
  const separacion = 10.14; // espacio P–R del propio trazo del grupo
  const toriaD = transformar(toria.d, { s, dx: bp.x1 + separacion - bt.x0 * s, dy: bp.y1 - 335.11 * s });
  const anchoMarca = bp.x1 + separacion + (bt.x1 - bt.x0) * s - bp.x0;
  // Proporciones del logotipo horizontal del grupo (logo-praetoria.png, «DIVISIÓN JURÍDICA»):
  // descriptor ≈ 24 % de la altura de la marca y separado ≈ 28 %.
  const altoDesc = altoPrae * 0.24;
  const hueco = altoPrae * 0.28;
  const base = bp.y1 + hueco + altoDesc;
  const margen = altoPrae * 0.12;
  const insetDesc = anchoMarca * 0.015;
  const desc = textoAjustado('GESTOR DE SEGUROS', { x: bp.x0 + insetDesc, base, altoMayus: altoDesc, ancho: anchoMarca - 2 * insetDesc });
  const vx = bp.x0 - margen;
  const vy = bp.y0 - margen;
  const vw = anchoMarca + 2 * margen;
  const vh = base - bp.y0 + 2 * margen;
  const f = (n) => n.toFixed(2);
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(vx)} ${f(vy)} ${f(vw)} ${f(vh)}" role="img" aria-label="PRAETORIA gestor de seguros"><title>PRAETORIA gestor de seguros</title>${fondo ? `<rect x="${f(vx)}" y="${f(vy)}" width="${f(vw)}" height="${f(vh)}" fill="${fondo}"/>` : ''}<path fill="${ACENTO}" d="${prae.d}"/><path fill="${ACENTO}" d="${toriaD}"/><path fill="${descriptorColor}" d="${desc}"/></svg>\n`,
    proporcion: vw / vh,
  };
}


const claro = horizontal({ descriptorColor: OSCURO });
const oscuro = horizontal({ descriptorColor: FONDO });
writeFileSync(`${OUT}/logo.svg`, claro.svg);
writeFileSync(`${OUT}/logo-oscuro.svg`, oscuro.svg);
writeFileSync(`${OUT}/icono.svg`, iconoCuadrado('completo.svg'));
writeFileSync(`${OUT}/icono-maskable.svg`, iconoCuadrado('completo-maskable.svg'));
writeFileSync(`${OUT}/icono-a-sangre.svg`, iconoCuadrado('completo-a-sangre.svg'));
writeFileSync(`${OUT}/favicon.svg`, faviconPequeno());
writeFileSync('public/favicon.svg', faviconPequeno());
writeFileSync(`${OUT}/insignia.svg`, insignia());
writeFileSync('src/components/marca-proporcion.json', JSON.stringify({ logo: Number(claro.proporcion.toFixed(4)) }) + '\n');

const png = (archivo, size) => sharp(archivo, { density: 384 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
const opaco = async (archivo, size) => sharp(await png(archivo, size)).flatten({ background: FONDO }).png({ compressionLevel: 9 }).toBuffer();
const salidas = [
  ['public/favicon-48.png', `${OUT}/favicon.svg`, 48, png],
  [`${ICONOS}/icono-192.png`, `${OUT}/icono.svg`, 192, png],
  [`${ICONOS}/icono-512.png`, `${OUT}/icono.svg`, 512, png],
  // iOS redondea por su cuenta y no admite transparencia.
  ['public/apple-touch-icon.png', `${OUT}/icono-a-sangre.svg`, 180, opaco],
  // Android recorta el icono: el contenido queda dentro del 80 % central (zona segura).
  [`${ICONOS}/icono-maskable-512.png`, `${OUT}/icono-maskable.svg`, 512, opaco],
  [`${ICONOS}/insignia-96.png`, `${OUT}/insignia.svg`, 96, png],
];
for (const [destino, origen, size, fn] of salidas) writeFileSync(destino, await fn(origen, size));

// favicon.ico con PNG de 16, 32 y 48 px.
const marcos = [];
for (const size of [16, 32, 48]) marcos.push([size, await png(`${OUT}/favicon.svg`, size)]);
const cabecera = Buffer.alloc(6 + 16 * marcos.length);
cabecera.writeUInt16LE(1, 2);
cabecera.writeUInt16LE(marcos.length, 4);
let pos = cabecera.length;
marcos.forEach(([size, datos], i) => {
  const o = 6 + 16 * i;
  cabecera[o] = size;
  cabecera[o + 1] = size;
  cabecera.writeUInt16LE(1, o + 4);
  cabecera.writeUInt16LE(32, o + 6);
  cabecera.writeUInt32LE(datos.length, o + 8);
  cabecera.writeUInt32LE(pos, o + 12);
  pos += datos.length;
});
writeFileSync('src/app/favicon.ico', Buffer.concat([cabecera, ...marcos.map(([, d]) => d)]));
console.log('Marca generada en public/marca, public/iconos y src/app/favicon.ico');
