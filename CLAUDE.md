# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **documentation-only repository** — there is no code, build system, or test suite. All files are Markdown documents defining the design and integration specs for **Isabella**, an AI sales agent built by RedTec/Garoo for **Grupo Paz / Celina Urbanizaciones** (Santa Cruz, Bolivia).

Isabella operates autonomously 24/7 on WhatsApp, Instagram DM, and Facebook Messenger, managing the full sales cycle: lead qualification → lot selection → PDF quote generation.

## Document Structure

Files use a `NN_` numeric prefix for chronological ordering:

| File | Content |
|---|---|
| `01_propuesta.md` | Commercial proposal (PR-2026-GP01) — services, payment model |
| `02_crm_celina.md` | CRM Celina API reference — endpoints, auth, architecture options |
| `03_reunion.md` | Meeting notes 2026-06-26 — blockers, decisions, action items |
| `04_proceso_ventas.md` | Isabella's sales flow — step-by-step with API endpoints used |

Files `05_arquitectura_integracion.md`, `06_condiciones_servicio.md`, and `07_tarea_bloqueadora.md` are referenced in the README but not yet created.

## Key Technical Context

**CRM Celina API**
- Base URL: `https://stagingcrmapi.celina.com.bo/api/v1`
- Auth: POST `/api/v1/auth/login` → JWT Bearer (supports MFA)
- Rate limit: 100 req/window; IP whitelisting required
- Isabella uses **read-only credentials only**

**Critical business rule:** Never send a link to the internal interactive map. Always use static PNG/JPG screenshots with the suggested lot highlighted.

**API endpoints Isabella uses:**
- Lot search: `GET /lots/search`, `/lots/search/all`, `/lot/:id`
- Financing: `/lots/financing`, `/years_financing`
- Quotes: `/lot_quotation`, `/search/pdf_*`
- Write (future): `/lots/create_reservation_code`, `/lead`, `/editlead`

**Current blocker (as of 2026-06-26):** CRM API credentials failed after first use. Jhon (Celina) is escalating to IT manager for new read-only credentials.

## Integration Architecture

Three options under consideration (see `02_crm_celina.md`):
- **Option A (Polling):** Queries every 15–30 min — least coupling, no Celina changes needed
- **Option B (Webhooks):** Real-time POST with `X-Api-Key` token
- **Option C (Bidirectional):** Polling + real-time writes — full automation

**Parallel deployment:** Isabella runs alongside KOMMO CRM (integrated by other partners) to compare AI vs. human agent performance.

## Document Conventions

- Write in Spanish (all existing docs are in Spanish)
- Use numeric prefix `NN_` for new files, continuing the sequence
- Tables preferred for structured information (endpoints, action items, comparisons)
- Mark sensitive content with `*Documento confidencial*`
- Dates in ISO format: YYYY-MM-DD or `DD de Mes, YYYY`
