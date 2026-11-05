import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Requiere la demo sintética: DEMO_PERMITIDA=1 npm run demo:sintetica
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

async function sinScrollHorizontal(page: Page) {
  const ancho = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(ancho, 'no debe haber desplazamiento horizontal').toBeLessThanOrEqual(0);
}

async function accesible(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
}

for (const [nombre, viewport] of [['movil', { width: 375, height: 812 }], ['escritorio', { width: 1366, height: 900 }]] as const) {
  test.describe(nombre, () => {
    test.use({ viewport });

    test('acceso, panel y ficha', async ({ page }) => {
      await page.goto('/acceso');
      await expect(page).toHaveTitle(/PRAETORIA gestor de seguros/);
      await accesible(page);
      if (CAPTURAS) await page.screenshot({ path: `docs/capturas/acceso-${nombre}.png`, fullPage: true });

      await entrar(page);
      await sinScrollHorizontal(page);
      await accesible(page);
      // Titular, tipo, importe y vencimiento visibles sin abrir la póliza
      const zona = nombre === 'movil' ? page.locator('.lista-tarjetas') : page.locator('table');
      await expect(zona.getByText('Transportes Ejemplo, S.L.').first()).toBeVisible();
      await expect(zona.getByText('Mercancías flota nacional')).toBeVisible();
      await expect(zona.getByText(/2\.480,00/)).toBeVisible();
      if (CAPTURAS) await page.screenshot({ path: `docs/capturas/panel-${nombre}.png`, fullPage: true });

      // Filtro por particulares no mezcla titulares; se conserva al volver de la ficha.
      await page.getByRole('link', { name: 'Particulares', exact: true }).click();
      await expect(page).toHaveURL(/ambito=particulares/);
      await expect(page.getByText('Transportes Ejemplo, S.L.')).toHaveCount(0);
      await page.getByRole('link', { name: 'Vivienda habitual' }).first().click();
      await expect(page.getByRole('heading', { name: 'Vivienda habitual' })).toBeVisible();
      await sinScrollHorizontal(page);
      await accesible(page);
      if (CAPTURAS) await page.screenshot({ path: `docs/capturas/ficha-${nombre}.png`, fullPage: true });
      await page.getByRole('link', { name: /Anualidades/ }).click();
      await expect(page.getByText(/% respecto a la anterior/)).toBeVisible();
      if (CAPTURAS) await page.screenshot({ path: `docs/capturas/historial-${nombre}.png`, fullPage: true });
      await page.getByRole('link', { name: '← Pólizas' }).click();
      await expect(page).toHaveURL(/ambito=particulares/);
    });
  });
}

test('alta manual, documento privado y aislamiento sin sesión', async ({ page, browser }) => {
  await entrar(page);
  await page.getByRole('link', { name: 'Añadir póliza' }).first().click();
  await expect(page.getByRole('heading', { name: 'Añadir póliza' })).toBeVisible();
  await page.getByLabel('Titular', { exact: true }).selectOption({ label: 'Inversiones Ficticias, S.L.' });
  await page.getByLabel('Tipo de seguro', { exact: true }).selectOption({ label: 'Accidentes' });
  await page.getByLabel('Nombre de la póliza').fill('Accidentes convenio (prueba e2e)');
  await page.getByLabel('Aseguradora', { exact: true }).fill('Aseguradora Prueba (ficticia)');
  await page.getByLabel('Prima anual total').fill('1.234,56');
  await page.getByLabel('Vencimiento', { exact: true }).fill('2027-08-31');
  await page.getByRole('button', { name: 'Guardar póliza' }).click();
  await expect(page.getByText('Póliza guardada')).toBeVisible();
  await expect(page.getByText('1.234,56 €')).toBeVisible();

  // Error de validación: conserva lo escrito
  await page.getByRole('link', { name: /Anualidades/ }).click();
  await page.getByRole('link', { name: 'Registrar renovación' }).click();
  await page.getByLabel('Prima anual total').fill('abc');
  await page.getByRole('button', { name: 'Guardar anualidad' }).click();
  await expect(page.getByText(/Importe no válido/)).toBeVisible();
  await expect(page.getByLabel('Prima anual total')).toHaveValue('abc');
  await page.getByRole('link', { name: 'Cancelar' }).click();

  await page.getByRole('link', { name: /Documentos/ }).click();
  await page.getByLabel('Archivos').setInputFiles({ name: 'poliza-sintetica.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n% sintético e2e\n%%EOF\n') });
  await page.getByRole('button', { name: 'Subir' }).click();
  await expect(page.getByText('Documento guardado')).toBeVisible();
  const enlace = page.getByRole('link', { name: 'poliza-sintetica.pdf' });
  const href = (await enlace.getAttribute('href'))!;
  const conSesion = await page.request.get(href);
  expect(conSesion.status()).toBe(200);
  expect(conSesion.headers()['cache-control']).toContain('no-store');
  // Un navegador sin sesión no obtiene el documento
  const anonimo = await browser.newContext();
  expect((await anonimo.request.get(new URL(href, page.url()).toString())).status()).toBe(404);
  for (const ruta of ['/api/exportar/polizas', '/api/exportar/poliza/00000000-0000-0000-0000-000000000000', '/api/siniestros/archivos/00000000-0000-0000-0000-000000000000']) {
    expect((await anonimo.request.get(new URL(ruta, page.url()).toString())).status()).toBe(404);
  }
  const csv = await page.request.get('/api/exportar/polizas');
  expect(csv.headers()['content-type']).toContain('text/csv');
  expect(await csv.text()).toContain('Accidentes convenio (prueba e2e)');
  expect((await page.request.get('/api/salud')).status()).toBe(200);
  await anonimo.close();
});
