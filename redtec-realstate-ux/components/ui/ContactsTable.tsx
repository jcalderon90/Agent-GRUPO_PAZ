'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { Contact } from '../../lib/types';

export function ContactsTable() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Contact[]>('/dashboard/contacts')
      .then(setContacts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const channelColors: Record<string, string> = {
    whatsapp: 'badge-success',
    instagram: 'badge-secondary',
    facebook: 'badge-primary',
    dashboard: 'badge-ghost',
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Contactos</h2>

      <div className="overflow-x-auto">
        <table className="table table-zebra table-sm bg-base-100 rounded-lg">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Canal</th>
              <th>Email</th>
              <th>Interés</th>
              <th>Actualizado</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j}><div className="skeleton h-4 w-24" /></td>
                    ))}
                  </tr>
                ))
              : contacts.map(contact => (
                  <tr key={contact.id} className="hover cursor-pointer">
                    <td className="font-medium">{contact.name ?? contact.contact_id}</td>
                    <td>
                      <span className={`badge badge-sm ${channelColors[contact.channel] ?? 'badge-ghost'}`}>
                        {contact.channel}
                      </span>
                    </td>
                    <td className="text-base-content/60">{contact.email ?? '—'}</td>
                    <td>{contact.interest ?? '—'}</td>
                    <td className="text-xs text-base-content/50">
                      {new Date(contact.updated_at).toLocaleDateString('es')}
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {!loading && contacts.length === 0 && (
        <p className="text-center text-base-content/50 py-8">No hay contactos aún</p>
      )}
    </div>
  );
}
