# Índice - Proyecto Isabella

## Descripción General
Definido para la propuesta de agente de ventas Isabella de RedTec para Grupo Paz.

## Estado del Proyecto
**Última actualización:** 13 de Julio, 2026

| Aspecto | Estado |
|---|---|
| Propuesta comercial | Enviada (PR-2026-GP01, válida hasta 25-jul-2026) |
| Bloqueador CRM Celina | Pendiente – credenciales de solo lectura escaladas a TI por Jhon (Celina); sigue sin resolverse |
| Stack tecnológico | **Decidido (cerrado 13-jul-2026)** – TypeScript/Node + LangGraph.js + Postgres/pgvector, multi-tenant vía JWT, sobre el template Garoo existente (`redtec-realstate-api`/`-ux`); reemplaza la vía Python planteada inicialmente en `08_investigacion_tecnologias.md` (ver nota de actualización ahí y §5 de `09_revision_codigo_agent.md`) |
| Proveedor LLM | **Decidido** – OpenRouter (`OPENROUTER_API_KEY` + `CLAUDE_MODEL=anthropic/claude-sonnet-4.6`), no Anthropic directo; el código ya soportaba ambos, solo se fijó la config |
| Plataforma unificada (`realstate.redtec.ai`) | En arranque – repositorio base a cargo de Jimmi Pachón y Jorge Calderón |
| Repos `redtec-realstate-api` / `-ux` (Garoo, TypeScript/LangGraph) | **Adoptados como base de Isabella.** Motor genérico multi-tenant maduro (webhook multi-canal vía ManyChat, PDFs, colas); tenant `grupopaz` ya seedeado. **Capa de negocio de Isabella ya implementada**: 7 tools (`buscar_lotes`, `detalle_lote`, `consultar_financiamiento`, `generar_imagen_mapa`, `generar_cotizacion_pdf`, `registrar_lead`, `escalar_a_humano`), `system_prompt` con flujo de 6 pasos, `CelinaClient` mock+http (ver `09_revision_codigo_agent.md` §7). `npm run typecheck` limpio |
| Integración CRM Celina | **Código listo en modo mock** (`CELINA_MODE=mock`, datos de ejemplo); implementación `http` real ya escrita pero inactiva — depende de la resolución del bloqueador de credenciales para activarse y validarse contra staging |
| Prueba end-to-end del agente | **En curso** – smoke test `src/scripts/smoke_test_isabella.ts` en `Agent/redtec-realstate-api` (TenantDb en memoria, sin Postgres real, 6 turnos simulados); pendiente que Jorge lo corra con su `OPENROUTER_API_KEY` y comparta el resultado |
| Repo `redtec-realstate-ux` (dashboard) | **Revisado.** Avanzó 30 commits desde la última revisión (ya sincronizado con `origin/main`): paneles de superadmin, roster completo de agentes (Isabella, Sofi, Arturo, Daniel, Walter, Marco), login público + demo/Stripe, planes de financiamiento/pagos, gestión de usuarios. Sigue siendo genérico — Isabella aparece solo como tarjeta del roster, **sin UI específica de lotes/CRM Celina** |
| Documentos pendientes | `06_condiciones_servicio.md`, `07_tarea_bloqueadora.md` |

## Pendientes

- **Correr el smoke test con LLM real** — Jorge debe poner su `OPENROUTER_API_KEY` en `Agent/redtec-realstate-api/.env` y ejecutar `npx tsx src/scripts/smoke_test_isabella.ts`; revisar juntos la salida (respuestas del agente + campos que `registrar_lead` guardó).
- **Bloqueador CRM Celina** — credenciales read-only escaladas a TI por Jhon (Celina), sin fecha de resolución. Bloquea activar `CELINA_MODE=http` y validar `celina.http.ts` contra staging.
- **Reemplazar placeholders de mapa/PDF** (`src/assets/maps.ts`, `src/assets/quotes.ts`, ambos con `mock://...`) por las capturas estáticas reales del mapa y la plantilla PDF oficial de Celina, una vez resuelto el bloqueador.
- **Confirmar `xx_clients` como CRM real de Grupo Paz** — verificar que la tool `registrar_lead` escribe donde realmente vive el CRM de Grupo Paz (no solo una tabla interna del template).
- **Redactar documentos pendientes:** `06_condiciones_servicio.md` (condiciones de servicio y modelo de pago) y `07_tarea_bloqueadora.md` (próximos pasos y tarea bloqueadora principal).
- **Decisión sin resolver:** definir modelo de sincronización con Celina — Polling vs. Webhooks vs. Bidireccional (ver `02_crm_celina.md`) — antes de construir la integración `http` real.
- **UI específica de Isabella pendiente en `redtec-realstate-ux`** — el dashboard ya tiene roster/paneles genéricos maduros, pero nada que muestre lotes, mapa estático o cotizaciones de Celina; evaluar si hace falta una vista propia o si el flujo vive solo en WhatsApp/Instagram/Messenger.

## Índice de Archivos

- [01_propuesta.md](#01propuesta.md) – Detalles comerciales de la propuesta RedTec
- [02_crm_celina.md](#02crm_celina.md) – Resumen técnico de integración con CRM Celina
- [03_reunion.md](#03reunion.md) – Reunión del 26 de junio de 2026 (asuntos bloqueadores)
- [04_proceso_ventas.md](#04proceso_ventas.md) – Flujo y pasos del ciclo de ventas de Isabella
- [05_arquitectura_integracion.md](#05arquitectura_integracion.md) – Escenarios técnicos para integración
- [06_condiciones_servicio.md](#06condiciones_servicio.md) – Condiciones de servicio y modelo de pago
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