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

export interface Message {
  id: number;
  contact_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface Metrics {
  totalContacts: number;
  todayMessages: number;
  activeConversations: number;
}
