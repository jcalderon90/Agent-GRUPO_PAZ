'use client';

import Image from 'next/image';
import { ChevronLeft, LogOut } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
  iconOnly?: boolean;
}

interface TopNavProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  agentName?: string;
  agentRole?: string;
  agentPhoto?: string;
  onHome?: () => void;
  onLogout?: () => void;
}

export function TopNav({ tabs, activeTab, onTabChange, agentName, agentRole, agentPhoto, onHome, onLogout }: TopNavProps) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex items-center gap-3 px-4 py-2 flex-shrink-0 overflow-hidden"
      style={{ background: '#0E0E10', borderBottom: '2px solid var(--color-primary)' }}
    >
      <div className="flex items-center gap-3 w-full">

        {/* LEFT: photo + logo stacked/side */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Agent photo */}
          {agentPhoto && (
            <Image
              src={agentPhoto}
              alt={agentName ?? 'Agente'}
              width={56}
              height={56}
              className="rounded-full object-cover flex-shrink-0"
              style={{
                width: 56,
                height: 56,
                outline: '2px solid color-mix(in srgb, var(--color-primary) 33%, transparent)',
                outlineOffset: 1,
              }}
            />
          )}

          {/* Logo — smaller, next to photo */}
          <Image
            src="/logo-redtec-white.png"
            alt="RedTec"
            width={72}
            height={18}
            className="object-contain flex-shrink-0"
            style={{ width: 'auto', height: 18, opacity: 0.75 }}
            priority
          />
        </div>

        {/* Divider */}
        <span className="w-px h-5 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }} />

        {/* Back button */}
        {onHome && (
          <button
            onClick={onHome}
            className="flex items-center gap-0.5 text-xs font-medium transition-opacity hover:opacity-80"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            <ChevronLeft size={13} />
            Agentes
          </button>
        )}

        {/* Agent name + role */}
        {agentName && (
          <AnimatePresence mode="wait">
            <motion.div
              key={agentName}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 4 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-1.5 min-w-0"
            >
              <span className="text-sm font-bold truncate" style={{ color: '#F6F4F0' }}>
                {agentName}
              </span>
              {agentRole && (
                <span
                  className="text-[11px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{
                    background: 'color-mix(in srgb, var(--color-primary) 19%, transparent)',
                    color: 'var(--color-primary)',
                  }}
                >
                  {agentRole}
                </span>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        <div className="flex-1" />

        {/* Tabs — desktop only */}
        <div className="hidden lg:flex gap-0.5">
          {tabs.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-3 py-1.5 rounded text-sm transition-transform ${active ? '' : 'hover:bg-white/10'}`}
                aria-label={tab.iconOnly ? tab.label : undefined}
                style={
                  active
                    ? { background: 'var(--color-primary)', color: '#fff', fontWeight: 600, transition: 'background 0.18s ease, color 0.18s ease, transform 0.12s ease' }
                    : { color: 'rgba(255,255,255,0.55)', transition: 'background 0.18s ease, color 0.18s ease, transform 0.12s ease' }
                }
              >
                {tab.iconOnly ? <tab.icon size={16} /> : tab.label}
              </button>
            );
          })}
        </div>

        {/* Logout */}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            className="flex items-center gap-1.5 px-2 py-1.5 rounded transition-opacity hover:opacity-70 ml-1"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            <LogOut size={15} />
            <span className="hidden lg:inline text-xs font-medium">Salir</span>
          </button>
        )}

      </div>
    </motion.nav>
  );
}
