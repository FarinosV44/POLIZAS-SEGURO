# Identidad visual — PRAETORIA gestor de seguros (#11)

## Nombre

- Completo: **PRAETORIA gestor de seguros** (interfaz, título del navegador, manifest, metadatos).
- Corto (icono instalado): **PRAETORIA**.

## Paleta y tipografía

Única fuente: `src/app/tokens.css`. Ninguna pantalla usa colores sueltos.

| Uso | Valor |
| --- | --- |
| Fondo base | `#F9F9F9` |
| Texto y elementos oscuros | `#28282B` |
| Acento (acciones principales, selección, detalles) | `#ff4200` |
| Tipografía | `Helvetica, "Helvetica Neue", Arial, sans-serif` (la del sistema; no se sirve ningún archivo de fuente) |

Derivados (superficie blanca, texto secundario, bordes, estados) en el mismo archivo.

### Contraste comprobado (WCAG 2.1)

| Combinación | Ratio | Uso permitido |
| --- | --- | --- |
| `#28282B` sobre `#F9F9F9` | 13,96:1 | Todo el texto |
| `#5E5E63` sobre `#F9F9F9` | 6,12:1 | Texto secundario |
| `#000000` sobre `#ff4200` | 6,03:1 | **Texto de los botones principales** |
| `#ffffff` sobre `#ff4200` | 3,48:1 | ✗ No se usa para texto |
| `#28282B` sobre `#ff4200` | 4,22:1 | ✗ No se usa para texto normal |
| `#ff4200` sobre `#F9F9F9` | 3,31:1 | Solo elementos no textuales: foco, subrayado de selección, logotipo |
| `#F9F9F9` sobre `#28282B` | 13,96:1 | Botón oscuro, segmento activo |

El naranja nunca se usa como color de texto pequeño. La prueba `tests/contraste.test.ts` recalcula estos valores desde los tokens y falla si alguien rompe una combinación; la prueba de interfaz (`e2e/`) pasa axe-core (WCAG 2.1 AA) en acceso, panel y ficha, en móvil y escritorio.

## Logotipo

### Referencias del grupo revisadas

| Proyecto | Activo | Qué se toma |
| --- | --- | --- |
| FarinosV44/praetoria-web (commit `3244d09`) | `scripts/marca/fuentes/completo.svg`, `completo-maskable.svg`, `completo-a-sangre.svg`, `insignia.svg`, `public/favicon.svg` | **Trazos exactos de «PRAETORIA»** (PRAE / TORIA), composición apilada de los iconos, zona segura maskable, favicon solo con PRAE / TORIA hasta 48 px |
| FarinosV44/praetoria-web | `public/logo-praetoria.png` («PRAETORIA / DIVISIÓN JURÍDICA») | Logotipo horizontal: palabra en mayúsculas de palo grueso, descriptor espaciado debajo y de igual ancho; proporciones (descriptor ≈ 24 % de la altura de la marca, separación ≈ 28 %) |
| FarinosV44/Praetoria-Vacacional | `public/logo.svg` («PRAETORIA / VACACIONAL») | Confirma el patrón de la familia: el color de la marca cambia por división y el descriptor va en gris oscuro y espaciado |

Copia literal de los SVG de referencia en `scripts/marca/referencias-grupo/`. No se ha añadido ningún símbolo nuevo ni iconografía romana.

### Adaptación

- «PRAETORIA» en `#ff4200` (como el rojo de Abogados o el terracota de Vacacional) y descriptor **GESTOR DE SEGUROS** en `#28282B`, con la familia geométrica del descriptor del grupo (Montserrat, licencia OFL, convertida a trazos).
- Versión oscura: descriptor en `#F9F9F9`.
- Iconos: PRAE / TORIA / **SEGUROS** sobre `#F9F9F9`, igual que PRAE / TORIA / ABOGADOS.

### Archivos (generados con `npm run marca`)

| Archivo | Uso |
| --- | --- |
| `public/marca/logo.svg`, `logo-oscuro.svg` | Maestros vectoriales horizontales (claro / oscuro) |
| `public/marca/icono.svg` | Maestro vectorial del icono |
| `public/marca/favicon.svg`, `src/app/favicon.ico` (16/32/48), `public/favicon-48.png` | Pestaña del navegador |
| `public/iconos/icono-192.png`, `icono-512.png` | Manifest PWA |
| `public/iconos/icono-maskable-512.png` | Android (contenido dentro de la zona segura) |
| `public/apple-touch-icon.png` (180, sin transparencia) | iPhone |
| `public/iconos/insignia-96.png` | Insignia monocroma de notificaciones Android |

### Estado

**Propuesta basada en referencias verificadas, pendiente de tu aprobación.** Si existe un maestro vectorial oficial del logotipo horizontal del grupo (el PNG de la web es la única versión horizontal localizada y la de Vacacional es un trazado), conviene facilitarlo para sustituir las proporciones medidas por las originales.

## Capturas

`docs/capturas/`: acceso, panel, ficha e historial, en móvil (375 px) y escritorio (1366 px), con datos sintéticos. En el entorno de pruebas (Linux) Helvetica no está instalada y el navegador usa Arial/Liberation Sans, el siguiente valor de la pila; en iPhone, iPad y Mac se ve Helvetica.
