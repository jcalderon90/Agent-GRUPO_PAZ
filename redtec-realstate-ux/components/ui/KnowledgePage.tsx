'use client';

import { useState } from 'react';
import { BookOpen, Database } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ComingSoon } from './ComingSoon';

type SubTab = 'proyectos' | 'base';

const SUB_TABS: { id: SubTab; icon: LucideIcon; label: string; desc: string }[] = [
  { id: 'proyectos', icon: BookOpen, label: 'Proyectos',            desc: 'Datos estructurados por proyecto: precios, ubicación, amenidades…' },
  { id: 'base',      icon: Database, label: 'Base de conocimiento', desc: 'Documentos y entradas que el agente consulta al responder' },
];

export function KnowledgePage() {
  const [sub, setSub] = useState<SubTab>('proyectos');
  const current = SUB_TABS.find(t => t.id === sub)!;

  return (
    <div className="min-h-full bg-base-100">

      {/* ── Sub-nav ── */}
      <div className="sub-nav-scroll bg-base-100 border-b border-base-300 px-6 flex gap-0">
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
        <ComingSoon icon={current.icon} description={current.desc} />
      </div>
    </div>
  );
}
