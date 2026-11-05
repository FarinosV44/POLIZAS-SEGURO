# Siniestros, lectura de documentos y renegociación (#7, #2, #6)

## Asistente de siniestros (#7)

1. **Expediente**: relato libre, fecha del hecho y de conocimiento, lugar, bien afectado, daños, terceros, importe y pruebas; fotos, partes y comunicaciones en el almacén privado.
2. **Póliza y anualidad**: se asocian una o varias pólizas candidatas del mismo titular (nunca de otro). Para cada una se elige automáticamente la anualidad **vigente el día del hecho** (`[inicio, vencimiento)`), aunque la póliza se haya renovado después. Si hay varias o ninguna, se pide a la persona que la elija.
3. **Antes de analizar** se muestra qué documentos se usarán (condiciones particulares, generales, suplementos y renovaciones de esa anualidad, más los de la póliza sin anualidad asignada, avisando) y qué falta. Sin fecha del hecho, sin póliza, sin anualidad o sin documentos, el análisis no se lanza.
4. **Análisis** (proveedor de IA, salida estructurada forzada): hechos facilitados, garantías potencialmente aplicables, límites y franquicias, exclusiones y condiciones, plazo de comunicación si consta, datos y documentos que faltan, próximos pasos, advertencias y borrador.
   - Valoraciones: **cobertura posible**, **aparentemente excluido** o **información insuficiente**, siempre con el aviso de que no es una garantía.
   - **Cada afirmación contractual lleva cita** (documento, página, cláusula y texto literal). La aplicación **comprueba cada cita contra el texto real de la página del PDF**: «comprobada», «no aparece en el documento», «referencia inexistente» o «documento escaneado: compruébala». Lo que no tiene cita comprobable se marca como no rastreable y, si ninguna garantía es rastreable, la valoración baja a «información insuficiente».
   - Separa texto contractual (cita), interpretación y hechos.
   - Fechas e importes del borrador que no figuran en lo escrito por la persona ni en la póliza se señalan para revisarlos.
   - Documentos y relato se tratan como **datos**: el sistema lo indica expresamente al modelo y las instrucciones incrustadas se ignoran y se señalan (prueba con condiciones sintéticas que incluyen una orden maliciosa).
   - No se citan normas ni plazos legales: si algo depende de la ley, se indica como duda.
5. **Versiones**: cada análisis es una versión nueva e inmutable con la lista exacta de documentos usados. Nueva documentación → volver a analizar sin perder los anteriores.
6. **Comunicación**: borrador editable y versionado (del asistente, de la **plantilla sin IA** que solo ordena los datos escritos, o manual), con botón de copiar. **La aplicación no envía nada a la aseguradora.**
7. **Seguimiento**: estados (borrador, comunicado, en tramitación, documentación solicitada, aceptado, rechazado, cerrado), referencia del asegurador, plazo de comunicación **solo con su fuente**, notas, comunicaciones y pagos.

Sin `ANTHROPIC_API_KEY` el expediente, los archivos, la plantilla y el seguimiento funcionan igual y el análisis aparece como «Asistente con IA sin configurar». Nunca se simula un análisis.

## Lectura de documentos (#2)

- Al subir un PDF se extrae su texto por página (sirve para verificar citas). Escaneados e imágenes los lee la IA de forma visual.
- «Leer datos» encola la lectura; el documento pasa por **pendiente → leyendo → datos por revisar → confirmados / lectura fallida**. El worker reintenta hasta 3 veces.
- La pantalla de revisión muestra **el original junto a la propuesta**: cada dato con su página, cita, confianza y si la cita aparece en el documento. Fechas imposibles, importes ilegibles o vencimientos anteriores al inicio no se proponen o se marcan con confianza baja.
- La persona marca qué confirma y puede corregir cada valor. **Nada se aplica sin confirmación** y una relectura nunca sobrescribe lo confirmado: solo propone.
- Garantías, exclusiones, franquicias y capitales confirmados aparecen en la pestaña **Condiciones** de la póliza, enlazados a su página.
- Si la lectura falla o la IA no está configurada: «Introducir a mano».

## Renegociación (#6)

- Desde un aviso («Empezar a renegociar») o desde la póliza («Renegociar») se abre el expediente de la anualidad.
- Estados: pendiente, contactado, ofertas recibidas, decisión pendiente, renovada, sustituida, baja confirmada.
- Evolución de la prima (variación absoluta y porcentual) y siniestros registrados en el periodo.
- **Ofertas** con prima, impuestos, garantías, capitales, franquicias, exclusiones, vigencia y documento. La comparación marca **más barata/más cara**, **franquicia superior**, **exclusión nueva**, **garantía que no figura** y **datos desconocidos**: más barata nunca se presenta como equivalente.
- **Borrador para el mediador** con datos confirmados; generarlo no cambia el estado ni desactiva los avisos.
- **Decisión**: renovar (anualidad nueva; la anterior y sus documentos se conservan), cambiar de compañía (póliza nueva enlazada; la anterior queda «sustituida») o baja confirmada. Los avisos se recalculan al momento. No se envían mensajes ni se ordenan bajas.
- La fecha límite de oposición se muestra con su fuente y estado de comprobación; posponer tareas no la cambia.

## Qué se envía al proveedor de IA

Solo al pulsar «Analizar» o «Leer datos»: el relato y los datos del siniestro, los datos básicos de las pólizas asociadas y los documentos indicados en pantalla (o el documento que se lee). Nada más: ni otros titulares, ni otras pólizas, ni datos de usuarios. Detalles y retención en `docs/SEGURIDAD.md`.
