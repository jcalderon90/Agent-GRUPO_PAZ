# Índice - Proyecto Isabella

## Descripción General
Definido para la propuesta de agente de ventas Isabella de RedTec para Grupo Paz.

## Estado del Proyecto
**Última actualización:** 14 de Julio, 2026

| Aspecto | Estado |
|---|---|
| Propuesta comercial | Enviada (PR-2026-GP01, válida hasta 25-jul-2026) |
| Bloqueador CRM Celina | Pendiente – credenciales de solo lectura escaladas a TI por Jhon (Celina); sigue sin resolverse |
| Stack tecnológico | **Decidido (cerrado 13-jul-2026)** – TypeScript/Node + LangGraph.js + Postgres/pgvector, multi-tenant vía JWT, sobre el template Garoo existente (`redtec-realstate-api`/`-ux`); reemplaza la vía Python planteada inicialmente en `08_investigacion_tecnologias.md` (ver nota de actualización ahí y §5 de `09_revision_codigo_agent.md`) |
| Proveedor LLM | **Decidido** – OpenRouter (`OPENROUTER_API_KEY` + `CLAUDE_MODEL=anthropic/claude-sonnet-4.6`), no Anthropic directo; el código ya soportaba ambos, solo se fijó la config |
| Plataforma unificada (`realstate.redtec.ai`) | En arranque – repositorio base a cargo de Jimmi Pachón y Jorge Calderón |
| Repos `redtec-realstate-api` / `-ux` (Garoo, TypeScript/LangGraph) | **Adoptados como base de Isabella.** Motor genérico multi-tenant maduro (webhook multi-canal vía ManyChat, PDFs, colas); tenant `grupopaz` ya seedeado. **Capa de negocio de Isabella ya implementada**: 7 tools (`buscar_lotes`, `detalle_lote`, `consultar_financiamiento`, `generar_imagen_mapa`, `generar_cotizacion_pdf`, `registrar_lead`, `escalar_a_humano`), `system_prompt` con flujo de 6 pasos, `CelinaClient` mock+http (ver `09_revision_codigo_agent.md` §7). `npm run typecheck` limpio |
| Integración CRM Celina | **Código listo en modo mock** (`CELINA_MODE=mock`, datos de ejemplo); implementación `http` real ya escrita pero inactiva — depende de la resolución del bloqueador de credenciales para activarse y validarse contra staging |
| Modelo de sincronización con Celina | **Decidido (14-jul-2026)** – se descartan Polling/Webhooks/Bidireccional (`02_crm_celina.md`); se mantiene el modelo ya implementado de consulta directa en el momento (sin copia local), para lectura y a futuro para escritura de leads. Ver `07_tarea_bloqueadora.md` |
| Prueba end-to-end del agente | **Exitosa (13-jul-2026)** – smoke test `src/scripts/smoke_test_isabella.ts` corrido con `OPENROUTER_API_KEY` real: los 6 turnos completaron el flujo completo (calificación → búsqueda → detalle → mapa → financiamiento → cotización PDF) y `registrar_lead` guardó correctamente `budget`, `purpose`, `selected_lot_id`, `selected_plan_years`. Nota técnica: hubo que correr con `node --env-file=.env` porque el proyecto no usa `dotenv` y `tsx` no carga `.env` solo |
| Repo `redtec-realstate-ux` (dashboard) | **Revisado.** Avanzó 30 commits desde la última revisión (ya sincronizado con `origin/main`): paneles de superadmin, roster completo de agentes (Isabella, Sofi, Arturo, Daniel, Walter, Marco), login público + demo/Stripe, planes de financiamiento/pagos, gestión de usuarios. Sigue siendo genérico — Isabella aparece solo como tarjeta del roster, **sin UI específica de lotes/CRM Celina** |
| Documentos pendientes | Ninguno — `06_condiciones_servicio.md` y `07_tarea_bloqueadora.md` redactados (14-jul-2026, en borrador; `06` tiene montos/SLA sin definir) |

