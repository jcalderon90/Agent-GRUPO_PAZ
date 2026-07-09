# Plan de Desarrollo en Código – Isabella

**Fecha:** 1 de Julio, 2026
**Estado:** Plan en construcción (definición incremental, paso a paso)
**Objetivo:** Construir Isabella (agente de IA de ventas) **en código, sin n8n**.

*Documento confidencial – uso interno de Grupo Paz y RedTec/Garoo.*

---

## 📌 Estado actual

**Decidido:**

| Paso | Decisión | Estado |
|---|---|---|
| Paso 1 | Lenguaje **TypeScript/Node** + motor de agente con **loop de tool-use propio**, usando **OpenRouter** (`https://openrouter.ai/api/v1`) vía SDK `openai`, con tool-calling en formato OpenAI. Modelo **configurable por variable de entorno** (`OPENROUTER_MODEL`), sin fijar uno todavía. Descartados LangChain (peso/opacidad) y LangGraph (abstracción prematura; se puede envolver luego). | ✅ (revisado 2026-07-02) |
| Paso 2 | Toolchain: Node + `tsx` + `vitest` + `zod`, módulos **ESM**. Estructura de carpetas fijada. | ✅ |
| Paso 3 | Tipos del dominio (`Lot`, `FinancingPlan`, `Quotation`) y `ConversationState`/`Lead`. | 🔶 En curso |

**Decisiones pendientes del Paso 3:**
1. Moneda de los precios: USD, BOB, o ambos (propuesta: USD).
2. Persistir la `etapa` del funnel en el estado (propuesta: sí).
3. Historial como texto simple ahora vs formato `messages` de Anthropic (propuesta: texto simple ahora).

**Próximos pasos:** Paso 4 = interfaz `CelinaClient` + `CelinaMockClient`. Paso 5 = tools + dispatch. Paso 6 = `SYSTEM_PROMPT` + engine. Paso 7 = `CLIChannel`. Paso 8 = tests + verificación.

---

## Contexto

Lo que se construye es, en esencia, un **agente de IA**: un LLM (Claude) que mantiene una conversación de ventas, califica al prospecto, razona sobre el flujo de 6 pasos (ver `04_proceso_ventas.md`) y ejecuta **herramientas** que consultan el CRM Celina y producen entregables (imagen del mapa, cotización PDF).

Restricción actual: las **credenciales read-only del CRM Celina están bloqueadas** (en escalamiento a TI de Celina; ver `03_reunion.md`). Para no detener el desarrollo, las herramientas se construyen contra una **interfaz `CelinaClient`** con una implementación **mock** (datos de ejemplo) y una implementación **HTTP real** lista para activar cuando lleguen las credenciales.

Reglas de negocio que el diseño respeta:
- **Nunca** enviar el enlace al mapa interactivo interno → siempre **imagen estática PNG/JPG** con el lote resaltado + ficha técnica.
- CRM Celina en **solo lectura**; los leads se escriben en el **CRM Grupo Paz** (sistema distinto).
- Cotización = **PDF** con plantilla oficial del CRM (`/lot_quotation` + `/search/pdf_*`).
- Multicanal: WhatsApp, Instagram DM, Facebook Messenger (los tres son plataformas Meta → un solo webhook a futuro).
- Reserva (`/lots/create_reservation_code`) es **futuro**, fuera del MVP.
- Idioma: **español**.

## Arquitectura

Cinco capas desacopladas, comunicadas por interfaces:

```
Canal (CLI ahora / Meta después)
        │  texto, imágenes, documentos
        ▼
Agente (loop Claude + tool-use)  ──usa──►  Estado de conversación (por hilo)
        │
        ▼
Herramientas (buscar_lotes, financiamiento, imagen_mapa, cotizacion_pdf, lead, escalar)
        │
        ▼
Clientes CRM  ──►  CelinaClient (mock | http)   +   LeadsClient (Grupo Paz, mock | http)
```

## Estructura de directorios (TypeScript / ESM)

```
src/
  config.ts              # env vars (OPENROUTER_API_KEY, OPENROUTER_MODEL, CELINA_BASE_URL, flags) validadas con zod
  index.ts               # entrypoint del CLI de chat
  agent/
    engine.ts            # loop de tool-use con SDK `openai` apuntando a OpenRouter (baseURL)
    prompts.ts           # SYSTEM_PROMPT (persona + flujo 6 pasos + reglas de negocio)
    tools.ts             # definición de tools (JSON schema vía zod) + dispatch a handlers
  state/
    conversation.ts      # ConversationState (lead, score hot/warm/cold, lote/plan elegido, historial)
    store.ts             # ConversationStore (en memoria; interfaz para DB luego)
  crm/
    celina.ts            # interfaz CelinaClient: searchLots, getLot, financing, yearsFinancing, quotationPdf
    celina.mock.ts       # CelinaMockClient con datos de ejemplo (lotes, financiamiento)
    celina.http.ts       # CelinaHttpClient: auth JWT, rate-limit, read-only (inactivo hasta credenciales)
    auth.ts              # login /auth/login, cache de token, placeholder MFA
    leads.ts             # LeadsClient (CRM Grupo Paz): registerLead / updateLead (mock + http)
    models.ts            # tipos/zod: Lot, FinancingPlan, Quotation, Lead
  assets/
    maps.ts              # imagen del mapa con lote resaltado + ficha técnica (sharp/canvas)
    quotes.ts            # fallback local de PDF; real usa /lot_quotation + /search/pdf_*
  channels/
    channel.ts           # interfaz Channel: receive(), sendText(), sendImage(), sendDocument()
    cli.ts               # CLIChannel (terminal)
    meta.ts              # scaffold adaptador Meta (WhatsApp/IG/Messenger) — no funcional en MVP
tests/
  tools.test.ts          # tools contra CelinaMockClient (vitest)
  state.test.ts          # transiciones de estado / scoring
  agent.smoke.test.ts    # smoke del loop con el SDK mockeado
package.json             # deps: openai, zod, sharp; dev: tsx, vitest, typescript, @types/node
tsconfig.json            # ESM, strict
.env.example             # variables sin secretos reales
README_DEV.md            # cómo correr el CLI, variables, estado del CRM
```

