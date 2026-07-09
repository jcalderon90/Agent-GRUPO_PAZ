# Guía de Agentes Claude

Todo el comportamiento conversacional del sistema vive en el **agent loop** de `src/services/agent.ts`. Este documento explica cómo configurar, extender y depurar agentes.

---

## Anatomía de un agente

Un agente Garoo tiene tres partes:

### 1. Identidad (system prompt)

La personalidad, nombre e instrucciones del agente. Se carga desde la base de datos para poder modificarla sin redeploy.

```sql
INSERT INTO xx_client_configs (key, value) VALUES
('agent_name', 'Isabella'),
('agent_personality', 'agente inmobiliaria profesional y empática'),
('system_prompt', 'Eres Isabella, agente de ventas de Mundo Verde...');
```

En código:
```typescript
const config = await db.getClientConfig(); // carga desde DB
const systemPrompt = config.system_prompt;
```

### 2. Tools (acciones que puede ejecutar)

Define **qué puede hacer** el agente. Cada tool tiene:
- `name`: identificador único
- `description`: qué hace (Claude lo usa para decidir cuándo llamarlo)
- `input_schema`: parámetros con validación JSON Schema

```typescript
const TOOLS: Tool[] = [
  {
    name: "search_knowledge",
    description: "Busca información en la base de conocimiento del proyecto. Úsalo cuando el usuario pregunte sobre precios, disponibilidad, características o cualquier dato específico.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Texto de búsqueda en lenguaje natural"
        }
      },
      required: ["query"]
    }
  },
  // ... más tools
];
```

### 3. Loop de ejecución

Claude puede llamar tools múltiples veces antes de responder al usuario:

```
Usuario: "¿cuánto cuesta el apartamento de 2 habitaciones?"

Loop iteración 1:
  Claude → tool_use: search_knowledge("precios apartamentos 2 habitaciones")
  Tool result: [{ unit: "A-204", price: "$85,000", area: "78m²" }]

Loop iteración 2:
  Claude → tool_use: get_inventory({ bedrooms: 2, available: true })
  Tool result: [{ unit: "A-204", status: "disponible" }, ...]

Loop iteración 3 (end_turn):
  Claude → "El apartamento A-204 de 2 habitaciones está disponible a $85,000..."

Agente envía respuesta final al usuario.
```

---

## Tools incluidos en el template

### `search_knowledge`
Búsqueda semántica (RAG) en `xx_knowledge_entries` usando pgvector.

```typescript
async function searchKnowledge(query: string): Promise<string> {
  const embedding = await generateEmbedding(query);
  const results = await db.query(`
    SELECT content, title
    FROM xx_knowledge_entries
    ORDER BY embedding <=> $1::vector
    LIMIT 5
  `, [JSON.stringify(embedding)]);
  return results.rows.map(r => r.content).join('\n\n');
}
```

### `get_contact_info`
Recupera el perfil del contacto y su historial.

### `save_contact_data`
Guarda datos capturados durante la conversación (nombre, email, interés).

### `send_email`
Envía emails vía Resend con templates predefinidos.

### `create_log`
Registra eventos importantes en `xx_agent_logs` para el dashboard.

---

## Agregar un tool nuevo

1. **Definir el tool** en el array `TOOLS` en `src/services/agent.ts`:

```typescript
{
  name: "check_availability",
  description: "Verifica la disponibilidad de una unidad específica por su código.",
  input_schema: {
    type: "object",
    properties: {
      unit_code: { type: "string", description: "Código de unidad, ej: A-204" }
    },
    required: ["unit_code"]
  }
}
```

2. **Implementar el handler** en `executeTool()`:

```typescript
case "check_availability": {
  const { unit_code } = input as { unit_code: string };
  const unit = await db.query(
    'SELECT * FROM xx_units WHERE code = $1',
    [unit_code]
  );
  if (!unit.rows.length) return { available: false, reason: "unidad no encontrada" };
  return {
    available: unit.rows[0].status === 'disponible',
    unit: unit.rows[0]
  };
}
```

3. **Documentar en system prompt** (opcional pero recomendado):
   Menciona en el system prompt cuándo usar el tool para que Claude lo llame correctamente.

---

## Múltiples agentes (roles)

Un proyecto puede tener varios agentes con diferentes personalidades según el tipo de contacto. El discriminador se guarda en el perfil del contacto:

```typescript
const role = contact.agent_role; // "prospect" | "employee" | "admin"

const systemPrompts = {
  prospect: config.prospect_prompt,   // Isabella (ventas)
  employee: config.employee_prompt,   // Arturo (soporte interno)
  admin:    config.admin_prompt,      // acceso total
};

const systemPrompt = systemPrompts[role] ?? systemPrompts.prospect;
```

Ver `MundoVerdeAgenteRE` para ejemplo real con 5 agentes distintos.

---

## Anti-repetición

Para evitar que el agente repita exactamente lo que dijo antes, se inyecta la última respuesta del asistente en el contexto:

```typescript
// Al construir el historial de mensajes
if (lastAssistantMessage) {
  systemPrompt += `\n\nTu última respuesta fue:\n"${lastAssistantMessage}"\nNo la repitas literalmente.`;
}
```

---

## Configuración en base de datos

Los campos configurables por cliente van en `xx_client_configs`:

| key | Ejemplo de valor |
|-----|-----------------|
| `agent_name` | `Isabella` |
| `system_prompt` | `Eres Isabella, asesora de ventas...` |
| `welcome_message` | `¡Hola! Soy Isabella...` |
| `followup_enabled` | `true` |
| `followup_delay_minutes` | `10` |
| `max_conversation_length` | `50` |
| `language` | `es` |

```sql
-- Cambiar el system prompt sin redeploy
UPDATE xx_client_configs
SET value = 'Eres Isabella, versión 2...'
WHERE key = 'system_prompt';
```

---

## Debugging

### Ver el tool use completo

Activar logging en `src/services/agent.ts`:

```typescript
if (process.env.DEBUG_AGENT === 'true') {
  console.log('[AGENT] Tool call:', toolName, JSON.stringify(input));
  console.log('[AGENT] Tool result:', JSON.stringify(result).slice(0, 500));
}
```

### Ver conversación en DB

```sql
SELECT role, content, created_at
FROM xx_conversation_messages
WHERE contact_id = 'phone:50412345678'
ORDER BY created_at DESC
LIMIT 20;
```

### Logs del agent loop

```sql
SELECT event_type, payload, created_at
FROM xx_agent_logs
WHERE contact_id = 'phone:50412345678'
ORDER BY created_at DESC
LIMIT 10;
```

---

## Modelos disponibles

| Modelo | Uso recomendado | Costo |
|--------|----------------|-------|
| `claude-sonnet-4-6` | Conversaciones principales | Medio |
| `claude-haiku-4-5-20251001` | Follow-ups automáticos, tareas simples | Bajo |
| `claude-opus-4-8` | Análisis complejos, documentos | Alto |

El modelo se configura en `.env` como `CLAUDE_MODEL` para poder cambiarlo sin tocar código.
