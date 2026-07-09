import pg from 'pg';

export interface TenantDb {
  getOrCreateContact: (contactId: string, channel: string) => Promise<any>;
  updateContactField: (contactId: string, field: string, value: string) => Promise<void>;
  getRecentContacts: (limit: number) => Promise<any[]>;
  getConversationHistory: (contactId: string, limit: number) => Promise<any[]>;
  saveMessage: (contactId: string, role: 'user' | 'assistant', content: string) => Promise<void>;
  getClientConfig: () => Promise<Record<string, string>>;
  updateClientConfig: (key: string, value: string) => Promise<void>;
  searchKnowledge: (query: string) => Promise<string>;
  getDashboardMetrics: () => Promise<{ totalContacts: number; todayMessages: number; activeConversations: number }>;
}

export function getTenantDb(pool: pg.Pool, P: string): TenantDb {
  return {
    // ─── Contactos ───────────────────────────────────────────────────────────────

    async getOrCreateContact(contactId: string, channel: string) {
      const existing = await pool.query(
        `SELECT * FROM ${P}_clients WHERE contact_id = $1`,
        [contactId]
      );
      if (existing.rows.length > 0) return existing.rows[0];

      const result = await pool.query(
        `INSERT INTO ${P}_clients (contact_id, channel, created_at)
         VALUES ($1, $2, NOW()) RETURNING *`,
        [contactId, channel]
      );
      return result.rows[0];
    },

    async updateContactField(contactId: string, field: string, value: string) {
      // Solo permite campos en whitelist para evitar SQL injection
      const ALLOWED_FIELDS = ['name', 'email', 'phone', 'interest', 'budget', 'notes'];
      if (!ALLOWED_FIELDS.includes(field)) throw new Error(`Field "${field}" not allowed`);

      await pool.query(
        `UPDATE ${P}_clients SET ${field} = $1, updated_at = NOW() WHERE contact_id = $2`,
        [value, contactId]
      );
    },

    async getRecentContacts(limit: number) {
      const result = await pool.query(
        `SELECT * FROM ${P}_clients ORDER BY updated_at DESC LIMIT $1`,
        [limit]
      );
      return result.rows;
    },

    // ─── Conversaciones ───────────────────────────────────────────────────────────

    async getConversationHistory(contactId: string, limit: number) {
      const result = await pool.query(
        `SELECT role, content, created_at
         FROM ${P}_conversation_messages
         WHERE contact_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [contactId, limit]
      );
      return result.rows.reverse(); // orden cronológico para Claude/LangChain
    },

    async saveMessage(contactId: string, role: 'user' | 'assistant', content: string) {
      await pool.query(
        `INSERT INTO ${P}_conversation_messages (contact_id, role, content, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [contactId, role, content]
      );
    },

    // ─── Configuración del cliente ────────────────────────────────────────────────

    async getClientConfig(): Promise<Record<string, string>> {
      const result = await pool.query(
        `SELECT key, value FROM ${P}_client_configs`
      );
      return Object.fromEntries(result.rows.map(r => [r.key, r.value]));
    },

    async updateClientConfig(key: string, value: string) {
      await pool.query(
        `INSERT INTO ${P}_client_configs (key, value)
         VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, value]
      );
    },

    // ─── Base de conocimiento (RAG) ───────────────────────────────────────────────

    async searchKnowledge(query: string): Promise<string> {
      // En producción, generar embedding con Anthropic/OpenAI Embeddings API y usar pgvector
      // Por ahora, búsqueda full-text como fallback
      const result = await pool.query(
        `SELECT title, content
         FROM ${P}_knowledge_entries
         WHERE to_tsvector('spanish', content) @@ plainto_tsquery('spanish', $1)
         LIMIT 5`,
        [query]
      );
      if (result.rows.length === 0) return 'No encontré información específica sobre eso.';
      return result.rows.map(r => `**${r.title}**\n${r.content}`).join('\n\n');
    },

    // ─── Métricas del dashboard ───────────────────────────────────────────────────

    async getDashboardMetrics() {
      const [totalContacts, todayMessages, activeConversations] = await Promise.all([
        pool.query(`SELECT COUNT(*) FROM ${P}_clients`),
        pool.query(`SELECT COUNT(*) FROM ${P}_conversation_messages WHERE created_at > NOW() - INTERVAL '24 hours'`),
        pool.query(`SELECT COUNT(DISTINCT contact_id) FROM ${P}_conversation_messages WHERE created_at > NOW() - INTERVAL '1 hour'`),
      ]);

      return {
        totalContacts: parseInt(totalContacts.rows[0].count),
        todayMessages: parseInt(todayMessages.rows[0].count),
        activeConversations: parseInt(activeConversations.rows[0].count),
      };
    },
  };
}
