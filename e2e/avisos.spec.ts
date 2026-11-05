import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Requiere la demo sintética y una ejecución del planificador: npm run avisos:ejecutar
const EMAIL = process.env.DEMO_EMAIL ?? 'demo@ejemplo.test';
const CLAVE = process.env.DEMO_CLAVE ?? 'demo-sintetica-2026';
const CAPTURAS = process.env.CAPTURAS === '1';

test.describe('avisos y app instalable', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('manifest, service worker y página sin conexión', async ({ request }) => {
    const m = await (await request.get('/manifest.webmanifest')).json();
    expect(m).toMatchObject({ name: 'PRAETORIA gestor de seguros', short_name: 'PRAETORIA', display: 'standalone', lang: 'es', start_url: '/' });
    expect(m.icons.some((i: { purpose: string }) => i.purpose === 'maskable')).toBe(true);
    const sw = await request.get('/sw.js');
    expect(sw.status()).toBe(200);
    expect(sw.headers()['cache-control']).toContain('no-cache');
    const cuerpo = await sw.text();
    expect(cuerpo).toContain("addEventListener('push'");
    expect(cuerpo).not.toMatch(/\/api\/documentos|cache\.put/); // no se cachean datos
    expect((await request.get('/offline')).status()).toBe(200);
  });

  test('centro de avisos, detalle y posponer', async ({ page }) => {
    await page.goto('/avisos');
    await expect(page).toHaveURL(/acceso\?destino=%2Favisos/);
    await page.getByLabel('Correo electrónico').fill(EMAIL);
    await page.getByLabel('Contraseña').fill(CLAVE);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByRole('heading', { name: 'Avisos', level: 1 })).toBeVisible(); // vuelve al destino
    await expect(page.getByRole('link', { name: /Mercancías flota nacional: Vence en \d+ días/ })).toBeVisible();
    await expect(page.getByText(/Turismo personal: Venció/)).toBeVisible();
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(axe.violations.map((v) => v.id)).toEqual([]);
    if (CAPTURAS) await page.screenshot({ path: 'docs/capturas/avisos-movil.png', fullPage: true });

    await page.getByRole('link', { name: /Multirriesgo oficina/ }).click();
    await expect(page.getByRole('heading', { name: 'Datos para renegociar' })).toBeVisible();
    await expect(page.getByText('Leído')).toBeVisible();
    if (CAPTURAS) await page.screenshot({ path: 'docs/capturas/aviso-detalle-movil.png', fullPage: true });
    await page.getByRole('button', { name: 'Posponer' }).click();
    await expect(page.getByText(/Aviso pospuesto/)).toBeVisible();

    await page.goto('/avisos/dispositivo');
    await expect(page.getByRole('heading', { name: 'Diagnóstico' })).toBeVisible();
    await expect(page.getByText('Servidor de push configurado')).toBeVisible();
    if (CAPTURAS) await page.screenshot({ path: 'docs/capturas/avisos-dispositivo-movil.png', fullPage: true });
  });
});
