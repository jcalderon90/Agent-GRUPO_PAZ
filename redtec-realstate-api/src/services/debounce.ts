import { env } from '../config/env.js';
import { runLangGraphAgent } from './langgraph_agent.js';
import { ManyChat } from './manychat.js';
import type { IncomingMessage } from '../types/index.js';
import type { TenantDb } from '../db/client.js';

// Mapa en memoria: contactId → { timer, messages acumulados, tenantDb }
const pending = new Map<string, {
  timer: ReturnType<typeof setTimeout>;
  messages: IncomingMessage[];
  tenantDb: TenantDb;
}>();

export function debounce(contactId: string, message: IncomingMessage, tenantDb: TenantDb): void {
  const existing = pending.get(contactId);

  if (existing) {
    clearTimeout(existing.timer);
    existing.messages.push(message);
  } else {
    pending.set(contactId, {
      timer: setTimeout(() => {}, 0),
      messages: [message],
      tenantDb,
    });
  }

  const entry = pending.get(contactId)!;

  entry.timer = setTimeout(async () => {
    pending.delete(contactId);

    const combinedText = entry.messages
      .map(m => m.text ?? '')
      .filter(Boolean)
      .join('\n');

    const lastMessage = entry.messages[entry.messages.length - 1];

    try {
      const reply = await runLangGraphAgent(
        {
          contactId,
          newMessage: combinedText,
          channel: lastMessage.channel ?? 'whatsapp',
        },
        entry.tenantDb
      );

      if (reply && lastMessage.contact_id) {
        const ch = lastMessage.channel === 'facebook' ? 'messenger' : (lastMessage.channel ?? 'whatsapp');
        await ManyChat.sendContent(lastMessage.contact_id, reply, ch as 'whatsapp' | 'instagram' | 'messenger');
      }
    } catch (err) {
      console.error(`[DEBOUNCE] Error processing ${contactId}:`, err);
    }
  }, env.DEBOUNCE_MS);
}
