import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const EMAIL = process.env.DEMO_EMAIL ?? 'demo@ejemplo.test';
const CLAVE = process.env.DEMO_CLAVE ?? 'demo-sintetica-2026';
const CAPTURAS = process.env.CAPTURAS === '1';

async function entrar(page: Page) {
  await page.goto('/acceso');
  await page.getByLabel('Correo electrónico').fill(EMAIL);
  await page.getByLabel('Contraseña').fill(CLAVE);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Pólizas', level: 1 })).toBeVisible();
}
const axe = async (page: Page) => expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations.map((v) => `${v.id} ${v.nodes[0]?.target}`)).toEqual([]);

test.describe('siniestros, renegociación y lectura (sin IA configurada)', () => {
  test.use({ viewport: { width: 1366, height: 900 } });

  test('expediente de siniestro con plantilla, archivos y seguimiento', async ({ page }) => {
    await entrar(page);
    
    await page.getByRole('link', { name: 'Furgoneta de reparto' }).first().click();
    await page.getByRole('link', { name: 'Comunicar siniestro' }).click();
    await page.getByLabel('Título breve').fill('Golpe al aparcar (prueba e2e)');
    await page.getByLabel('Relato de los hechos').fill('Al aparcar en el muelle de carga, un camión golpeó el lateral derecho de la furgoneta.');
    await page.getByLabel('Fecha del hecho').fill(new Date().toISOString().slice(0, 10));
    await page.getByRole('button', { name: 'Crear expediente' }).click();
    await expect(page.getByRole('heading', { name: 'Golpe al aparcar (prueba e2e)' })).toBeVisible();
    await expect(page.getByText('vigente el día del hecho').first()).toBeAttached();
    await axe(page);
    if (CAPTURAS) await page.screenshot({ path: 'docs/capturas/siniestro-escritorio.png', fullPage: true });

    await page.getByRole('link', { name: /^Análisis/ }).click();
    await expect(page.getByText('Asistente con IA sin configurar.')).toBeVisible();
    await expect(page.getByText(/faltan las condiciones generales/).first()).toBeVisible();
    await page.getByRole('link', { name: 'Comunicación' }).click();
    await page.getByRole('button', { name: 'Nueva desde la plantilla' }).click();
    await expect(page.getByLabel('Texto')).toHaveValue(/un camión golpeó el lateral derecho/);
    await expect(page.getByLabel('Texto')).toHaveValue(/\[nombre y datos de contacto\]/);
    await axe(page);

    await page.getByRole('link', { name: 'Seguimiento' }).click();
    await page.getByLabel('Estado', { exact: true }).selectOption('comunicado');
    await page.getByLabel('Referencia de la aseguradora').fill('EXP-E2E-1');
    await page.getByRole('button', { name: 'Guardar' }).first().click();
    await expect(page.getByText('Seguimiento actualizado.')).toBeVisible();
  });

  test('renegociación: oferta más barata con franquicia superior y exclusión nueva', async ({ page }) => {
    await entrar(page);
    await page.getByRole('link', { name: 'Mercancías flota nacional' }).first().click();
    await page.getByRole('button', { name: 'Renegociar' }).or(page.getByRole('link', { name: 'Renegociación' })).click();
    await expect(page.getByRole('heading', { name: /Renegociación: Mercancías flota nacional/ })).toBeVisible();
    const oferta = page.getByRole('form', { name: 'Añadir oferta' });
    await oferta.getByLabel('Aseguradora', { exact: true }).fill('Compañía Alternativa (ficticia)');
    await oferta.getByLabel('Prima anual', { exact: true }).fill('2.100,00');
    await oferta.getByLabel('Franquicias').fill('Franquicia de 900 euros');
    await oferta.getByLabel('Exclusiones (una por línea)').fill('Mercancía refrigerada');
    await oferta.getByRole('button', { name: 'Guardar oferta' }).click();
    await expect(page.getByText('Oferta registrada.')).toBeVisible();
    await expect(page.getByText(/Más barata: −380,00/).first()).toBeVisible();
    await expect(page.getByText(/Exclusión nueva o distinta: Mercancía refrigerada/).first()).toBeVisible();
    await page.getByRole('button', { name: 'Preparar borrador para el mediador' }).click();
    await expect(page.getByLabel('Borrador para el mediador')).toHaveValue(/2\.480,00/);
    await axe(page);
    if (CAPTURAS) await page.screenshot({ path: 'docs/capturas/renegociacion-escritorio.png', fullPage: true });
  });

  test('revisión de documento: original junto a la lectura (sin IA: entrada manual)', async ({ page }) => {
    await entrar(page);
    await page.getByRole('link', { name: 'Mercancías flota nacional' }).first().click();
    await page.getByRole('link', { name: /Documentos/ }).click();
    await page.getByRole('link', { name: 'Ver y leer' }).first().click();
    await expect(page.getByText('Lectura automática sin configurar.')).toBeVisible();
    await expect(page.locator('iframe')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Introducir a mano' })).toBeVisible();
  });
});

test('móvil: barra inferior con cinco secciones y sin desplazamiento horizontal en siniestros', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await entrar(page);
  await page.getByRole('navigation', { name: 'Navegación principal (móvil)' }).getByRole('link', { name: 'Siniestros' }).click();
  await expect(page.getByRole('heading', { name: 'Siniestros', level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  if (CAPTURAS) await page.screenshot({ path: 'docs/capturas/siniestros-movil.png', fullPage: true });
});
