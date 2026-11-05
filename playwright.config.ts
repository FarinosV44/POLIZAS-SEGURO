import { defineConfig } from '@playwright/test';

// Pruebas de interfaz contra una instancia local con datos SINTÉTICOS (npm run demo:sintetica).
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  workers: 1,
  use: {
    baseURL: process.env.E2E_URL ?? 'http://localhost:3000',
    channel: process.env.E2E_CHROME ? undefined : 'chrome',
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
  },
});
