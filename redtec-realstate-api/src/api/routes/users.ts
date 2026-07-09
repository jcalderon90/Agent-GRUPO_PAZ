import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { authPool } from '../../config/database.js';
import { authMiddleware, requireRole } from '../../middleware/auth.js';
import { env } from '../../config/env.js';
import { sendEmail, buildEmailTemplate } from '../../services/email.js';
import { hashToken } from './auth.js';
import type { TenantRequest } from '../../types/index.js';

export const usersRouter = Router();

const VALID_INVITE_ROLES = ['admin', 'agent'];

interface TargetUserRow {
  id: number;
  tenant_id: number;
  role: string;
  invite_pending?: boolean;
}

// Un admin solo puede gestionar agentes de su propio tenant; el superadmin gestiona a todos.
function canManageTarget(req: TenantRequest, target: TargetUserRow): boolean {
  if (req.user!.role === 'superadmin') return true;
  return target.tenant_id === req.tenant!.id && target.role === 'agent';
}

usersRouter.use(authMiddleware);

// Lista liviana de tenants — solo superadmin, para poblar el selector del modal de invitación.
// Se define ANTES de las rutas /:id para que Express no la capture como parámetro.
usersRouter.get('/tenants', requireRole('superadmin'), async (_req: TenantRequest, res) => {
  try {
    const result = await authPool.query('SELECT id, name, slug FROM ra_tenants ORDER BY name ASC');
    res.json({ ok: true, tenants: result.rows });
  } catch (err: any) {
    console.error('[USERS] Error listando tenants:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// GET / — lista de usuarios (scoping por rol)
usersRouter.get('/', requireRole('superadmin', 'admin'), async (req: TenantRequest, res) => {
  try {
    const isSuperadmin = req.user!.role === 'superadmin';
    const params: unknown[] = [];
    let query = `
      SELECT u.id, u.email, u.name, u.role, u.active, u.invite_pending, u.tenant_id, u.created_at,
             t.name AS tenant_name, t.slug AS tenant_slug
      FROM ra_users u
      JOIN ra_tenants t ON u.tenant_id = t.id
    `;

    if (isSuperadmin) {
      const tenantSlug = req.query.tenant as string | undefined;
      if (tenantSlug) {
        params.push(tenantSlug);
        query += ` WHERE t.slug = $${params.length}`;
      }
    } else {
      params.push(req.tenant!.id);
      query += ` WHERE u.tenant_id = $${params.length}`;
    }

    query += ' ORDER BY u.created_at DESC';

    const result = await authPool.query(query, params);
    res.json({ ok: true, users: result.rows });
  } catch (err: any) {
    console.error('[USERS] Error listando usuarios:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// POST / — invitar usuario nuevo
usersRouter.post('/', requireRole('superadmin', 'admin'), async (req: TenantRequest, res) => {
  const { email, name, role, tenantSlug } = req.body as {
    email?: string;
    name?: string;
    role?: string;
    tenantSlug?: string;
  };

  if (!email || !name || !role) {
    res.status(400).json({ error: 'Email, nombre y rol son requeridos.' });
    return;
  }
  if (!VALID_INVITE_ROLES.includes(role)) {
    res.status(400).json({ error: 'Rol inválido.' });
    return;
  }

  try {
    let targetTenantId: number;
    let targetTenantName: string;
    let targetTenantSlug: string;

    if (req.user!.role === 'admin') {
      if (role !== 'agent') {
        res.status(403).json({ error: 'Solo puedes invitar agentes a tu propio tenant.' });
        return;
      }
      targetTenantId = req.tenant!.id;
      targetTenantName = req.tenant!.name;
      targetTenantSlug = req.tenant!.slug;
    } else {
      if (!tenantSlug) {
        res.status(400).json({ error: 'tenantSlug es requerido.' });
        return;
      }
      const tenantResult = await authPool.query(
        'SELECT id, name, slug FROM ra_tenants WHERE slug = $1 LIMIT 1',
        [tenantSlug]
      );
      if (tenantResult.rows.length === 0) {
        res.status(404).json({ error: 'Tenant no encontrado.' });
        return;
      }
      targetTenantId = tenantResult.rows[0].id;
      targetTenantName = tenantResult.rows[0].name;
      targetTenantSlug = tenantResult.rows[0].slug;
    }

    const existing = await authPool.query(
      'SELECT id FROM ra_users WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [email]
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Ya existe un usuario con ese email.' });
      return;
    }

    const inertPassword = crypto.randomBytes(32).toString('hex'); // password inutilizable, se fija vía token de invitación
    const passwordHash = await bcrypt.hash(inertPassword, 12);
    const rawToken = crypto.randomBytes(32).toString('hex');

    const insertResult = await authPool.query(
      `INSERT INTO ra_users (
         tenant_id, email, password_hash, name, role,
         must_change_password, invite_pending, active,
         reset_token_hash, reset_token_expires_at
       )
       VALUES ($1, $2, $3, $4, $5, false, true, true, $6, NOW() + INTERVAL '72 hours')
       RETURNING id, email, name, role, tenant_id, active, invite_pending, created_at`,
      [targetTenantId, email, passwordHash, name, role, hashToken(rawToken)]
    );

    const inviteLink = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    const html = buildEmailTemplate(
      `Te invitaron al dashboard de ${targetTenantName}`,
      `<p>Hola${name ? ' ' + name : ''},</p>
       <p>Fuiste invitado a unirte al dashboard de <strong>${targetTenantName}</strong> en RedTec.</p>
       <p><a href="${inviteLink}" style="display:inline-block;padding:12px 24px;background:#C17A3A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Crear mi contraseña</a></p>
       <p style="color:#888;font-size:13px;">Este enlace expira en 72 horas. Si no esperabas esta invitación, ignora este correo.</p>`
    );

    sendEmail({ to: email, subject: `Invitación al dashboard de ${targetTenantName} — RedTec`, html }).catch(err =>
      console.error('[USERS] Error enviando email de invitación:', err)
    );

    res.status(201).json({
      ok: true,
      user: { ...insertResult.rows[0], tenant_name: targetTenantName, tenant_slug: targetTenantSlug },
    });
  } catch (err: any) {
    console.error('[USERS] Error invitando usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// POST /:id/resend-invite — regenera el token de invitación y reenvía el email
usersRouter.post('/:id/resend-invite', requireRole('superadmin', 'admin'), async (req: TenantRequest, res) => {
  const id = req.params.id as string;

  try {
    const result = await authPool.query(
      `SELECT u.id, u.email, u.name, u.role, u.tenant_id, u.invite_pending,
              t.name AS tenant_name
       FROM ra_users u
       JOIN ra_tenants t ON u.tenant_id = t.id
       WHERE u.id = $1
       LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    const target = result.rows[0];

    if (!canManageTarget(req, target)) {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    if (!target.invite_pending) {
      res.status(400).json({ error: 'El usuario ya activó su cuenta.' });
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    await authPool.query(
      `UPDATE ra_users SET reset_token_hash = $1, reset_token_expires_at = NOW() + INTERVAL '72 hours', updated_at = NOW()
       WHERE id = $2`,
      [hashToken(rawToken), target.id]
    );

    const inviteLink = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    const html = buildEmailTemplate(
      `Te invitaron al dashboard de ${target.tenant_name}`,
      `<p>Hola${target.name ? ' ' + target.name : ''},</p>
       <p>Fuiste invitado a unirte al dashboard de <strong>${target.tenant_name}</strong> en RedTec.</p>
       <p><a href="${inviteLink}" style="display:inline-block;padding:12px 24px;background:#C17A3A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Crear mi contraseña</a></p>
       <p style="color:#888;font-size:13px;">Este enlace expira en 72 horas.</p>`
    );

    sendEmail({ to: target.email, subject: `Invitación al dashboard de ${target.tenant_name} — RedTec`, html }).catch(
      err => console.error('[USERS] Error reenviando email de invitación:', err)
    );

    res.json({ ok: true });
  } catch (err: any) {
    console.error('[USERS] Error reenviando invitación:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// PATCH /:id — editar nombre / rol / estado activo
usersRouter.patch('/:id', requireRole('superadmin', 'admin'), async (req: TenantRequest, res) => {
  const id = req.params.id as string;
  const { name, role, active } = req.body as { name?: string; role?: string; active?: boolean };

  try {
    const result = await authPool.query(
      'SELECT id, tenant_id, role FROM ra_users WHERE id = $1 LIMIT 1',
      [id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    const target: TargetUserRow = result.rows[0];

    if (!canManageTarget(req, target)) {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    if (active === false && Number(target.id) === req.user!.id) {
      res.status(400).json({ error: 'No puedes desactivarte a ti mismo.' });
      return;
    }
    if (role !== undefined) {
      if (role === 'superadmin') {
        res.status(403).json({ error: 'No autorizado para asignar ese rol.' });
        return;
      }
      if (req.user!.role === 'admin' && role !== 'agent') {
        res.status(403).json({ error: 'Solo puedes asignar el rol de agente.' });
        return;
      }
    }

    const fields: string[] = [];
    const params: unknown[] = [];
    if (name !== undefined) {
      params.push(name);
      fields.push(`name = $${params.length}`);
    }
    if (role !== undefined) {
      params.push(role);
      fields.push(`role = $${params.length}`);
    }
    if (active !== undefined) {
      params.push(active);
      fields.push(`active = $${params.length}`);
    }

    if (fields.length === 0) {
      res.status(400).json({ error: 'Nada para actualizar.' });
      return;
    }

    fields.push('updated_at = NOW()');
    params.push(target.id);

    const updateResult = await authPool.query(
      `UPDATE ra_users SET ${fields.join(', ')} WHERE id = $${params.length}
       RETURNING id, email, name, role, tenant_id, active, invite_pending, created_at`,
      params
    );

    res.json({ ok: true, user: updateResult.rows[0] });
  } catch (err: any) {
    console.error('[USERS] Error actualizando usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// DELETE /:id — soft delete (active = false)
usersRouter.delete('/:id', requireRole('superadmin', 'admin'), async (req: TenantRequest, res) => {
  const id = req.params.id as string;

  try {
    const result = await authPool.query(
      'SELECT id, tenant_id, role FROM ra_users WHERE id = $1 LIMIT 1',
      [id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    const target: TargetUserRow = result.rows[0];

    if (!canManageTarget(req, target)) {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    if (Number(target.id) === req.user!.id) {
      res.status(400).json({ error: 'No puedes desactivarte a ti mismo.' });
      return;
    }

    await authPool.query('UPDATE ra_users SET active = false, updated_at = NOW() WHERE id = $1', [target.id]);
    res.json({ ok: true });
  } catch (err: any) {
    console.error('[USERS] Error desactivando usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});
