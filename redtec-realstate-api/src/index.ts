import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { env } from './config/env.js';
import { authPool } from './config/database.js';
import { webhookRouter } from './api/routes/webhook.js';
import { chatRouter } from './api/routes/chat.js';
import { authRouter } from './api/routes/auth.js';
import { dashboardRouter } from './api/routes/dashboard.js';
import { usersRouter } from './api/routes/users.js';
import { healthRouter } from './api/routes/health.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.ALLOWED_ORIGINS.split(','),
  credentials: true, // Permitir envío de cookies
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

app.use('/api/webhook', webhookRouter);
app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);
app.use('/api/dashboard/users', usersRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/health', healthRouter);

app.use(errorHandler);

// Función para sembrar el usuario admin por defecto en la base central
async function seedAdmin() {
  const email = env.SEED_ADMIN_EMAIL;
  const password = env.SEED_ADMIN_PASSWORD;

  try {
    const check = await authPool.query('SELECT id FROM ra_users WHERE LOWER(email) = LOWER($1) LIMIT 1', [email]);
    if (check.rows.length > 0) {
      console.log(`[DB AUTH] Admin user ${email} already exists.`);
      return;
    }

    const tenantResult = await authPool.query("SELECT id FROM ra_tenants WHERE slug = 'grupopaz' LIMIT 1");
    if (tenantResult.rows.length === 0) {
      console.warn('[DB AUTH] Seed aborted: Default tenant not found in ra_tenants.');
      return;
    }

    const tenantId = tenantResult.rows[0].id;
    const passwordHash = await bcrypt.hash(password, 12);

    await authPool.query(
      `INSERT INTO ra_users (tenant_id, email, password_hash, name, role, must_change_password)
       VALUES ($1, $2, $3, 'Super Admin', 'admin', false)`,
      [tenantId, email, passwordHash]
    );

    console.log(`[DB AUTH] Admin user ${email} created successfully with password from env.`);
  } catch (err: any) {
    console.error('[DB AUTH] Seeding admin failed:', err.message);
  }
}

app.listen(env.PORT, async () => {
  console.log(`[${env.PROJECT_NAME}] API running on port ${env.PORT}`);
  // Ejecutar el sembrado al arrancar la app
  await seedAdmin();
});
