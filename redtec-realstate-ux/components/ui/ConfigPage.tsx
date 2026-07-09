'use client';

import { useMemo, useState } from 'react';
import { Bot, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AgentConfig } from './AgentConfig';
import { UsersPage } from './UsersPage';

type SubTab = 'usuarios' | 'agente';

interface ConfigPageProps {
  userRole?: string;
}

export function ConfigPage({ userRole }: ConfigPageProps) {
  const canManageUsers = userRole === 'admin' || userRole === 'superadmin';

  const subTabs = useMemo(() => {
    const tabs: { id: SubTab; icon: LucideIcon; label: string; desc: string }[] = [];
    if (canManageUsers) {
      tabs.push({ id: 'usuarios', icon: Users, label: 'Usuarios y roles', desc: 'Roles, accesos e invitaciones del equipo' });
    }
    tabs.push({ id: 'agente', icon: Bot, label: 'Agente', desc: 'Nombre, personalidad y configuración del agente' });
    return tabs;
  }, [canManageUsers]);

  const [sub, setSub] = useState<SubTab>(canManageUsers ? 'usuarios' : 'agente');
  const current = subTabs.find(t => t.id === sub) ?? subTabs[0];

  return (
    <div className="min-h-full bg-base-100">

      {/* ── Sub-nav ── */}
      <div className="sub-nav-scroll bg-base-100 border-b border-base-300 px-6 flex gap-0">
        {subTabs.map(tab => {
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

      {/* ── Section header ── */}
      <div className="px-6 pt-5 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
          <current.icon size={16} className="text-primary" />
        </div>
        <div>
          <div className="text-sm font-semibold text-base-content">{current.label}</div>
          <div className="text-xs text-base-content/50 mt-0.5">{current.desc}</div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-6 pt-4 pb-6">
        {sub === 'usuarios' && canManageUsers && userRole && <UsersPage currentRole={userRole} />}
        {sub === 'agente' && <AgentConfig />}
      </div>
    </div>
  );
}
