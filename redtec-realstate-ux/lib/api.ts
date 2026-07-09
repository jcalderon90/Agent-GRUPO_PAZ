// En el browser usamos /api/core/ (proxy Next.js, mismo dominio → cookie de sesión siempre válida)
// En SSR (Server Components / route handlers) usamos la URL directa del backend dentro de Docker
const BASE_URL = process.env.CORE_API_URL ?? 'http://localhost:3010';

function apiUrl(path: string): string {
  if (typeof window !== 'undefined') return `/api/core${path}`;
  return `${BASE_URL}/api${path}`;
}

type AuthStateListener = () => void;
let onUnauthorized: AuthStateListener | null = null;
export function setUnauthorizedHandler(fn: AuthStateListener) { onUnauthorized = fn; }

// Error tipado para distinguir un 401 real de fallos transitorios (red, 5xx, etc.)
export class UnauthorizedError extends Error {
  status = 401;
  constructor(message = 'Sesión expirada.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    if (!path.includes('/auth/')) onUnauthorized?.();
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    throw new Error(`API ${method} ${path} → ${res.status}`);
  }

  return res.json();
}

export interface DashboardUser {
  id: number;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'agent';
  active: boolean;
  invite_pending: boolean;
  tenant_id: number;
  tenant_name?: string;
  tenant_slug?: string;
  created_at: string;
}

export interface TenantOption {
  id: number;
  name: string;
  slug: string;
}

export const api = {
  get:    <T>(path: string)                => request<T>('GET', path),
  post:   <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put:    <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch:  <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string)                => request<T>('DELETE', path),

  // Contrato compartido por los backends del framework (auth por cookie httpOnly).
  // El payload de login varía por proyecto (password, teléfono, etc.) — se pasa tal cual.
  auth: {
    me:     () => request<{ email: string; role: string; name: string; tenant?: { name: string; slug: string } }>('GET', '/auth/me'),
    login:  (payload: Record<string, unknown>) =>
      request<{
        ok: boolean;
        role: string;
        name: string;
        email: string;
        mustChangePassword?: boolean;
        userId?: number;
        tempToken?: string;
      }>('POST', '/auth/login', payload),
    logout: () => request<{ ok: boolean }>('POST', '/auth/logout'),
    changePassword: (userId: number, tempToken: string, newPassword: string) =>
      request<{ ok: boolean; role: string; name: string; email: string }>('PUT', '/auth/change-password', {
        userId,
        tempToken,
        newPassword,
      }),
    forgotPassword: (email: string) =>
      request<{ ok: boolean }>('POST', '/auth/forgot-password', { email }),
    resetPassword: (token: string, newPassword: string) =>
      request<{ ok: boolean; role: string; name: string; email: string }>('POST', '/auth/reset-password', {
        token,
        newPassword,
      }),
  },

  // Gestión de usuarios multi-tenant (invitaciones por email) — solo admin/superadmin
  users: {
    list: (tenantSlug?: string) =>
      request<{ ok: boolean; users: DashboardUser[] }>(
        'GET',
        tenantSlug ? `/dashboard/users?tenant=${encodeURIComponent(tenantSlug)}` : '/dashboard/users'
      ),
    invite: (payload: { email: string; name: string; role: string; tenantSlug?: string }) =>
      request<{ ok: boolean; user: DashboardUser }>('POST', '/dashboard/users', payload),
    update: (id: number, payload: { name?: string; role?: string; active?: boolean }) =>
      request<{ ok: boolean; user: DashboardUser }>('PATCH', `/dashboard/users/${id}`, payload),
    deactivate: (id: number) =>
      request<{ ok: boolean }>('DELETE', `/dashboard/users/${id}`),
    resendInvite: (id: number) =>
      request<{ ok: boolean }>('POST', `/dashboard/users/${id}/resend-invite`),
    tenants: () =>
      request<{ ok: boolean; tenants: TenantOption[] }>('GET', '/dashboard/users/tenants'),
  },
};
