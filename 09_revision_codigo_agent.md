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

1. **Decisión cerrada (13-jul-2026): se adopta el template TypeScript (`Agent/`, `redtec-realstate-api`/`-ux`) como base de Isabella**, en lugar de levantar el repositorio Python + LangGraph propuesto en `08_investigacion_tecnologias.md`. Esa decisión de stack queda superada en cuanto al lenguaje/framework de orquestación (ver nota en `08_investigacion_tecnologias.md` §1); el resto de las recomendaciones de esa investigación (Postgres, RLS multi-tenant por `tenant_id`, JWT, pgvector) sigue aplicando porque el template ya las implementa en TypeScript.
2. Completar `agent.ts` o consolidar todo en `langgraph_agent.ts`, e implementar `CelinaClient` (mock primero, por el bloqueo de credenciales) siguiendo el diseño de `05_plan_desarrollo_codigo.md`.
3. Mantener `Agent/` fuera de este repositorio de documentación (ya en `.gitignore`); vive en su propio repositorio versionado (`redtec-realstate-api`/`-ux`), no dentro de `Agent-GRUPO_PAZ`.

## 6. Revisión ampliada (13-jul-2026)

Repositorios clonados directamente de GitHub (`GarooInc/redtec-realstate-api` y `-ux`) para inspección más profunda del código fuente (`src/`), no solo de `AGENTS.md`.

**El template avanzó desde la revisión del 09-jul** — ya no son solo 2 tools genéricos, sino 5 tools reales de negocio en `langgraph_agent.ts`: `search_knowledge` (RAG), `save_contact_data`, `send_document` (envío de PDF/imagen ya cargado vía ManyChat/WhatsApp), `create_appointment` (agenda cita + actualiza `stage` del lead en CRM propio), `send_quote_email` (genera PDF de cotización con `quotePdf.ts` y lo envía por Resend). El grafo sigue siendo el patrón ReAct simple (`agent → tools → agent`) de LangGraph.

**Multi-canal confirmado pero indirecto:** WhatsApp/Instagram/Facebook se detectan en `api/routes/webhook.ts` a partir de payloads de **ManyChat**, no de integraciones nativas Meta — es decir, todo pasa por ManyChat como intermediario, no hay conexión directa a las APIs de WhatsApp Business/Instagram/Messenger.

**Multi-tenant ya apunta a Grupo Paz:** `src/index.ts` sembrando el usuario admin busca explícitamente el tenant con slug `'grupopaz'` en `ra_tenants` — señal de que el onboarding de Grupo Paz como tenant ya arrancó a nivel de infraestructura, aunque sin personalización de Isabella todavía (sin su `system_prompt`, sin tools de Celina).

**Confirmado — sigue sin existir:**
- Cualquier cliente HTTP hacia `stagingcrmapi.celina.com.bo` (`CelinaClient` o similar).
- El concepto de "lote" en el modelo de datos: `schema.sql` solo tiene `xx_projects`/`xx_units` (unidad genérica: código, nombre, tipo, precio), sin campos de manzana/lote, m², ni posición en plano — no alcanza para representar un lote de Celina ni para generar el recorte de mapa estático que exige la regla de negocio (nunca enviar el link del mapa interactivo).
- Seed del `system_prompt`/personalidad de Isabella para el tenant `grupopaz`.

**Conclusión (13-jul-2026, ya superada — ver §7):** el motor genérico (multi-tenant, RAG, colas, webhook, PDFs, email) sigue madurando y hoy es más capaz que en la revisión anterior, pero la capa de negocio específica de Isabella/Celina (CRM, lotes, mapa, persona) continúa en cero — coherente con que el bloqueador de credenciales de Celina sigue sin resolverse.

## 7. Capa de negocio de Isabella completada (actualización posterior)

Contradice la conclusión de §6: la capa de negocio específica ya está implementada en `src/` (no solo el motor genérico):

- **`src/crm/`** — `celina.ts` (interfaz `CelinaClient` + factory `getCelinaClient()` según `env.CELINA_MODE`), `celina.mock.ts` (5 lotes de ejemplo con filtrado por precio/zona/superficie/estado, cálculo de planes de financiamiento), `celina.http.ts` (implementación real read-only contra staging, inactiva hasta credenciales), `auth.ts` (login JWT con caché de token), `models.ts` (`Lot`, `FinancingPlan`, `Quotation`, `LotSearchFilters`, `Lead`).
- **`src/services/isabella_prompt.ts`** — `system_prompt` con el flujo de 6 pasos de `04_proceso_ventas.md`, con la regla del mapa estático explícita.
- **`src/services/langgraph_agent.ts`** — 7 tools de negocio: `buscar_lotes`, `detalle_lote`, `consultar_financiamiento`, `generar_imagen_mapa` (nunca expone el link del mapa interactivo), `generar_cotizacion_pdf`, `registrar_lead` (escribe en `xx_clients`, CRM propio de Grupo Paz, no Celina), `escalar_a_humano`.
- **`src/assets/maps.ts` / `quotes.ts`** — placeholders (`mock://...`) para imagen de mapa y cotización, a la espera de las capturas reales del proyecto y de la plantilla PDF oficial de Celina.
- Todo con `CELINA_MODE=mock` (default) por el bloqueador de credenciales aún vigente; swap a `http` es solo cambiar la env var una vez lleguen.
- `npm run typecheck` compila limpio.

**Pendiente real:** probar el flujo completo end-to-end (requiere Postgres + API key, no configurado todavía en este entorno — no hay `.env`); reemplazar los placeholders de mapa/PDF por assets reales cuando Celina entregue credenciales o capturas; conectar `registrar_lead` con el CRM Grupo Paz real si `xx_clients` no es ya ese sistema.

*Documento confidencial*
