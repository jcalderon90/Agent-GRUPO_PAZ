# Investigación Técnica - Stack para Plataforma Unificada de Agentes (realstate.redtec.ai)

**Fecha:** 07 de Julio, 2026
**Origen:** Checkpoint de Agentes Real Estate - 06 de Julio, 2026 (Fernando Ortiz, Jorge Calderón, Jimmi Pachón, José Santisteban)
**Alcance:** Decisión de stack tecnológico para la nueva plataforma unificada de agentes inmobiliarios, con **Grupo Paz / Isabella** como primer caso de implementación concreto.

> **Actualización 13-jul-2026 — decisión de lenguaje revertida:** se cierra la discrepancia detectada en `09_revision_codigo_agent.md` a favor de **TypeScript**: Isabella se construye sobre el template Garoo ya existente (`redtec-realstate-api`/`-ux`, LangGraph.js), no sobre un repositorio nuevo en Python. Las demás recomendaciones de este documento (Postgres, RLS multi-tenant por `tenant_id`, JWT, pgvector, patrón supervisor/subagentes vía tool-calling) se mantienen vigentes — el template ya las cubre en TypeScript. Donde este documento diga "Python", léase "TypeScript/Node (LangGraph.js)".

## 1. Contexto y Decisión Ya Tomada en Reunión

El equipo tiene hoy varios agentes construidos con arquitecturas distintas entre sí (Mundo Verde/Acuavita, Altura, Rosero, Spectrum, Bravante), cada uno con su propio patrón en TypeScript. Se acordó:

- Congelar la duplicación de arquitecturas y construir una **plataforma unificada nueva** (`realstate.redtec.ai`, separada de InHome/Marketplace) en lugar de seguir replicando el patrón TypeScript actual.
- **Grupo Paz (Isabella)** será el primer proyecto construido sobre el nuevo stack: **Python + LangGraph**, en vez del patrón TypeScript usado hasta ahora. Jimmi Pachón lidera el levantamiento del repositorio por ser quien ya tiene experiencia con LangChain/LangGraph.
- El **frontend se estandariza a uno solo** (reutilizando el patrón de `RedTec UX Template`); lo que cambia por cliente es el **backend/endpoints que consume**, no la interfaz.
- Preferencia declarada por **Postgres** sobre MongoDB, para mantener una sola base de datos con todas las funciones necesarias (transaccional + vectorial).
- Se descartó explícitamente construir una herramienta "genérica tipo n8n" propia (Jimmi: "uno termina construyéndose un n8n peor").
- Visión a largo plazo: un **meta-agente** que, a partir de una configuración/brainstorm con *human-in-the-loop*, genere la configuración de nuevos agentes por cliente (inspirado en el flujo de creación de agentes de Go High Level y en la propuesta comercial de Olsia AI).

Esta investigación valida y detalla esas decisiones con estado del arte 2025-2026, y traduce la discusión de la reunión en una arquitectura concreta.

## 2. Comparativa de Frameworks de Orquestación

| Framework | Rol recomendado | Razón |
|---|---|---|
| **LangGraph** | Núcleo de orquestación (elegido) | Grafo de estado explícito, checkpointing/persistencia real, recuperación de fallos (time-travel), soporta el patrón supervisor + subagentes que el equipo ya usa conceptualmente en Spectrum. Usado en producción a esta escala (Klarna, LinkedIn, Uber, Replit). |
| **LangChain** | Solo como capa de utilidades (LLM wrappers, retrievers, memoria) | Confirmado en la reunión: no ofrece por sí solo la orquestación multi-agente con ramificaciones que requiere un flujo como el de Spectrum o Grupo Paz. |
| **CrewAI** | Opcional, no crítico | Útil para prototipar rápido "equipos de roles", pero **no tiene checkpointing/persistencia nativo** — una falla obliga a repetir todo el flujo (gasto de tokens). No debe usarse como orquestador central; a lo sumo, dentro de un subagente puntual que no necesite recuperación de estado. |
| **AutoGen** | Descartado | Microsoft lo tiene en modo mantenimiento, migrando a su nuevo "Agent Framework". No recomendable para desarrollo nuevo. |

**Patrón de orquestación recomendado:** supervisor/orquestador + subagentes especializados invocados como *tools* (tool-calling explícito), no abstracciones cerradas de "crew". Esto da control fino sobre qué contexto recibe cada subagente — encaja con la separación ya identificada en la reunión: agente de sincronización CRM, agente de captura/guardado de lead, agente de consulta a base de conocimiento (RAG).

**Costo/latencia:** modelo más capaz (tier frontier) solo en el nodo orquestador que decide y enruta; modelos económicos en los subagentes ejecutores (búsqueda de lotes, formateo de cotización, etc.).

**Regla práctica para evitar sobre-ingeniería:** si un agente único con buenas *tools* resuelve ~85% de los casos (p. ej. Isabella en su flujo lineal de calificación → cotización), no forzar multi-agente. Reservar el patrón supervisor para flujos con ramas genuinamente distintas (como Spectrum, multi-proyecto).

## 3. Multi-Tenancy

No existe un patrón "oficial" único de LangGraph para multi-tenant; se resuelve a nivel de aplicación:

1. **Grafo estático, configuración dinámica.** La topología del grafo (orquestador → subagentes) es la misma para todos los clientes. Lo que varía por cliente es la *configuración* inyectada en runtime vía el objeto de configuración de LangGraph (`RunnableConfig`): prompt/comportamiento, tools habilitadas, credenciales del CRM externo, namespace de la base de conocimiento. Construir un grafo distinto por tenant en cada request es técnicamente posible pero **no es el patrón recomendado** por la complejidad operativa que introduce — confirma la preocupación de Jorge en la reunión sobre "un solo agente" teniendo que discernir entre clientes.
2. **Identificación de tenant vía JWT**, tal como se discutió: al login se genera un token con la empresa (tenant) y los servicios/permisos habilitados; el middleware de autenticación resuelve `tenant_id` antes de invocar el grafo.
3. **Aislamiento de RAG por proyecto**, replicando lo que ya hicieron en Spectrum: namespace o colección separada por proyecto dentro del mismo vector store, para no mezclar bases de conocimiento de distintos proyectos/clientes.
4. **Aislamiento de datos en Postgres:** usar **Row-Level Security (RLS) con columna `tenant_id`** en las tablas compartidas. Es el enfoque más simple de operar a esta escala (una sola base, un solo esquema, políticas de RLS) frente a esquemas o bases de datos separadas por cliente — estas últimas solo se justifican si algún cliente exige aislamiento por requisitos regulatorios/contractuales.

Este modelo resuelve directamente la duda planteada en la reunión ("¿el agente en el backend debería tener todas las funcionalidades de todos los clientes?"): sí, el *grafo* es el mismo para todos, pero cada nodo activa solo las herramientas/integraciones que la configuración del tenant habilita (p. ej. conector a CRM Celina vs. conector a Monday/HubSpot).

## 4. Persistencia: Postgres + pgvector + Checkpointer

La combinación **Postgres transaccional + `langgraph-checkpoint-postgres` (memoria/estado de conversación) + `pgvector` (RAG)** es madura y activamente recomendada en 2026 para equipos que priorizan operar una sola base de datos:

- Menos piezas móviles que combinar Postgres + un vector store externo (Pinecone/Qdrant/Weaviate).
- Backups y RLS multi-tenant unificados en un solo motor.
- No hay evidencia de que `pgvector` sea insuficiente al volumen esperado (una base de conocimiento por proyecto inmobiliario, no decenas de millones de embeddings).

Un vector store dedicado solo se justificaría si el volumen de embeddings por proyecto creciera muy por encima de lo típico o se necesitara búsqueda híbrida muy optimizada — no es el caso previsible para Grupo Paz ni para los demás clientes actuales.

**Conclusión:** la preferencia por Postgres expresada en la reunión es la elección correcta y no requiere justificación adicional para migrar a Mongo.

## 5. Meta-Agente (Agente que Construye Agentes)

La idea discutida en la reunión (inspirada en Go High Level y en la propuesta comercial de Olsia AI: elegir modelo, comportamiento y base de conocimiento, y que el sistema arme el agente) es viable pero con una advertencia documentada en la literatura reciente:

- Los meta-agentes que generan otros agentes automáticamente (build-test-improve) son un área activa en 2026, pero los estudios muestran que suelen ser **costosos, inestables y no siempre superan a un diseño manual bien iterado**.
- Recomendación: usar el meta-agente como **acelerador de borrador** (genera prompt inicial, tools sugeridas, esquema de configuración a partir del brainstorm con el cliente) con **validación humana obligatoria** antes de pasar a producción — exactamente el flujo de *human-in-the-loop* que Jorge propuso en la reunión ("nosotros vamos a ver toda la idea que creó el agente y decidimos si vamos a aplicar esto").
- El grafo final de un cliente debe revisarse y "congelarse" manualmente, no regenerarse dinámicamente en cada request.

Este es un roadmap de fase 2-3, no un requisito para el lanzamiento de Grupo Paz.

## 6. Recomendación de Stack (Resumen)

| Capa | Elección | Notas |
|---|---|---|
| Orquestación de agentes | **LangGraph** (Python) | Supervisor + subagentes vía tool-calling |
| Complemento puntual | CrewAI (opcional, no crítico) | Solo si un subagente aislado se beneficia de su simplicidad de roles |
| Base de datos | **Postgres** | Transaccional + checkpointer de LangGraph + RLS multi-tenant |
| Vector store / RAG | **pgvector** (sobre el mismo Postgres) | Namespace por proyecto/cliente |
| Autenticación multi-tenant | JWT con `tenant_id` + servicios habilitados | Patrón ya usado en RedTec Portal |
| Frontend | Un solo template estandarizado (Next.js) | Cambia el backend/endpoints consumidos, no la UI |
| Almacenamiento de archivos | Bucket (S3-compatible) | Para PDFs de cotización, documentos subidos, capturas estáticas del mapa |
| Despliegue | Self-host con checkpointer en Postgres | LangGraph Platform/Cloud queda como opción futura para streaming e `interrupt()` gestionado, no bloqueante para el MVP |

## 7. Próximos Pasos

1. Levantar el repositorio base de Grupo Paz en Python + LangGraph (Jimmi Pachón + Jorge Calderón).
2. Definir el esquema de configuración por tenant (prompt, tools habilitadas, credenciales CRM, namespace RAG) — este esquema es la base para el futuro meta-agente.
3. Diseñar las tablas Postgres con `tenant_id` y políticas RLS antes de escribir lógica de negocio.
4. Confirmar con Celina el modelo de sincronización (Polling vs. Webhooks, ver `02_crm_celina.md`) antes de construir el subagente de sincronización CRM.
5. Documentar la arquitectura de integración específica de Grupo Paz en `05_arquitectura_integracion.md`, usando este documento como base de decisiones de stack.

*Documento confidencial*