## Detalle de componentes

### 1. Agente — `agent/engine.ts`, `agent/prompts.ts`, `agent/tools.ts`
- `SYSTEM_PROMPT` codifica: persona de Isabella (asesora de ventas de Celina), el **flujo de 6 pasos** y las **reglas de negocio** (nunca link del mapa; usar imagen estática; PDF con plantilla; escalar a humano cuando lo pidan; español).
- `engine.ts`: recibe el turno del usuario + `ConversationState`, llama al modelo (vía OpenRouter) con las tools en formato OpenAI, ejecuta el bucle `tool_calls → tool result` hasta que el modelo produce texto final. Devuelve texto + adjuntos (imagen/PDF) que el canal enviará.
- `tools.ts`: schema de cada tool (vía zod, convertido a JSON schema estilo OpenAI) y `dispatch(name, input, ctx)` que enruta al cliente CRM / assets y **actualiza el estado**.

### 2. Herramientas (mapeadas a endpoints)
| Tool | Acción | Endpoint / origen |
|---|---|---|
| `buscar_lotes` | filtra por precio/superficie/ubicación/estado → 3-5 lotes | `GET /lots/search`, `/lots/search/all` |
| `detalle_lote` | ficha de un lote | `GET /lot/:id` |
| `consultar_financiamiento` | cuota inicial, mensual, plazo, tasa | `/lots/financing`, `/years_financing` |
| `generar_imagen_mapa` | PNG del proyecto con el lote resaltado + ficha | `assets/maps.ts` (mapas estáticos que entregará Celina) |
| `generar_cotizacion_pdf` | PDF de cotización | `/lot_quotation` + `/search/pdf_*` (fallback `assets/quotes.ts`) |
| `registrar_lead` / `actualizar_lead` | escribe en CRM Grupo Paz con score | `crm/leads.ts` (write) |
| `escalar_a_humano` | handoff con resumen | marca estado + notifica canal |

### 3. Clientes CRM — `crm/`
- `CelinaClient` (interfaz) para que agente/tools no dependan de la implementación. `CelinaMockClient` devuelve lotes/planes de ejemplo coherentes con los estados `disponible/reservado/vendido`. `CelinaHttpClient` implementa auth JWT (`crm/auth.ts`), respeta el rate-limit (100/window) y es **read-only**. Se selecciona mock vs http por flag en `config.ts`.
- `LeadsClient` separado para el **CRM Grupo Paz** (escritura de leads), también con mock + http.

### 4. Estado — `state/`
- `ConversationState`: datos del lead (presupuesto, zona, uso, plazo, familia), `score` (hot/warm/cold), lotes presentados, lote y plan seleccionados, historial de mensajes.
- `ConversationStore` en memoria por `threadId` (clave = canal + id de usuario); interfaz lista para respaldar en DB/Redis luego.

### 5. Canales — `channels/`
- `Channel` (interfaz) con `sendText/sendImage/sendDocument`. `CLIChannel` para el MVP. `meta.ts` deja el esqueleto del adaptador Meta unificado (WhatsApp/IG/Messenger) sin implementarlo aún.

## Milestones

1. **M1 – Núcleo del agente (milestone actual):** config + estado + `CelinaMockClient` + tools + `engine` + `SYSTEM_PROMPT` + `CLIChannel`. Conversación end-to-end por terminal: calificar → buscar lotes (mock) → imagen de mapa (placeholder) → simular cuotas → generar PDF (fallback local). Tests de tools/estado + smoke del agente.
2. **M2 – CRM real:** activar `CelinaHttpClient` + `auth.ts` cuando lleguen credenciales; mapear respuestas reales a `models.ts`; PDF vía endpoints reales; assets de mapa reales de Celina.
3. **M3 – Canal Meta:** implementar `meta.ts` (WhatsApp primero), verificación de webhook, envío de media; persistencia de estado en DB.

## Verificación (end-to-end del M1)

1. Instalar: `npm install`; copiar `.env.example` → `.env` y poner `OPENROUTER_API_KEY` y `OPENROUTER_MODEL`.
2. Correr el CLI: `npm run dev` (o `tsx src/index.ts`). Simular una conversación completa: dar presupuesto/zona/uso → verificar que Isabella califica (hot/warm/cold), llama `buscar_lotes` (mock) y presenta 3-5 lotes, genera una imagen de mapa (placeholder con lote resaltado), simula cuotas y entrega un PDF de cotización en la carpeta de salida.
3. Confirmar reglas de negocio: en ningún momento envía un **link** de mapa (solo imagen); el PDF se genera; se registra un lead con su score.
4. Tests: `npm test` (vitest) — verde en tools (contra mock), transiciones de estado/scoring y smoke del loop del agente.
5. (M2) Con credenciales: cambiar el flag a `CelinaHttpClient` y repetir el paso 2 contra staging, validando auth JWT y read-only.