## Pendientes

- **Bloqueador CRM Celina** — credenciales read-only escaladas a TI por Jhon (Celina), sin fecha de resolución. Bloquea activar `CELINA_MODE=http` y validar `celina.http.ts` contra staging.
- **Reemplazar placeholders de mapa/PDF** (`src/assets/maps.ts`, `src/assets/quotes.ts`, ambos con `mock://...`) por las capturas estáticas reales del mapa y la plantilla PDF oficial de Celina, una vez resuelto el bloqueador.
- **Activar escritura de leads en CRM Celina** — confirmado (13-jul-2026): `xx_clients` es solo la tabla interna del template Garoo (persistencia local), no un CRM externo. Aclarado con Jorge: **"CRM Grupo Paz" y "CRM Celina" son el mismo sistema** — no hace falta un `LeadsClient`/API nuevo. Cuando se resuelva el bloqueador de credenciales y se habiliten permisos de escritura, el camino es extender `celina.http.ts` para usar `/lead` y `/editlead` (ya listados en `CLAUDE.md` como "Write (future)"), y que `registrar_lead` escriba ahí además de/en vez de `xx_clients`.
- **UI específica de Isabella pendiente en `redtec-realstate-ux`** — el dashboard ya tiene roster/paneles genéricos maduros, pero nada que muestre lotes, mapa estático o cotizaciones de Celina; evaluar si hace falta una vista propia o si el flujo vive solo en WhatsApp/Instagram/Messenger.

## Índice de Archivos

- [01_propuesta.md](#01propuesta.md) – Detalles comerciales de la propuesta RedTec
- [02_crm_celina.md](#02crm_celina.md) – Resumen técnico de integración con CRM Celina
- [03_reunion.md](#03reunion.md) – Reunión del 26 de junio de 2026 (asuntos bloqueadores)
- [04_proceso_ventas.md](#04proceso_ventas.md) – Flujo y pasos del ciclo de ventas de Isabella
- [05_plan_desarrollo_codigo.md](#05plan_desarrollo_codigo.md) – Plan de desarrollo del código del agente sobre el template Garoo
- [06_condiciones_servicio.md](#06condiciones_servicio.md) – Condiciones de servicio y modelo de pago (borrador, montos/SLA pendientes)
- [07_tarea_bloqueadora.md](#07tarea_bloqueadora.md) – Próximos pasos y tarea bloqueadora principal
- [08_investigacion_tecnologias.md](#08investigacion_tecnologias.md) – Investigación de stack tecnológico (LangGraph, Postgres, multi-tenant) para la plataforma unificada de agentes
- [09_revision_codigo_agent.md](#09revision_codigo_agent.md) – Revisión de la carpeta local `Agent/` (template Garoo TypeScript/LangGraph) y su relación con el stack decidido

## Notas Importantes para LLM/AI/Especialistas
- Uso de capas y protección de IP en la API
- Lis tener conocimiento sobre APIs protobuf
- Agente de ventas multi‑canal (WhatsApp, Instagram, Facebook Messenger, etc.)
- Procesos de reservación y selección de lotes en mapa
- Producción de documentos de cotización en PDF
- Liderazgo de un proceso desde lead hasta cierre
- Integración con CRM Celina y KOMMO
- Plataformas de webhook: Celina CRM e Isabella de RedTec
- Suscripción SaaS y modelo de fee mensual con setup
- Creencias: flexibilidad frente a bloqueo de proyecto por credenciales de API
- Integración continua para prueba y producción en plataforma multi‑agente
- Determinación: accesos de red de solo lectura y atravesado de múltiples capas de seguridad
- Utilizar maquetación centrada en contenido y amigable para LLM
- Etiquetar archivos con prefijos numéricos para orden cronológico
- Usar `XXXX_` (número + underscore) para identificación de archivos consistente con prácticas de ingeniería de software populares