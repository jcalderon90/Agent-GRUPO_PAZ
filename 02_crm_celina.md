# Resumen Técnico - Integración CRM Celina

**Fecha:** 25 de Junio, 2026  
**Destinatario:** Equipo de Desarrollo Celina  
**Estado:** Propuesta de Integración Inicial

## 1. Infraestructura Actual
- **Frontend:** SPA en Angular → `https://stagingcrm.celina.com.bo/`
- **API REST:** Node.js / Express → `https://stagingcrmapi.celina.com.bo/api/v1`
- **Seguridad:** helmet, CORS abierto, rate-limit 100 req/window
- **Auth:** POST `/api/v1/auth/login` con `{email, password}` → JWT Bearer. Soporta MFA.

## 2. Endpoints de Lectura
| Categoría | Endpoints | Uso |
|---|---|---|
| Lotes | `GET /lots/search`, `/search/all`, `/search/promotions`, `/lot/:id` | Disponibilidad e inventario |
| Financiamiento | `/lots/financing`, `/financing/one`, `/years_financing` | Planes de pago y cuotas |
| Cotizaciones | `/lot_quotation`, `/search/pdf_*` | Generación y descarga PDF |
| Contratos | `/sale_contracts`, `/search/sale_contracts` | Estado de transacciones |
| Leads/Clientes | `/lead`, `/customer`, `/prospect`, `/dashboard` | Pipeline comercial |
| Proyectos | `/project`, `/search_projects` | Listado de urbanizaciones |

## 3. Endpoints de Escritura
- `/lots/create_reservation_code` → reservas temporales
- `/lead`, `/editlead` → gestión de leads
- `/lead_assign`, `/customer_assign` → asignación de ejecutivos
- `/backoffice/upload-leads` → carga masiva

## 4. Propuestas Arquitectónicas
| Opción | Descripción | Ventaja |
|---|---|---|
| **A: Polling** | Consultas periódicas cada 15-30 min | Menor acoplamiento, sin cambios en Celina |
| **B: Webhooks** | POST a nuestro endpoint con token `X-Api-Key` | Tiempo real, eficiente |
| **C: Bidireccional** | Polling + escritura en tiempo real | Total automatización |

## 5. Requerimientos Técnicos
1. Credenciales de solo lectura y email válido
2. Definir modelo de sincronización (Polling vs Webhooks)
3. Documentación de estructura y estados de lotes
4. Whitelisting de IPs para rate-limit

*Documento confidencial*