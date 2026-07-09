'use client';

import Image from 'next/image';
import { Bot, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

export type AgentTab = 'dashboard';

interface Agent {
  id: AgentTab;
  code: string;
  name: string;
  desc: string;
  img?: string;
  active: boolean;
}

const AGENTS: Agent[] = [
  {
    id: 'dashboard',
    code: 'GP.VENTAS',
    name: 'ISABELLA',
    desc: 'Agente de Ventas y Atención de Clientes Inmobiliarios.',
    img: '/agents-isabella.jpg',
    active: true,
  },
  {
    id: 'dashboard',
    code: 'RT.OPS',
    name: 'ARTURO',
    desc: 'Agente en preparación.',
    img: '/agents-arturo.jpg',
    active: false,
  },
  {
    id: 'dashboard',
    code: 'RT.SOPORTE',
    name: 'DANIEL',
    desc: 'Agente en preparación.',
    img: '/agents-daniel.jpg',
    active: false,
  },
  {
    id: 'dashboard',
    code: 'RT.CRM',
    name: 'MARCO',
    desc: 'Agente en preparación.',
    img: '/agents-marco.jpg',
    active: false,
  },
  {
    id: 'dashboard',
    code: 'RT.LEADS',
    name: 'SOFI',
    desc: 'Agente en preparación.',
    img: '/agents-sofi.jpg',
    active: false,
  },
];

const PROJECT_NAME = process.env.NEXT_PUBLIC_PROJECT_NAME ?? 'Garoo Dashboard';

function AgentCard({ agent, onSelect, index }: { agent: Agent; onSelect: (id: AgentTab) => void; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className={`agent-card${agent.active ? ' agent-active' : ''}`}
        onClick={() => agent.active && onSelect(agent.id)}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #1c1c1f 0%, #101012 100%)' }}>
          {agent.img ? (
            <Image
              src={agent.img}
              alt={agent.name}
              fill
              className="object-cover"
              style={{ opacity: agent.active ? 1 : 0.35 }}
              sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 20vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Bot size={40} color={agent.active ? 'var(--color-primary)' : '#3A3A3E'} strokeWidth={1.5} />
            </div>
          )}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(10,10,12,0.92) 0%, rgba(10,10,12,0.2) 55%, transparent 100%)' }}
          />
        </div>

        <div className="agent-card-info">
          <p style={{
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
            color: agent.active ? 'var(--color-primary)' : '#8A8A90',
            marginBottom: 2,
          }}>
            {agent.code}
          </p>
          <p style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(16px, 2.2vw, 22px)',
            lineHeight: 1,
            letterSpacing: '-0.04em',
            color: '#F6F4F0',
            marginBottom: 3,
          }}>
            {agent.name}
          </p>
          <p style={{
            fontSize: 9,
            color: agent.active ? '#c9c9cd' : '#9a9aa0',
            lineHeight: '13px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            marginBottom: agent.active ? 8 : 0,
          }}>
            {agent.desc}
          </p>
          {agent.active ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              background: 'var(--color-primary)',
              borderRadius: 4,
              fontSize: 9,
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              Abrir
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          ) : (
            <div style={{
              display: 'inline-flex',
              padding: '3px 8px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 4,
              fontSize: 9,
              fontWeight: 600,
              color: '#d0d0d4',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              Próximamente
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function AgentsHome({ onSelect, onLogout }: { onSelect: (tab: AgentTab) => void; onLogout?: () => void }) {
  return (
    <section className="agents-home-section flex flex-col justify-start">
      <motion.div
        className="agents-home-nav safe-x flex items-center justify-between border-b border-white/[0.07] pb-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <span style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 900, fontSize: 18, color: 'white' }}>
          {PROJECT_NAME}
        </span>
        {onLogout && (
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            className="flex items-center gap-1 transition-opacity hover:opacity-70"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            <LogOut size={14} />
          </button>
        )}
      </motion.div>

      <div className="agents-home-inner flex flex-col gap-5 items-start w-full">
        <div className="flex flex-col gap-2 max-w-[560px]">
          <p style={{
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--color-primary)',
            marginBottom: 6,
          }}>
            Panel de agentes · IA
          </p>
          <motion.h1
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 900,
              fontSize: 'clamp(48px, 8vw, 88px)',
              lineHeight: 0.9,
              letterSpacing: '-0.045em',
              color: '#F6F4F0',
            }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            Hola,
          </motion.h1>
          <motion.p
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 300,
              fontSize: 'clamp(13px, 1.4vw, 15px)',
              color: 'rgba(246,244,240,0.45)',
              lineHeight: 1.65,
              marginTop: 8,
            }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          >
            Tu equipo de agentes está listo para gestionar tus proyectos y clientes.
          </motion.p>
        </div>

        <motion.div
          className="flex items-center gap-4 pt-2 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
        >
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.16em',
            color: 'rgba(255,255,255,0.25)',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}>
            {PROJECT_NAME} Agents · powered by RedTec
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
        </motion.div>

        <motion.div
          className="agents-grid w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
        >
          {AGENTS.map((agent, i) => (
            <AgentCard key={agent.name} agent={agent} onSelect={onSelect} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
