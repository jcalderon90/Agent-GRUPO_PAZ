import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authPool } from '../../config/database.js';
import { authMiddleware } from '../../middleware/auth.js';
import { env } from '../../config/env.js';
import { sendEmail, buildEmailTemplate } from '../../services/email.js';
import type { TenantRequest } from '../../types/index.js';

export const authRouter = Router();

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Rate limiting simple en memoria: 10 intentos / 15 min por email+IP
const forgotAttempts = new Map<string, { count: number; resetAt: number }>();
const FORGOT_RATE_LIMIT = 10;
const FORGOT_RATE_WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = forgotAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    forgotAttempts.set(key, { count: 1, resetAt: now + FORGOT_RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > FORGOT_RATE_LIMIT;
}

interface TenantUserRow {
  id: number;
  email: string;
  name: string;
  role: string;
  tenant_id: number;
  tenant_name: string;
  tenant_slug: string;
  tenant_db: string;
  tenant_prefix: string;
}

function signSession(user: TenantUserRow): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenant_id,
      tenantName: user.tenant_name,
      tenantSlug: user.tenant_slug,
      tenantDbName: user.tenant_db,
      tenantPrefix: user.tenant_prefix,
    },
    env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function setSessionCookie(res: import('express').Response, token: string): void {
  res.cookie('redtec_session', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  });
}

const TENANT_USER_QUERY = `
  SELECT u.*, t.name as tenant_name, t.slug as tenant_slug, t.database_name as tenant_db, t.project_prefix as tenant_prefix
  FROM ra_users u
  JOIN ra_tenants t ON u.tenant_id = t.id
`;

// 1. LOGIN Centralizado de RedTec
authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email y contraseña requeridos.' });
    return;
  }

  try {
    const result = await authPool.query(
      `${TENANT_USER_QUERY} WHERE LOWER(u.email) = LOWER($1) LIMIT 1`,
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Credenciales inválidas.' });
      return;
    }

    const user: TenantUserRow = result.rows[0];
    const isMatch = await bcrypt.compare(password, result.rows[0].password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Credenciales inválidas.' });
      return;
    }

    if (result.rows[0].active === false) {
      res.status(401).json({ error: 'Tu cuenta ha sido desactivada. Contacta a tu administrador.' });
      return;
    }

    // Primer ingreso: exige cambio de contraseña antes de abrir sesión completa
    if (result.rows[0].must_change_password) {
      const tempToken = crypto.randomBytes(32).toString('hex');
      await authPool.query(
        `UPDATE ra_users SET reset_token_hash = $1, reset_token_expires_at = NOW() + INTERVAL '30 minutes' WHERE id = $2`,
        [hashToken(tempToken), user.id]
      );
      res.json({
        ok: true,
        mustChangePassword: true,
        userId: user.id,
        tempToken,
        name: user.name,
        email: user.email,
        role: user.role,
      });
      return;
    }

    setSessionCookie(res, signSession(user));

    res.json({
      ok: true,
      mustChangePassword: false,
      name: user.name,
      email: user.email,
      role: user.role,
      tenant: { name: user.tenant_name, slug: user.tenant_slug },
    });
  } catch (err: any) {
    console.error('[AUTH] Login error:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// 2. LOGOUT
authRouter.post('/logout', (req, res) => {
  res.clearCookie('redtec_session');
  res.json({ ok: true, message: 'Sesión cerrada.' });
});

// 3. GET /me (Verificar sesión actual)
authRouter.get('/me', authMiddleware, (req: TenantRequest, res) => {
  res.json({
    ok: true,
    name: req.user?.name,
    email: req.user?.email,
    role: req.user?.role,
    tenant: { name: req.tenant?.name, slug: req.tenant?.slug },
  });
});

// 4. Cambio de contraseña obligatorio en primer ingreso (con tempToken temporal)
authRouter.put('/change-password', async (req, res) => {
  const { userId, tempToken, newPassword } = req.body;

  if (!userId || !tempToken || !newPassword) {
    res.status(400).json({ error: 'Datos incompletos.' });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
    return;
  }

  try {
    const result = await authPool.query(
      `${TENANT_USER_QUERY} WHERE u.id = $1 AND u.reset_token_hash = $2 AND u.reset_token_expires_at > NOW() LIMIT 1`,
      [userId, hashToken(tempToken)]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Enlace temporal inválido o expirado. Inicia sesión de nuevo.' });
      return;
    }

    const user: TenantUserRow = result.rows[0];
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await authPool.query(
      `UPDATE ra_users
       SET password_hash = $1, must_change_password = false, reset_token_hash = NULL, reset_token_expires_at = NULL, updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, user.id]
    );

    setSessionCookie(res, signSession(user));
    res.json({ ok: true, name: user.name, email: user.email, role: user.role });
  } catch (err: any) {
    console.error('[AUTH] Change password error:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// 5. Olvidé mi contraseña — envía email con link de recuperación (Resend)
authRouter.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: 'Email requerido.' });
    return;
  }

  if (isRateLimited(`${String(email).toLowerCase()}:${req.ip}`)) {
    res.status(429).json({ error: 'Demasiados intentos. Intenta de nuevo más tarde.' });
    return;
  }

  try {
    const result = await authPool.query(
      'SELECT id, email, name FROM ra_users WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [email]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const rawToken = crypto.randomBytes(32).toString('hex');

      await authPool.query(
        `UPDATE ra_users SET reset_token_hash = $1, reset_token_expires_at = NOW() + INTERVAL '1 hour' WHERE id = $2`,
        [hashToken(rawToken), user.id]
      );

      const resetLink = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;
      const html = buildEmailTemplate(
        'Recupera tu contraseña',
        `<p>Hola${user.name ? ' ' + user.name : ''},</p>
         <p>Recibimos una solicitud para restablecer tu contraseña en RedTec.</p>
         <p><a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#C17A3A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Crear nueva contraseña</a></p>
         <p style="color:#888;font-size:13px;">Este enlace expira en 1 hora. Si no solicitaste esto, ignora este correo.</p>`
      );

      sendEmail({ to: user.email, subject: 'Recupera tu contraseña — RedTec', html }).catch(err =>
        console.error('[AUTH] Error enviando email de recuperación:', err)
      );
    }
  } catch (err: any) {
    console.error('[AUTH] Forgot password error:', err);
  }

  // Siempre responder ok — evita revelar si el email existe (previene enumeración)
  res.json({ ok: true });
});

// 6. Restablecer contraseña con el token recibido por email
authRouter.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    res.status(400).json({ error: 'Datos incompletos.' });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
    return;
  }

  try {
    const result = await authPool.query(
      `${TENANT_USER_QUERY} WHERE u.reset_token_hash = $1 AND u.reset_token_expires_at > NOW() LIMIT 1`,
      [hashToken(token)]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'El enlace es inválido o ya expiró. Solicita uno nuevo.' });
      return;
    }

    const user: TenantUserRow = result.rows[0];
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await authPool.query(
      `UPDATE ra_users
       SET password_hash = $1, must_change_password = false, reset_token_hash = NULL, reset_token_expires_at = NULL,
           invite_pending = false, active = true, updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, user.id]
    );

    setSessionCookie(res, signSession(user));
    res.json({ ok: true, name: user.name, email: user.email, role: user.role });
  } catch (err: any) {
    console.error('[AUTH] Reset password error:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});
