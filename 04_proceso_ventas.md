# Flujo de Ventas – Isabella (Agente IA Autónoma)

## Visión General
Isabella opera 24/7 en WhatsApp, Instagram DM y Facebook Messenger sin intervención humana. Gestiona el ciclo completo: **Lead → Calificación → Selección → Cotización → Cierre**.

## Pasos Detallados

### 1. Recepción y Calificación (Conversacional)
- **Entrada:** Mensaje inbound en cualquier canal soportado.
- **IA Conversacional:** Extrae necesidades: presupuesto, zona, uso (vivienda/inversión), plazo, familia.
- **Scoring automático:** Lead calificado (hot/warm/cold) → registro en CRM Grupo Paz.

### 2. Consulta de Disponibilidad (API CRM Celina)
- **Endpoints usados:** `GET /lots/search`, `/lots/search/all`, `/lot/:id`.
- **Filtros:** precio, superficie, ubicación, estado (`disponible`, `reservado`, `vendido`).
- **Resultado:** Lista curada de 3-5 lotes óptimos.

### 3. Presentación Visual (Captura Estática)
- **Regla de negocio:** *Nunca* enviar enlace al mapa interactivo interno.
- **Entregable:** Imagen PNG/JPG del mapa con lote sugerido resaltado + ficha técnica (m², precio, financiamiento).
- **Contexto:** Incluye amenities, cercanías, plano de urbanización.

### 4. Selección y Configuración de Cuotas
- **Interacción:** Prospecto elige lote → Isabella consulta planes (`/lots/financing`, `/years_financing`).
- **Simulador:** Muestra cuota inicial, mensualidad, plazo, tasa.
- **Confirmación:** Prospecto valida lote + plan → Isabella guarda selección en contexto.

### 5. Generación de Cotización PDF
- **Endpoint:** `/lot_quotation` + `/search/pdf_*`.
- **Formato:** Plantilla oficial CRM Celina (logo, términos, validez, firma digital).
- **Entrega:** PDF adjunto en mismo hilo de chat + copia en CRM.

### 6. Seguimiento y Cierre
- **Nurturing:** Recordatorios automáticos, envío de docs legales, preguntas frecuentes.
- **Escalación:** Si prospecto solicita asesor humano → transferencia con resumen completo.
- **Reserva:** Futuro – `/lots/create_reservation_code` para apartado temporal.

## Métricas Clave (KPIs)
- Tiempo respuesta < 30 seg
- % leads calificados → cotización
- % cotizaciones → reserva
- Satisfacción post-interacción (CSAT)

## Integración Paralela (KOMMO)
- Mismos endpoints, distinta UI.
- Dashboard comparativo: IA vs. Humano (conversiones, tiempo, NPS).