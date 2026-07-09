'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { api } from '../../lib/api';

const inputCls =
  'h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-[var(--color-primary)]/60 focus:bg-white/[0.07]';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!token) {
      setError('Enlace inválido. Solicita uno nuevo desde el login.');
      return;
    }
    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== newPassword2) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      await api.auth.resetPassword(token, newPassword);
      setDone(true);
      setTimeout(() => router.push('/'), 1500);
    } catch {
      setError('El enlace es inválido o expiró. Solicita uno nuevo desde el login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-[#080810] p-6">
      <div className="absolute top-1/4 left-1/4 h-96 w-96 animate-pulse rounded-full bg-[var(--color-primary)]/15 blur-[120px]" />
      <div
        className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-pulse rounded-full bg-[var(--color-accent)]/10 blur-[120px]"
        style={{ animationDelay: '2s' }}
      />

      <motion.div
        className="relative w-full max-w-md rounded-3xl border border-white/10 p-10"
        style={{
          background: 'rgba(20,20,28,0.55)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 24px 60px rgba(0,0,0,0.5)',
        }}
        initial={{ opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1
          className="mb-8 bg-clip-text text-center text-2xl font-black text-transparent"
          style={{ backgroundImage: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))' }}
        >
          {done ? '¡Listo!' : 'Crea tu nueva contraseña'}
        </h1>

        {done ? (
          <p className="text-center text-sm text-white/70">Tu contraseña se actualizó. Redirigiendo al dashboard…</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-white/50">Nueva contraseña</label>
              <input
                type="password"
                className={inputCls}
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                autoFocus
                autoComplete="new-password"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-white/50">Confirmar contraseña</label>
              <input
                type="password"
                className={inputCls}
                placeholder="Repite la contraseña"
                value={newPassword2}
                onChange={e => setNewPassword2(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-500/10 px-4 py-2 text-center text-xs text-red-400">{error}</p>
            )}

            <motion.button
              type="submit"
              disabled={loading || !newPassword || !newPassword2}
              className="mt-1 flex h-14 w-full items-center justify-center rounded-xl text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: 'var(--color-primary, #C17A3A)' }}
              whileTap={{ scale: 0.97 }}
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                'Guardar contraseña'
              )}
            </motion.button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
