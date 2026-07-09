'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { api } from '../../lib/api';

interface Metrics {
  totalContacts: number;
  todayMessages: number;
  activeConversations: number;
}

export function AgentDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Metrics>('/dashboard/metrics')
      .then(setMetrics)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full">
      {/* ── Hero card ── */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ minHeight: 280, background: '#0E0E10', border: '1px solid rgba(255,255,255,0.07)' }}
      >

        {/* Foto de fondo — visible a la derecha */}
        <div className="absolute inset-0 flex justify-end">
          <div className="relative w-1/2 h-full">
            <Image
              src="/agents-isabella.jpg"
              alt="Isabella"
              fill
              className="object-cover object-top"
              style={{ opacity: 0.55 }}
              sizes="50vw"
              priority
            />
            {/* Gradiente izquierda: desvanece la foto hacia el contenido */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to right, #0E0E10 0%, #0E0E1088 35%, transparent 100%)',
            }} />
            {/* Gradiente abajo */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, #0E0E10 0%, transparent 50%)',
            }} />
          </div>
        </div>

        {/* Orb glow sutil */}
        <div style={{
          position: 'absolute', top: -60, left: -60, width: 280, height: 280,
          borderRadius: '50%',
          background: 'color-mix(in srgb, var(--color-primary) 18%, transparent)',
          pointerEvents: 'none',
        }} />

        {/* Contenido izquierdo */}
        <div className="relative z-10 p-8 sm:p-10 flex flex-col justify-between" style={{ minHeight: 280 }}>
          {/* Top: badge de rol */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 99,
            background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)',
            width: 'fit-content',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)', display: 'inline-block' }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-primary)' }}>
              GP.VENTAS
            </span>
          </div>

          {/* Nombre */}
          <div>
            <h2 style={{
              fontWeight: 900,
              fontSize: 'clamp(52px, 7vw, 76px)',
              lineHeight: 0.9,
              letterSpacing: '-0.045em',
              color: '#F6F4F0',
              marginBottom: 10,
            }}>
              ISABELLA
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(246,244,240,0.4)', marginBottom: 20 }}>
              Agente de ventas y atención de clientes inmobiliarios
            </p>

            {/* Mini stats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              {loading ? (
                <div style={{ display: 'flex', gap: 24 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} className="skeleton h-8 w-16 bg-white/10" />
                  ))}
                </div>
              ) : (
                <>
                  <div>
                    <p style={{ fontSize: 28, fontWeight: 900, color: '#F6F4F0', letterSpacing: '-0.04em', lineHeight: 1 }}>
                      {metrics?.totalContacts ?? 0}
                    </p>
                    <p style={{ fontSize: 10, color: 'rgba(246,244,240,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      contactos
                    </p>
                  </div>
                  <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.1)' }} />
                  <div>
                    <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--color-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                      {metrics?.activeConversations ?? 0}
                    </p>
                    <p style={{ fontSize: 10, color: 'rgba(246,244,240,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      activas ahora
                    </p>
                  </div>
                  <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.1)' }} />
                  <div>
                    <p style={{ fontSize: 28, fontWeight: 900, color: '#4ade80', letterSpacing: '-0.04em', lineHeight: 1 }}>
                      {metrics?.todayMessages ?? 0}
                    </p>
                    <p style={{ fontSize: 10, color: 'rgba(246,244,240,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      mensajes hoy
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
