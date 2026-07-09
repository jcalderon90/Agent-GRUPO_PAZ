'use client';

import { useCallback, useEffect, useState } from 'react';
import { UserPlus, RefreshCw, Trash2 } from 'lucide-react';
import { api, type DashboardUser, type TenantOption } from '../../lib/api';

const ROLE_BADGES: Record<string, string> = {
  superadmin: 'badge-secondary',
  admin: 'badge-primary',
  agent: 'badge-ghost',
};

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  agent: 'Agente',
};

function StatusBadge({ user }: { user: DashboardUser }) {
  if (!user.active) {
    return <span className="badge badge-sm badge-neutral">Inactivo</span>;
  }
  if (user.invite_pending) {
    return <span className="badge badge-sm badge-warning">Invitación pendiente</span>;
  }
  return <span className="badge badge-sm badge-success">Activo</span>;
}

interface UsersPageProps {
  currentRole: string;
}

export function UsersPage({ currentRole }: UsersPageProps) {
  const isSuperadmin = currentRole === 'superadmin';

  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: 'agent', tenantSlug: '' });
  const [inviteSaving, setInviteSaving] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.users.list();
      setUsers(res.users);
    } catch {
      setError('No se pudo cargar la lista de usuarios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!isSuperadmin) return;
    api.users.tenants()
      .then(res => setTenants(res.tenants))
      .catch(() => {});
  }, [isSuperadmin]);

  function openInviteModal() {
    setInviteForm({ email: '', name: '', role: 'agent', tenantSlug: tenants[0]?.slug ?? '' });
    setInviteError('');
    setShowInvite(true);
  }

  async function submitInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError('');
    if (!inviteForm.email.trim() || !inviteForm.name.trim()) {
      setInviteError('Email y nombre son requeridos.');
      return;
    }
    if (isSuperadmin && !inviteForm.tenantSlug) {
      setInviteError('Selecciona un tenant.');
      return;
    }
    setInviteSaving(true);
    try {
      await api.users.invite({
        email: inviteForm.email.trim(),
        name: inviteForm.name.trim(),
        role: isSuperadmin ? inviteForm.role : 'agent',
        tenantSlug: isSuperadmin ? inviteForm.tenantSlug : undefined,
      });
      setShowInvite(false);
      await loadUsers();
    } catch {
      setInviteError('No se pudo enviar la invitación. Verifica que el email no esté ya registrado.');
    } finally {
      setInviteSaving(false);
    }
  }

  async function handleResend(user: DashboardUser) {
    setBusyId(user.id);
    try {
      await api.users.resendInvite(user.id);
    } catch {
      setError('No se pudo reenviar la invitación.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeactivate(user: DashboardUser) {
    if (!confirm(`¿Desactivar a ${user.name}? No podrá iniciar sesión.`)) return;
    setBusyId(user.id);
    try {
      await api.users.deactivate(user.id);
      await loadUsers();
    } catch {
      setError('No se pudo desactivar al usuario.');
    } finally {
      setBusyId(null);
    }
  }

  const columnCount = isSuperadmin ? 6 : 5;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Usuarios</h2>
        <button className="btn btn-primary btn-sm gap-2" onClick={openInviteModal}>
          <UserPlus size={16} />
          Invitar usuario
        </button>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="overflow-x-auto">
        <table className="table table-zebra table-sm bg-base-100 rounded-lg">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              {isSuperadmin && <th>Tenant</th>}
              <th>Estado</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: columnCount }).map((_, j) => (
                      <td key={j}><div className="skeleton h-4 w-24" /></td>
                    ))}
                  </tr>
                ))
              : users.map(user => (
                  <tr key={user.id}>
                    <td className="font-medium">{user.name}</td>
                    <td className="text-base-content/70">{user.email}</td>
                    <td>
                      <span className={`badge badge-sm ${ROLE_BADGES[user.role] ?? 'badge-ghost'}`}>
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </td>
                    {isSuperadmin && <td className="text-base-content/60">{user.tenant_name ?? '—'}</td>}
                    <td><StatusBadge user={user} /></td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        {user.active && user.invite_pending && (
                          <button
                            className="btn btn-ghost btn-xs gap-1"
                            disabled={busyId === user.id}
                            onClick={() => handleResend(user)}
                          >
                            {busyId === user.id
                              ? <span className="loading loading-spinner loading-xs" />
                              : <RefreshCw size={12} />}
                            Reenviar invitación
                          </button>
                        )}
                        {user.active && (
                          <button
                            className="btn btn-ghost btn-xs text-error gap-1"
                            disabled={busyId === user.id}
                            onClick={() => handleDeactivate(user)}
                          >
                            <Trash2 size={12} />
                            Desactivar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {!loading && users.length === 0 && (
        <p className="text-center text-base-content/50 py-8">No hay usuarios registrados.</p>
      )}

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-base-100 p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Invitar usuario</h3>
            <form onSubmit={submitInvite} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-base-content/60">Nombre</label>
                <input
                  className="input w-full"
                  value={inviteForm.name}
                  onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nombre completo"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-base-content/60">Email</label>
                <input
                  type="email"
                  className="input w-full"
                  value={inviteForm.email}
                  onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="correo@ejemplo.com"
                />
              </div>

              {isSuperadmin ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-base-content/60">Rol</label>
                    <select
                      className="select w-full"
                      value={inviteForm.role}
                      onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}
                    >
                      <option value="agent">Agente</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-base-content/60">Tenant</label>
                    <select
                      className="select w-full"
                      value={inviteForm.tenantSlug}
                      onChange={e => setInviteForm(f => ({ ...f, tenantSlug: e.target.value }))}
                    >
                      <option value="" disabled>Selecciona un tenant</option>
                      {tenants.map(t => (
                        <option key={t.id} value={t.slug}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <p className="text-xs text-base-content/50">Se invitará como Agente dentro de tu tenant.</p>
              )}

              {inviteError && <p className="text-sm text-error">{inviteError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowInvite(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary btn-sm gap-2" disabled={inviteSaving}>
                  {inviteSaving
                    ? <span className="loading loading-spinner loading-xs" />
                    : <UserPlus size={14} />}
                  Enviar invitación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
