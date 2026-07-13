# Revisión de Código – Carpeta `Agent/` (Template Garoo)

**Fecha:** 09 de Julio, 2026 (actualizado 13 de Julio, 2026)
**Origen:** Revisión técnica de la carpeta local `Agent/` (no versionada en este repositorio; agregada a `.gitignore`).
**Objetivo:** Documentar qué contiene `Agent/`, su relación con Isabella y el estado real de avance frente a lo planificado en `05_plan_desarrollo_codigo.md` y `08_investigacion_tecnologias.md`.

> **Actualización 13-jul-2026:** revisión más profunda de `redtec-realstate-api` (clonado directamente desde `github.com/GarooInc/redtec-realstate-api`, junto con `redtec-realstate-ux`). Confirma y amplía los hallazgos del 09-jul; ver sección 6.

## 1. Qué es

`Agent/` no es código propio de Isabella/Grupo Paz: son **dos repositorios git independientes del template genérico de Garoo** (`garoo-api-template` y `garoo-ux-template`, según sus `package.json`), usados como punto de partida para varios clientes (README menciona MundoVerde, GrupoAlthura, ReservasFicohsa). No contiene todavía personalización de Grupo Paz/Celina.

| Subcarpeta | Stack | Rol |
|---|---|---|
| `redtec-realstate-api` | Express 5 + TypeScript + PostgreSQL + Zod + JWT/bcrypt + pgvector | Backend multi-tenant (pools por tenant), webhook de ManyChat con debounce, RAG |
| `redtec-realstate-ux` | Next.js 15 + Tailwind v4 + DaisyUI + Recharts | Dashboard mobile-first (contactos, conversaciones, config de agente), auth por cookie httpOnly |

## 2. Hallazgo clave: discrepancia de stack

El template encontrado está en **TypeScript + LangGraph** (`langgraph_agent.ts`, JS puro), no en **Python + LangGraph**, que es el stack formalmente decidido en `08_investigacion_tecnologias.md` (reunión del 06-jul-2026, liderado por Jimmi Pachón). Es decir, el código base disponible hoy corresponde al patrón TypeScript que el equipo acordó **congelar y no seguir replicando**, no a la nueva plataforma unificada en Python planeada.

## 3. Componentes revisados

- **`langgraph_agent.ts`** (sí existe, en `src/services/`): agente real construido con `StateGraph` de LangGraph, dos tools (`search_knowledge` para RAG, `save_contact_data` para captura de lead), modelo intercambiable Claude/OpenRouter, función `runLangGraphAgent()` que carga historial/config por tenant y persiste mensajes. Es genérico ("Sofía, asesora inmobiliaria" de ejemplo) — sin nombre, prompts ni tools de Isabella/Celina.
- **`agent.ts`**: documentado en `AGENTS.md` (loop de tool-use con Claude SDK directo) pero **no existe en el árbol de archivos** — referenciado desde `webhook.ts`/`index.ts` sin implementación real. Indica desincronización entre documentación y código del template.
- **`celina.ts` / integración CRM Celina**: **no existe**. No hay ningún archivo ni lógica real de integración con el CRM Celina descrito en `02_crm_celina.md`. La única coincidencia es un nombre similar sin relación en `AgentDashboard.tsx`.

## 4. Estado general

Boilerplate funcional pero genérico, en etapa de andamiaje (multi-tenant, RAG, webhook async ya resueltos a nivel de infraestructura), **sin** la capa de negocio de Isabella: sin prompts/persona, sin tools de CRM Celina, sin flujo de 6 pasos (`04_proceso_ventas.md`), sin `CelinaClient` mock/http descrito en `05_plan_desarrollo_codigo.md`.

## 5. Implicación para el plan

1. Definir si Grupo Paz continúa sobre este template TypeScript (`Agent/`) como base rápida, o se espera al repositorio Python + LangGraph decidido en `08_investigacion_tecnologias.md` — hoy ambas rutas coexisten sin resolución explícita.
2. Si se usa `Agent/` como base: completar `agent.ts` o consolidar todo en `langgraph_agent.ts`, e implementar `CelinaClient` (mock primero, por el bloqueo de credenciales) siguiendo el diseño ya de `05_plan_desarrollo_codigo.md`.
3. Mantener `Agent/` fuera de este repositorio de documentación (ya en `.gitignore`); si se decide adoptarlo, debe vivir en su propio repositorio versionado, no dentro de `Agent-GRUPO_PAZ`.

## 6. Revisión ampliada (13-jul-2026)

Repositorios clonados directamente de GitHub (`GarooInc/redtec-realstate-api` y `-ux`) para inspección más profunda del código fuente (`src/`), no solo de `AGENTS.md`.

**El template avanzó desde la revisión del 09-jul** — ya no son solo 2 tools genéricos, sino 5 tools reales de negocio en `langgraph_agent.ts`: `search_knowledge` (RAG), `save_contact_data`, `send_document` (envío de PDF/imagen ya cargado vía ManyChat/WhatsApp), `create_appointment` (agenda cita + actualiza `stage` del lead en CRM propio), `send_quote_email` (genera PDF de cotización con `quotePdf.ts` y lo envía por Resend). El grafo sigue siendo el patrón ReAct simple (`agent → tools → agent`) de LangGraph.

**Multi-canal confirmado pero indirecto:** WhatsApp/Instagram/Facebook se detectan en `api/routes/webhook.ts` a partir de payloads de **ManyChat**, no de integraciones nativas Meta — es decir, todo pasa por ManyChat como intermediario, no hay conexión directa a las APIs de WhatsApp Business/Instagram/Messenger.

**Multi-tenant ya apunta a Grupo Paz:** `src/index.ts` sembrando el usuario admin busca explícitamente el tenant con slug `'grupopaz'` en `ra_tenants` — señal de que el onboarding de Grupo Paz como tenant ya arrancó a nivel de infraestructura, aunque sin personalización de Isabella todavía (sin su `system_prompt`, sin tools de Celina).

**Confirmado — sigue sin existir:**
- Cualquier cliente HTTP hacia `stagingcrmapi.celina.com.bo` (`CelinaClient` o similar).
- El concepto de "lote" en el modelo de datos: `schema.sql` solo tiene `xx_projects`/`xx_units` (unidad genérica: código, nombre, tipo, precio), sin campos de manzana/lote, m², ni posición en plano — no alcanza para representar un lote de Celina ni para generar el recorte de mapa estático que exige la regla de negocio (nunca enviar el link del mapa interactivo).
- Seed del `system_prompt`/personalidad de Isabella para el tenant `grupopaz`.

**Conclusión:** el motor genérico (multi-tenant, RAG, colas, webhook, PDFs, email) sigue madurando y hoy es más capaz que en la revisión anterior, pero la capa de negocio específica de Isabella/Celina (CRM, lotes, mapa, persona) continúa en cero — coherente con que el bloqueador de credenciales de Celina sigue sin resolverse.

*Documento confidencial*
