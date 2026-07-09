import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

// Parse base connection string to extract credentials
const dbUrl = new URL(env.DATABASE_URL);
const dbUser = dbUrl.username;
const dbPassword = dbUrl.password;
const dbHost = dbUrl.hostname;
const dbPort = dbUrl.port || '5432';

// 1. Connection Pool for the CENTRAL AUTH Database
export const authPool = new Pool({
  user: dbUser,
  password: dbPassword,
  host: dbHost,
  port: parseInt(dbPort),
  database: 'redtec_auth',
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

authPool.on('error', (err) => {
  console.error('[DB AUTH] Unexpected error on idle client', err);
});

// 2. Map to cache Tenant Connection Pools
const tenantPools = new Map<string, pg.Pool>();

export function getTenantPool(dbName: string): pg.Pool {
  let tenantPool = tenantPools.get(dbName);
  if (!tenantPool) {
    tenantPool = new Pool({
      user: dbUser,
      password: dbPassword,
      host: dbHost,
      port: parseInt(dbPort),
      database: dbName,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    tenantPool.on('error', (err) => {
      console.error(`[DB TENANT: ${dbName}] Unexpected error on idle client`, err);
    });

    tenantPools.set(dbName, tenantPool);
    console.log(`[DB] Created new connection pool for tenant database: ${dbName}`);
  }
  return tenantPool;
}

// Verify connection to redtec_auth on startup
authPool.query('SELECT NOW()').then(() => {
  console.log('[DB AUTH] Central PostgreSQL database connected');
}).catch((err) => {
  console.error('[DB AUTH] Central database connection failed:', err.message);
  process.exit(1);
});
