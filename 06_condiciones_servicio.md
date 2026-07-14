# Condiciones de Servicio - Isabella para Grupo Paz

- **Referencia:** Propuesta comercial PR-2026-GP01 (ver `01_propuesta.md`)
- **Estado:** Borrador — pendiente de completar montos y cláusulas con el equipo comercial de RedTec
- **Última actualización:** 14 de Julio, 2026

## 1. Alcance del Servicio

Isabella opera de forma autónoma 24/7 gestionando el ciclo completo de ventas en los canales:
- WhatsApp
- Instagram Direct Message
- Facebook Messenger

Incluye:
- Calificación conversacional de prospectos (presupuesto, zona, propósito)
- Consulta de disponibilidad e integración con el CRM Celina (solo lectura)
- Presentación de lotes mediante capturas estáticas del mapa (nunca el mapa interactivo interno)
- Simulación de financiamiento y generación de cotizaciones en PDF
- Registro y seguimiento de leads
- Escalación a asesor humano cuando el prospecto lo solicite o el caso lo requiera
- Entrenamiento, monitoreo y optimización mensual del agente

## 2. Modelo de Pago

| Concepto | Detalle |
|---|---|
| **Setup Fee** | Pago único, inmediato al firmar el acuerdo |
| **Fee Mensual** | Facturación los primeros 5 días de cada mes, a partir del mes siguiente al go-live |

> **Pendiente:** montos exactos de Setup Fee y Fee Mensual no están definidos en la documentación disponible — a completar por el equipo comercial (Jorge Menzel, Director Comercial RedTec).

## 3. Vigencia

- La propuesta comercial PR-2026-GP01 es válida hasta el **25 de Julio, 2026**.
- Duración del contrato de servicio, renovación y condiciones de cancelación: **pendientes de definir**.

## 4. Condiciones Técnicas Asumidas

- Isabella opera con **credenciales de solo lectura** sobre el CRM Celina; cualquier escritura de leads (`/lead`, `/editlead`) requiere que Celina habilite permisos adicionales (ver bloqueador en `07_tarea_bloqueadora.md`).
- Isabella corre en paralelo al CRM KOMMO (integrado por otros partners) para efectos de comparación de desempeño IA vs. humano — no reemplaza ni interfiere con esa implementación.
- Regla de negocio dura: nunca se envía el enlace del mapa interactivo interno al prospecto.

## 5. Puntos Sin Definir (a cerrar antes de firmar)

- [ ] Montos de Setup Fee y Fee Mensual
- [ ] Duración/vigencia del contrato y términos de renovación
- [ ] SLA de soporte y tiempos de respuesta ante incidentes
- [ ] Política de cancelación y penalidades
- [ ] Responsabilidad sobre exactitud de datos entregados por Isabella (precios, disponibilidad) frente a cambios no reflejados a tiempo en el CRM

*Documento confidencial – Uso interno de Grupo Paz y RedTec*
