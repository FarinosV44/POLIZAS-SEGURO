# Instrucciones para trabajar en este repositorio

- Aplicación privada **PRAETORIA gestor de seguros**. Interfaz y documentación en español.
- **El repositorio es público**: nunca subir pólizas reales, datos personales, información de salud, secretos ni volcados. Pruebas y demo solo con datos sintéticos claramente inventados.
- Plan maestro en el issue #10; requisitos de diseño en #11. Trabajar en ramas y PR vinculadas a su issue; no cerrar issues sin cumplir los criterios de aceptación.
- Paleta y tipografía solo desde `src/app/tokens.css`. Texto sobre el naranja: negro (`--color-sobre-acento`). Ver `docs/MARCA.md`.
- Toda consulta de datos pasa por `src/lib/acceso.ts` (autorización en servidor).
- Fechas de calendario como texto `YYYY-MM-DD` en Europe/Madrid (`src/lib/fechas.ts`); importes como texto decimal (`src/lib/dinero.ts`). Lo desconocido queda pendiente (NULL), nunca inventado.
- Integraciones externas (push, correo, IA) sin credenciales: mostrar «sin configurar», nunca simular.
- Comprobaciones: `npm run lint && npm run typecheck && npm test && npm run build`; interfaz con `npx playwright test` sobre la demo sintética.
