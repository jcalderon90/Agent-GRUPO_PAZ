import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3010),
  PROJECT_NAME: z.string().default('garoo-api'),
  PROJECT_PREFIX: z.string().min(2).max(10).optional().or(z.literal('')), // Opcional en multi-tenant ya que viene de DB central

  DATABASE_URL: z.string().url(),

  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-').optional(),
  OPENROUTER_API_KEY: z.string().startsWith('sk-or-').optional(),
  CLAUDE_MODEL: z.string().default('claude-sonnet-4-6'),

  MANYCHAT_API_TOKEN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().default('no-reply@redtec.ai'),
  FRONTEND_URL: z.string().default('http://localhost:3045'),

  API_AUTH_KEY: z.string().min(32),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3011'),

  JWT_SECRET: z.string().min(32),
  SEED_ADMIN_EMAIL: z.string().email().default('admin@redtec.ai'),
  SEED_ADMIN_PASSWORD: z.string().min(8),

  CLIENT_ID: z.string().uuid().optional().or(z.literal('')).transform(v => v || undefined),
  DEBOUNCE_MS: z.coerce.number().default(3000),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('[ENV] Variables de entorno faltantes o inválidas:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
