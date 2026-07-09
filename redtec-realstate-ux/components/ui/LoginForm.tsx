'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { api } from '../../lib/api';

type Mode = 'login' | 'forgot' | 'change-password';

const PROJECT_NAME = process.env.NEXT_PUBLIC_PROJECT_NAME || 'Redtec Real Estate';

const inputCls =
  'h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-[var(--color-primary)]/60 focus:bg-white/[0.07]';

const labelCls = 'text-xs font-medium text-white/50';

function FieldError({ message }: { message: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl bg-red-500/10 px-4 py-2 text-center text-xs text-red-400"
    >
      {message}
    </motion.p>
  );
}

function SubmitButton({
  children,
  disabled,
  loading,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <motion.button
      type="submit"
      disabled={disabled || loading}
      className="mt-1 flex h-14 w-full items-center justify-center rounded-xl text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
      style={{ background: 'var(--color-primary, #C17A3A)' }}
      whileTap={{ scale: 0.97 }}
      whileHover={{ filter: 'brightness(1.1)' }}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : (
        children
      )}
    </motion.button>
  );
}

export function LoginForm({ onLogin }: { onLogin: (role: string, name: string, email: string) => void }) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Cambio de contraseña obligatorio (primer ingreso)
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);
  const [pendingTempToken, setPendingTempToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');

  // Olvidé mi contraseña
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.auth.login({ email: email.trim(), password });
      if (res.mustChangePassword && res.userId && res.tempToken) {
        setPendingUserId(res.userId);
        setPendingTempToken(res.tempToken);
        setMode('change-password');
        return;
      }
      onLogin(res.role, res.name, res.email);
    } catch {
      setError('Datos incorrectos. Verifica tu email y contraseña.');
      setPassword('');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.auth.forgotPassword(forgotEmail.trim());
    } finally {
      setLoading(false);
      setForgotSent(true);
    }
  }

  async function handleChangePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== newPassword2) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!pendingUserId) {
      setError('Sesión temporal expirada. Vuelve a iniciar sesión.');
      setMode('login');
      return;
    }
    setLoading(true);
    try {
      const res = await api.auth.changePassword(pendingUserId, pendingTempToken, newPassword);
      onLogin(res.role, res.name, res.email);
    } catch {
      setError('No se pudo cambiar la contraseña. El enlace pudo haber expirado — intenta iniciar sesión de nuevo.');
      setMode('login');
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
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/logo-redtec-white.png"
            alt="RedTec"
            width={200}
            height={41}
            className="mb-5 h-9 w-auto object-contain"
            priority
          />
          <h1
            className="bg-clip-text text-2xl font-black text-transparent"
            style={{ backgroundImage: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))' }}
          >
            {mode === 'login' && 'Acceso al Dashboard'}
            {mode === 'forgot' && 'Recuperar contraseña'}
            {mode === 'change-password' && 'Crea tu nueva contraseña'}
          </h1>
          <p className="mt-1 text-xs text-white/40">{PROJECT_NAME}</p>
        </div>

        {mode === 'login' && (
          <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Email</label>
                <input
                  type="email"
                  className={inputCls}
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                  autoComplete="email"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Contraseña</label>
                <input
                  type="password"
                  className={inputCls}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && <FieldError message={error} />}

              <SubmitButton disabled={!email || !password} loading={loading}>
                Ingresar
              </SubmitButton>
            </form>

            <button
              type="button"
              onClick={() => {
                setMode('forgot');
                setError('');
                setForgotSent(false);
                setForgotEmail(email);
              }}
              className="mt-4 w-full text-center text-xs text-white/40 transition-colors hover:text-white/70"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </>
        )}

        {mode === 'forgot' && (
          <div className="flex flex-col gap-4">
            {forgotSent ? (
              <p className="text-center text-sm text-white/70">
                Si <strong className="text-white">{forgotEmail}</strong> está registrado, te enviamos un enlace para
                restablecer tu contraseña. Revisa tu bandeja de entrada — es válido por 1 hora.
              </p>
            ) : (
              <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
                <p className="-mt-2 text-xs text-white/50">Te enviaremos un enlace para crear una contraseña nueva.</p>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Email</label>
                  <input
                    type="email"
                    className={inputCls}
                    placeholder="correo@ejemplo.com"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    required
                    autoFocus
                    autoComplete="email"
                  />
                </div>
                <SubmitButton disabled={!forgotEmail} loading={loading}>
                  Enviar enlace
                </SubmitButton>
              </form>
            )}
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className="text-center text-xs text-white/40 transition-colors hover:text-white/70"
            >
              Volver al inicio de sesión
            </button>
          </div>
        )}

        {mode === 'change-password' && (
          <form onSubmit={handleChangePasswordSubmit} className="flex flex-col gap-4">
            <p className="-mt-2 mb-1 text-center text-xs text-white/50">
              Este es tu primer ingreso. Crea una contraseña definitiva para continuar.
            </p>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Nueva contraseña</label>
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
              <label className={labelCls}>Confirmar contraseña</label>
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

            {error && <FieldError message={error} />}

            <SubmitButton disabled={!newPassword || !newPassword2} loading={loading}>
              Guardar y entrar
            </SubmitButton>
          </form>
        )}

        <p className="mt-8 text-center text-[11px] text-white/30">Powered by RedTec Systems</p>
      </motion.div>
    </div>
  );
}
