# Índice - Proyecto Isabella

## Descripción General
Definido para la propuesta de agente de ventas Isabella de RedTec para Grupo Paz.

## Estado del Proyecto
**Última actualización:** 07 de Julio, 2026

| Aspecto | Estado |
|---|---|
| Propuesta comercial | Enviada (PR-2026-GP01, válida hasta 25-jul-2026) |
| Bloqueador CRM Celina | Pendiente – credenciales de solo lectura escaladas a TI por Jhon (Celina) |
| Stack tecnológico | **Decidido** – Python + LangGraph + Postgres/pgvector, multi-tenant vía JWT (ver `08_investigacion_tecnologias.md`) |
| Plataforma unificada (`realstate.redtec.ai`) | En arranque – repositorio base a cargo de Jimmi Pachón y Jorge Calderón |
| Integración CRM Celina | No iniciada – depende de la resolución del bloqueador de credenciales |
| Documentos pendientes | `05_arquitectura_integracion.md`, `06_condiciones_servicio.md`, `07_tarea_bloqueadora.md` |

## Índice de Archivos

- [01_propuesta.md](#01propuesta.md) – Detalles comerciales de la propuesta RedTec
- [02_crm_celina.md](#02crm_celina.md) – Resumen técnico de integración con CRM Celina
- [03_reunion.md](#03reunion.md) – Reunión del 26 de junio de 2026 (asuntos bloqueadores)
- [04_proceso_ventas.md](#04proceso_ventas.md) – Flujo y pasos del ciclo de ventas de Isabella
- [05_arquitectura_integracion.md](#05arquitectura_integracion.md) – Escenarios técnicos para integración
- [06_condiciones_servicio.md](#06condiciones_servicio.md) – Condiciones de servicio y modelo de pago
- [07_tarea_bloqueadora.md](#07tarea_bloqueadora.md) – Próximos pasos y tarea bloqueadora principal
- [08_investigacion_tecnologias.md](#08investigacion_tecnologias.md) – Investigación de stack tecnológico (LangGraph, Postgres, multi-tenant) para la plataforma unificada de agentes

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