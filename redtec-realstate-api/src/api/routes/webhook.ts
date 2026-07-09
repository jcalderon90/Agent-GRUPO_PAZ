import { Router } from 'express';
import { z } from 'zod';
import { authPool, getTenantPool } from '../../config/database.js';
import { getTenantDb } from '../../db/client.js';
import { debounce } from '../../services/debounce.js';

export const webhookRouter = Router();

// Payload full contact data de ManyChat
const webhookSchema = z.object({
  id:               z.string(),
  name:             z.string().optional(),
  first_name:       z.string().optional(),
  last_name:        z.string().optional(),
  email:            z.string().email().optional().nullable(),
  phone:            z.string().optional().nullable(),
  whatsapp_phone:   z.string().optional().nullable(),
  ig_username:      z.string().optional().nullable(),
  last_input_text:  z.string().optional(),
  profile_pic:      z.string().optional().nullable(),
  custom_fields:    z.record(z.unknown()).optional(),
});

/*
 * PATRÓN CRÍTICO: responder 200 INMEDIATAMENTE, procesar en background.
 * ManyChat tiene timeout de ~2s. Si el agente tarda más, reintenta el webhook.
 */
webhookRouter.post('/:tenantSlug', async (req, res) => {
  // 1. Responder de inmediato para evitar reintentos de ManyChat
  res.json({}); 

  const { tenantSlug } = req.params;
  
  const parsed = webhookSchema.safeParse(req.body);
  if (!parsed.success) {
    console.error(`[WEBHOOK] Invalid payload for tenant ${tenantSlug}:`, parsed.error.flatten());
    return;
  }

  const data = parsed.data;

  try {
    // 2. Buscar tenant en la base central para obtener los detalles de conexión
    const tenantResult = await authPool.query(
      'SELECT database_name, project_prefix FROM ra_tenants WHERE slug = $1 LIMIT 1',
      [tenantSlug]
    );

    if (tenantResult.rows.length === 0) {
      console.warn(`[WEBHOOK] Unknown tenant slug received: ${tenantSlug}`);
      return;
    }

    const tenant = tenantResult.rows[0];
    const pool = getTenantPool(tenant.database_name);
    const tenantDb = getTenantDb(pool, tenant.project_prefix);

    // 3. Normalizar mensaje al formato interno
    const message = {
      contact_id: data.id,
      text:       data.last_input_text ?? '',
      full_name:  data.name ?? `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim(),
      phone:      data.whatsapp_phone ?? data.phone ?? undefined,
      email:      data.email ?? undefined,
      channel:    detectChannel(data),
      profile_pic: data.profile_pic ?? undefined,
      custom_fields: data.custom_fields ?? {},
    };

    console.log(`[WEBHOOK: ${tenantSlug}] ${message.contact_id} | ${message.channel} | "${message.text}"`);
    
    // 4. Encolar con debounce pasando el tenantDb correspondiente
    debounce(message.contact_id, message, tenantDb);
  } catch (err) {
    console.error(`[WEBHOOK] Error processing webhook for ${tenantSlug}:`, err);
  }
});

function detectChannel(data: { whatsapp_phone?: string | null; ig_username?: string | null; custom_fields?: Record<string, unknown> }): 'whatsapp' | 'instagram' | 'facebook' {
  const canal = data.custom_fields?.['canal_ingreso'];
  if (typeof canal === 'string') {
    const c = canal.toLowerCase();
    if (c.includes('whatsapp')) return 'whatsapp';
    if (c.includes('instagram')) return 'instagram';
  }
  if (data.whatsapp_phone) return 'whatsapp';
  if (data.ig_username)    return 'instagram';
  return 'facebook';
}
