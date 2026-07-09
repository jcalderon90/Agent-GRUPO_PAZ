'use client';

import { useState } from 'react';
import { CalendarDays, MessageSquare, PhoneCall, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ContactsTable } from './ContactsTable';
import { ConversationView } from './ConversationView';
import { ComingSoon } from './ComingSoon';

type SubTab = 'prospectos' | 'chat' | 'agenda' | 'llamadas';

const SUB_TABS: { id: SubTab; label: string; desc: string; icon: LucideIcon }[] = [
  { id: 'prospectos', icon: Users,         label: 'Prospectos',  desc: 'Todos los contactos con pipeline de leads y filtros' },
  { id: 'chat',       icon: MessageSquare, label: 'Live Chat',   desc: 'Chats activos por canal (WhatsApp, Instagram, Facebook…)' },
  { id: 'agenda',     icon: CalendarDays,  label: 'Agenda',      desc: 'Citas programadas y próximas visitas' },
  { id: 'llamadas',   icon: PhoneCall,     label: 'Llamadas',    desc: 'Llamadas salientes programadas' },
];

export function CrmPage() {
  const [sub, setSub] = useState<SubTab>('prospectos');
  const current = SUB_TABS.find(t => t.id === sub)!;

  return (
    <div className="flex flex-col h-full bg-base-100">

      {/* ── Sub-nav ── */}
      <div className="sub-nav-scroll bg-base-100 border-b border-base-300 px-6 flex gap-0 justify-end">
        {SUB_TABS.map(tab => {
          const Icon = tab.icon;
          const active = sub === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSub(tab.id)}
              className={[
                'flex items-center gap-1.5 px-4 py-3 border-none cursor-pointer text-sm whitespace-nowrap transition-all bg-transparent',
                active
                  ? 'font-semibold text-primary border-b-2 border-primary'
                  : 'font-normal text-base-content/60 border-b-2 border-transparent hover:text-base-content',
              ].join(' ')}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Section header (oculto en chat para maximizar espacio) ── */}
      {sub !== 'chat' && (
        <div className="px-6 pt-5 pb-1 flex items-start gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <current.icon size={16} className="text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold text-base-content">{current.label}</div>
            <div className="text-xs text-base-content/50 mt-0.5">{current.desc}</div>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      {sub === 'chat' ? (
        <div className="flex-1 min-h-0 overflow-hidden px-4 pt-3 pb-3 lg:px-6 lg:pb-4">
          <ConversationView />
        </div>
      ) : sub === 'prospectos' ? (
        <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6">
          <ContactsTable />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6">
          <ComingSoon icon={current.icon} description={`${current.label} estará disponible próximamente.`} />
        </div>
      )}
    </div>
  );
}
