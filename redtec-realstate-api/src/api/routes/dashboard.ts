import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import type { TenantRequest } from '../../types/index.js';

export const dashboardRouter = Router();

dashboardRouter.use(authMiddleware);

// Contactos recientes
dashboardRouter.get('/contacts', async (req: TenantRequest, res) => {
  const contacts = await req.tenantDb!.getRecentContacts(50);
  res.json(contacts);
});

// Historial de conversación de un contacto
dashboardRouter.get('/conversations/:contactId', async (req: TenantRequest, res) => {
  const messages = await req.tenantDb!.getConversationHistory(req.params.contactId as string, 100);
  res.json(messages);
});

// Métricas básicas
dashboardRouter.get('/metrics', async (req: TenantRequest, res) => {
  const metrics = await req.tenantDb!.getDashboardMetrics();
  res.json(metrics);
});

// Configuración del agente
dashboardRouter.get('/config', async (req: TenantRequest, res) => {
  const config = await req.tenantDb!.getClientConfig();
  res.json(config);
});

dashboardRouter.put('/config', async (req: TenantRequest, res) => {
  const { key, value } = req.body as { key: string; value: string };
  await req.tenantDb!.updateClientConfig(key, value);
  res.json({ success: true });
});
