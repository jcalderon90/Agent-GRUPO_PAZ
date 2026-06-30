# Reunión 26-Jun-2026 (Fathom Summary)

**Participantes:** Celina Urbanizaciones (Santa Cruz) + RedTec / Grupo La Paz  
**Duración:** 21 min  
**Propósito:** Definir proceso de ventas del agente IA y resolver bloqueadores técnicos.

## Puntos Clave
- **Bloqueador crítico:** Desarrollo detenido – credenciales API CRM fallaron tras un solo uso.
- **Meta:** Isabella maneja ciclo completo: calificación → selección lote → cotización PDF.
- **Proceso:** Calificación conversacional → consulta CRM → **captura de pantalla estática** del mapa (no mapa interactivo interno) → cotización PDF.
- **Paralelismo:** Isabella correrá junto a nueva implementación CRM KOMMO para comparar IA vs. humano.

## Temas Principales

### 1. Bloqueador Técnico – Acceso API CRM
| Aspecto | Detalle |
|---|---|
| **Problema** | Garoo (Fernando, Jorge M.) bloqueado: credenciales provistas inválidas. |
| **Resolución** | Jhon escala a Gerente TI → nuevas credenciales **solo lectura**. |
| **Justificación** | Solo lectura basta para datos de lotes/precios/disponibilidad sin riesgo de integridad. |

### 2. Proceso de Ventas – Isabella (Autónoma)
| Paso | Descripción |
|---|---|
| **1. Calificación** | IA conversacional entiende presupuesto, ubicación, propósito. |
| **2. Selección Lotes** | Consulta CRM vía API → encuentra lotes coincidentes. |
| **3. Presentación** | Envía **captura de pantalla estática** del mapa con lote resaltado. |
| **Razón** | Mapa interactivo completo = herramienta interna con datos sensibles (inventario total). |
| **4. Cotización** | Genera PDF estándar con formato CRM existente. |
| **Futuro** | Automatizar reservas, pagos, firma contratos. |

### 3. Contexto Proyecto e Integración
- **Paralelo:** Isabella + CRM KOMMO (integrado por otros partners).
- **Objetivo:** Comparar desempeño IA vs. agentes humanos.
- **Compatibilidad:** Fernando confirmó integración con cualquier sistema con API (KOMMO viable).

## Próximos Pasos (Action Items)

| Responsable | Acción | Deadline |
|---|---|---|
| **Jhon (Celina)** | Escalar acceso API solo lectura a TI. | Inmediato |
| **Jhon (Celina)** | Entregar archivos de mapas estáticos (todos los proyectos). | Inmediato |
| **Garoo (Fernando, Jorge M.)** | Redactar propuesta formal + cotización implementación Isabella. | Próxima semana |
| **Garoo** | Presentar a Jhon para revisión/aprobación interna. | Próxima semana |