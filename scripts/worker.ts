// Proceso permanente de avisos: planifica, emite y envía aunque nadie abra la web.
//   npm run worker
// Cada 20 s procesa la cola de envíos y las lecturas/análisis de IA; cada 5 minutos ejecuta la tarea completa.
// Reinicio seguro: las claves de idempotencia impiden duplicar avisos o envíos.
import { pool } from '../src/lib/db';
import { tareaAvisos } from '../src/lib/avisos/tarea';
import { procesarCola } from '../src/lib/avisos/cola';
import { pushConfigurado } from '../src/lib/avisos/push';
import { correoConfigurado } from '../src/lib/correo';
import { procesarColaIA } from '../src/lib/ia/siniestro';
import { procesarColaExtraccion } from '../src/lib/ia/extraccion';
import { iaConfigurada } from '../src/lib/ia/proveedor';

const MINUTO = 60_000;
let parar = false;
let vuelta = 0; // cada vuelta dura ~20 s; la tarea completa, cada 15 vueltas (5 min)
process.on('SIGTERM', () => { parar = true; });
process.on('SIGINT', () => { parar = true; });

console.log(`[worker] iniciado · IA ${iaConfigurada() ? 'configurada' : 'SIN CONFIGURAR'} · push ${pushConfigurado() ? 'configurado' : 'SIN CONFIGURAR'} · correo ${correoConfigurado() ? 'configurado' : 'SIN CONFIGURAR'}`);
while (!parar) {
  try {
    if (vuelta % 15 === 0) console.log('[worker]', new Date().toISOString(), JSON.stringify(await tareaAvisos()));
    else {
      const r = await procesarCola();
      if (r.enviados || r.fallidos || r.reintentos) console.log('[worker] cola', JSON.stringify(r));
    }
  } catch (e) {
    console.error('[worker] error', (e as Error).message);
  }
  try {
    // Lecturas de documentos y análisis de siniestros pendientes
    const n = (await procesarColaExtraccion()) + (await procesarColaIA());
    if (n) console.log('[worker] IA', n);
  } catch (e) {
    console.error('[worker] error IA', (e as Error).message);
  }
  vuelta++;
  for (let i = 0; i < 20 && !parar; i++) await new Promise((r) => setTimeout(r, MINUTO / 60)); // 20 s
}
await pool().end();
console.log('[worker] detenido');
