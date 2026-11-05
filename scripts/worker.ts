// Proceso permanente de avisos: planifica, emite y envía aunque nadie abra la web.
//   npm run worker
// Cada minuto procesa la cola de envíos; cada 5 minutos ejecuta la tarea completa.
// Reinicio seguro: las claves de idempotencia impiden duplicar avisos o envíos.
import { pool } from '../src/lib/db';
import { tareaAvisos } from '../src/lib/avisos/tarea';
import { procesarCola } from '../src/lib/avisos/cola';
import { pushConfigurado } from '../src/lib/avisos/push';
import { correoConfigurado } from '../src/lib/correo';

const MINUTO = 60_000;
let parar = false;
let vuelta = 0;
process.on('SIGTERM', () => { parar = true; });
process.on('SIGINT', () => { parar = true; });

console.log(`[worker] iniciado · push ${pushConfigurado() ? 'configurado' : 'SIN CONFIGURAR'} · correo ${correoConfigurado() ? 'configurado' : 'SIN CONFIGURAR'}`);
while (!parar) {
  try {
    if (vuelta % 5 === 0) console.log('[worker]', new Date().toISOString(), JSON.stringify(await tareaAvisos()));
    else {
      const r = await procesarCola();
      if (r.enviados || r.fallidos || r.reintentos) console.log('[worker] cola', JSON.stringify(r));
    }
  } catch (e) {
    console.error('[worker] error', (e as Error).message);
  }
  vuelta++;
  for (let i = 0; i < 60 && !parar; i++) await new Promise((r) => setTimeout(r, MINUTO / 60));
}
await pool().end();
console.log('[worker] detenido');
