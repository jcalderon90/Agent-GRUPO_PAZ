import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../../middleware/auth.js';
import { runLangGraphAgent } from '../../services/langgraph_agent.js';
import type { TenantRequest } from '../../types/index.js';

export const chatRouter = Router();

chatRouter.use(authMiddleware);

const chatSchema = z.object({
  contact_id: z.string(),
  message: z.string().min(1),
});

// Endpoint para el dashboard interno (sin debounce, respuesta directa)
chatRouter.post('/', async (req: TenantRequest, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  try {
    const reply = await runLangGraphAgent(
      {
        contactId: parsed.data.contact_id,
        newMessage: parsed.data.message,
        channel: 'dashboard',
      },
      req.tenantDb!
    );
    res.json({ reply });
  } catch (err) {
    console.error('[CHAT] Error:', err);
    res.status(500).json({ error: 'Agent loop failed' });
  }
});
