'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { Contact, Message } from '../../lib/types';

export function ConversationView() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    api.get<Contact[]>('/dashboard/contacts').then(setContacts);
  }, []);

  async function openConversation(contact: Contact) {
    setSelected(contact);
    setLoadingMessages(true);
    try {
      const msgs = await api.get<Message[]>(`/dashboard/conversations/${contact.contact_id}`);
      setMessages(msgs);
    } finally {
      setLoadingMessages(false);
    }
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-12rem)]">
      {/* Lista de contactos */}
      <div className="w-64 flex-shrink-0 bg-base-100 rounded-lg border border-base-200 overflow-y-auto">
        <div className="p-3 border-b border-base-200">
          <p className="text-sm font-semibold">Conversaciones</p>
        </div>
        {contacts.map(contact => (
          <button
            key={contact.id}
            onClick={() => openConversation(contact)}
            className={`w-full text-left p-3 hover:bg-base-200 transition-colors border-b border-base-100 ${
              selected?.id === contact.id ? 'bg-primary/10' : ''
            }`}
          >
            <p className="text-sm font-medium truncate">{contact.name ?? contact.contact_id}</p>
            <p className="text-xs text-base-content/50">{contact.channel}</p>
          </button>
        ))}
      </div>

      {/* Vista de mensajes */}
      <div className="flex-1 bg-base-100 rounded-lg border border-base-200 flex flex-col">
        {selected ? (
          <>
            <div className="p-4 border-b border-base-200">
              <p className="font-semibold">{selected.name ?? selected.contact_id}</p>
              <p className="text-xs text-base-content/50">{selected.channel} · {selected.email ?? 'sin email'}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages
                ? <div className="flex justify-center pt-8"><span className="loading loading-spinner" /></div>
                : messages.map(msg => (
                    <div key={msg.id} className={`chat ${msg.role === 'user' ? 'chat-start' : 'chat-end'}`}>
                      <div className={`chat-bubble text-sm ${msg.role === 'assistant' ? 'chat-bubble-primary' : ''}`}>
                        {msg.content}
                      </div>
                      <div className="chat-footer opacity-50 text-xs">
                        {new Date(msg.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
              }
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-base-content/40">
            <p>Selecciona una conversación</p>
          </div>
        )}
      </div>
    </div>
  );
}
