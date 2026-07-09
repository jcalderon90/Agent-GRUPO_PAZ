import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { getTenantPool } from '../config/database.js';
import { getTenantDb } from '../db/client.js';
import type { TenantRequest } from '../types/index.js';

interface JWTPayload {
  userId: number;
  email: string;
  name: string;
  role: string;
  tenantId: number;
  tenantName: string;
  tenantSlug: string;
  tenantDbName: string;
  tenantPrefix: string;
}

export function authMiddleware(req: TenantRequest, res: Response, next: NextFunction): void {
  // 1. Check for JWT in Cookie or Authorization Header
  let token = req.cookies?.redtec_session;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  // Support master API Auth Key as fallback (mostly for legacy / system requests)
  const apiKey = req.headers['x-auth-key'];
  if (!token && apiKey && apiKey === env.API_AUTH_KEY) {
    // If using API key, we require tenant context in headers (x-tenant-slug)
    const tenantSlug = req.headers['x-tenant-slug'] as string;
    if (!tenantSlug) {
      res.status(400).json({ error: 'Missing x-tenant-slug header with API key auth' });
      return;
    }
    
    // In this case we need to fetch tenant details in a middleware.
    // To keep it simple, we recommend cookie/session JWT auth.
    // But let's allow it if we mock a basic tenant system or bypass.
    res.status(401).json({ error: 'System API key authentication requires JWT session' });
    return;
  }

  if (!token) {
    res.status(401).json({ error: 'No session token found. Unauthorized.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

    // 2. Fetch the corresponding PostgreSQL connection pool for the tenant
    const pool = getTenantPool(decoded.tenantDbName);

    // 3. Create the tenant-specific database client instance
    const tenantDb = getTenantDb(pool, decoded.tenantPrefix);

    // 4. Attach contexts to Request object
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };

    req.tenant = {
      id: decoded.tenantId,
      name: decoded.tenantName,
      slug: decoded.tenantSlug,
      dbName: decoded.tenantDbName,
      prefix: decoded.tenantPrefix,
      pool,
    };

    req.tenantDb = tenantDb;

    next();
  } catch (err) {
    console.error('[AUTH] Token verification failed:', err);
    res.status(401).json({ error: 'Session expired or invalid token.' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    next();
  };
}
