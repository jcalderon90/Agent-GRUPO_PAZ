import type { Request } from 'express';
import pg from 'pg';
import type { TenantDb } from '../db/client.js';

export interface TenantRequest extends Request {
  tenant?: {
    id: number;
    name: string;
    slug: string;
    dbName: string;
    prefix: string;
    pool: pg.Pool;
  };
  tenantDb?: TenantDb;
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

export interface IncomingMessage {
  contact_id: string;
  phone?: string;
  full_name?: string;
  text?: string;
  channel?: 'whatsapp' | 'instagram' | 'facebook';
  attachments?: Array<{
    type: 'image' | 'audio' | 'document' | 'video';
    url: string;
  }>;
}

export interface AgentInput {
  contactId: string;
  newMessage: string;
  channel: string;
  attachments?: IncomingMessage['attachments'];
}

export interface Contact {
  id: number;
  contact_id: string;
  channel: string;
  name?: string;
  email?: string;
  phone?: string;
  interest?: string;
  budget?: string;
  notes?: string;
  agent_role: 'prospect' | 'employee' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  id: number;
  contact_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface ClientConfig {
  [key: string]: string;
  agent_name: string;
  system_prompt: string;
  welcome_message: string;
}
