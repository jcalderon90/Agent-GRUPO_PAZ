# Tarea Bloqueadora y Próximos Pasos - Isabella

- **Última actualización:** 14 de Julio, 2026

## Tarea Bloqueadora Principal

**Credenciales de solo lectura al CRM Celina.**

| Aspecto | Detalle |
|---|---|
| **Origen** | Reunión 26-jun-2026 (ver `03_reunion.md`): las credenciales API entregadas inicialmente fallaron tras un solo uso. |
| **Responsable de resolución** | Jhon (Celina) — escala a su Gerente de TI. |
| **Estado (14-jul-2026)** | **Sin resolver.** No hay fecha estimada de entrega de las nuevas credenciales. |
| **Impacto** | Bloquea activar `CELINA_MODE=http` en el código (hoy corre en `mock`), validar `celina.http.ts` contra staging, y por lo tanto todo el pipeline real de lotes/financiamiento/cotizaciones. También bloquea la futura escritura de leads (`/lead`, `/editlead`) — ver nota más abajo. |
| **Acción de seguimiento** | Confirmar con Jhon el estado del ticket escalado a TI; si sigue sin resolución, escalar por un canal distinto (contacto directo con TI de Celina) dado que ya pasó más de 2 semanas desde el compromiso de "inmediato". |

## Próximos Pasos (actualizado desde la reunión del 26-jun)

| Responsable | Acción | Deadline original | Estado (14-jul-2026) |
|---|---|---|---|
| Jhon (Celina) | Escalar acceso API solo lectura a TI | Inmediato | **Sin resolver** |
| Jhon (Celina) | Entregar archivos de mapas estáticos (todos los proyectos) | Inmediato | **Pendiente** — bloquea reemplazo de placeholders en `assets/maps.ts` |
| Garoo (Fernando, Jorge M.) | Redactar propuesta formal + cotización implementación Isabella | Próxima semana | **Hecho** — PR-2026-GP01 (`01_propuesta.md`) |
| Garoo | Presentar a Jhon para revisión/aprobación interna | Próxima semana | Sin confirmar en la documentación disponible |
| Garoo (Jorge C.) | Construir capa de negocio de Isabella sobre template Garoo (TS/LangGraph) | — | **Hecho** — 7 tools, prompt, smoke test end-to-end exitoso (ver `README.md`) |

## Aclaración de Nomenclatura (14-jul-2026)

Se resolvió una ambigüedad entre documentos: **"CRM Grupo Paz" y "CRM Celina" son el mismo sistema**, no dos CRMs distintos. Los endpoints de escritura de leads (`/lead`, `/editlead`) son parte de la misma API Celina, listados en `CLAUDE.md` como "Write (future)". Esto significa que una vez resuelto el bloqueador de credenciales y habilitados los permisos de escritura, no se necesita construir un cliente/CRM adicional — basta con extender `celina.http.ts` para incluir esos dos endpoints.

## Modelo de Sincronización con Celina — Decidido (14-jul-2026)

De las 3 opciones planteadas en `02_crm_celina.md` (Polling, Webhooks, Bidireccional), **se descartan las 3 tal como estaban planteadas.** Todas asumían mantener una copia local del inventario de Celina, sincronizada por consulta periódica o por aviso automático de Celina.

**Decisión:** mantener el modelo que ya está implementado en el código — Isabella consulta la API de Celina **en el momento exacto** en que la necesita durante la conversación (lectura directa, sin copia local, sin horario de sincronización). Igual criterio aplica a futuro para la escritura de leads (`/lead`, `/editlead`): llamada directa en el momento, no por lote/job periódico.

**Por qué:** es el enfoque más simple, siempre trae datos actualizados, y no depende de que el equipo de Celina programe nada de su lado (Webhooks requeriría trabajo de ingeniería de Celina, que ya lleva semanas sin resolver algo más simple como las credenciales).

**Revisar esta decisión solo si:** el límite de 100 consultas por ventana de tiempo de la API de Celina se vuelve un problema real en producción (muchas conversaciones simultáneas agotando la cuota) — recién ahí valdría agregar una copia local con Polling.

## Pendientes Generales

La lista completa y más actualizada de pendientes vive en la sección "## Pendientes" de `README.md` — consultar ahí en vez de duplicarla. Resumen de los que dependen de esta tarea bloqueadora:

- Activar `CELINA_MODE=http` y validar contra staging
- Reemplazar placeholders de mapa (`assets/maps.ts`) y PDF (`assets/quotes.ts`)
- Extender `celina.http.ts` con `/lead` y `/editlead` para escritura real de leads (llamada directa, no batch)

*Documento confidencial*
