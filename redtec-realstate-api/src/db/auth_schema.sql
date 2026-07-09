-- ============================================================
-- REDTEC AUTH — Central Database Schema
-- ============================================================

-- Table for Tenants
CREATE TABLE IF NOT EXISTS ra_tenants (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  slug            VARCHAR(50) UNIQUE NOT NULL,      -- e.g., 'grupopaz', 'grupocof'
  database_name   VARCHAR(100) UNIQUE NOT NULL,    -- e.g., 'grupopaz', 'grupocof'
  project_prefix  VARCHAR(10) NOT NULL,            -- e.g., 'gp', 'gc'
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Centralized Users
CREATE TABLE IF NOT EXISTS ra_users (
  id                    SERIAL PRIMARY KEY,
  tenant_id             INT NOT NULL REFERENCES ra_tenants(id) ON DELETE CASCADE,
  email                 VARCHAR(255) UNIQUE NOT NULL,
  password_hash         VARCHAR(255) NOT NULL,
  name                  VARCHAR(255),
  role                  VARCHAR(50) DEFAULT 'agent', -- 'agent' | 'admin' | 'superadmin'
  must_change_password  BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Index for searching users by email
CREATE INDEX IF NOT EXISTS idx_ra_users_email ON ra_users(email);

-- Reset / temp password token (compartido por el flujo de "primer ingreso" y "olvidé mi contraseña")
ALTER TABLE ra_users ADD COLUMN IF NOT EXISTS reset_token_hash VARCHAR(64);
ALTER TABLE ra_users ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ;

-- Gestión de usuarios multi-tenant (invitaciones por email)
ALTER TABLE ra_users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE ra_users ADD COLUMN IF NOT EXISTS invite_pending BOOLEAN DEFAULT FALSE;
-- Promover el admin existente a superadmin:
UPDATE ra_users SET role = 'superadmin' WHERE email = 'admin@redtec.ai';
