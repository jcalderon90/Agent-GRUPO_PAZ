-- ============================================================
-- GAROO AGENT FRAMEWORK — Schema base
-- ============================================================
-- ANTES DE EJECUTAR: reemplaza "xx" con el prefijo de tu proyecto
-- Ejemplo: sed 's/xx_/mv_/g' schema.sql | psql $DATABASE_URL
--
-- Ejecutar: psql $DATABASE_URL -f schema.sql
-- ============================================================

-- Extensión para búsqueda semántica (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- búsqueda full-text

-- ── Contactos / Prospectos ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS xx_clients (
  id            SERIAL PRIMARY KEY,
  contact_id    VARCHAR(255) UNIQUE NOT NULL, -- "phone:50412345678" o IG user ID
  channel       VARCHAR(50) DEFAULT 'whatsapp',
  name          VARCHAR(255),
  email         VARCHAR(255),
  phone         VARCHAR(50),
  interest      TEXT,
  budget        VARCHAR(100),
  notes         TEXT,
  agent_role    VARCHAR(50) DEFAULT 'prospect', -- prospect | employee | admin
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Historial de conversaciones ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS xx_conversation_messages (
  id            SERIAL PRIMARY KEY,
  contact_id    VARCHAR(255) NOT NULL REFERENCES xx_clients(contact_id),
  role          VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xx_messages_contact ON xx_conversation_messages(contact_id, created_at DESC);

-- ── Configuración del agente (DB-driven, no hardcodeado) ──────────────────────
CREATE TABLE IF NOT EXISTS xx_client_configs (
  key           VARCHAR(100) PRIMARY KEY,
  value         TEXT NOT NULL,
  description   TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Valores por defecto (personalizar para cada proyecto)
INSERT INTO xx_client_configs (key, value, description) VALUES
  ('agent_name',        'Asistente',                'Nombre del agente'),
  ('system_prompt',     'Eres un asistente útil.',  'Prompt del sistema principal'),
  ('welcome_message',   '¡Hola! ¿En qué te puedo ayudar?', 'Mensaje de bienvenida'),
  ('language',          'es',                       'Idioma principal'),
  ('max_history',       '20',                       'Mensajes de historial a incluir'),
  ('followup_enabled',  'false',                    'Activar mensajes de seguimiento automático'),
  ('followup_delay_m',  '10',                       'Minutos antes del follow-up')
ON CONFLICT (key) DO NOTHING;

-- ── Base de conocimiento (RAG) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS xx_knowledge_entries (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  content       TEXT NOT NULL,
  category      VARCHAR(100),
  embedding     vector(768),        -- para búsqueda semántica con pgvector
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda vectorial (coseno)
CREATE INDEX IF NOT EXISTS idx_xx_knowledge_vector
  ON xx_knowledge_entries USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Índice para búsqueda full-text (fallback sin embeddings)
CREATE INDEX IF NOT EXISTS idx_xx_knowledge_fts
  ON xx_knowledge_entries USING gin(to_tsvector('spanish', content));

-- ── Logs del agente ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS xx_agent_logs (
  id            SERIAL PRIMARY KEY,
  contact_id    VARCHAR(255),
  event_type    VARCHAR(100) NOT NULL, -- 'webhook_received', 'tool_call', 'reply_sent', 'error'
  payload       JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xx_logs_contact ON xx_agent_logs(contact_id, created_at DESC);

-- ── Usuarios del dashboard ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS xx_authorized_users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  name          VARCHAR(255),
  role          VARCHAR(50) DEFAULT 'viewer', -- viewer | editor | admin
  pattern_hash  VARCHAR(255),                 -- para auth con pattern lock (opcional)
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FIN DEL SCHEMA BASE
-- ============================================================
-- Para agregar tablas específicas del proyecto (ej: inventario,
-- reservas, tickets), crea un archivo schema_extensions.sql
-- ============================================================
