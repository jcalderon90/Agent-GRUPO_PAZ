'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { api } from '../../lib/api';

type Config = Record<string, string>;

const EDITABLE_KEYS = [
  { key: 'agent_name',        label: 'Nombre del agente',     type: 'text' },
  { key: 'system_prompt',     label: 'System prompt',          type: 'textarea' },
  { key: 'welcome_message',   label: 'Mensaje de bienvenida', type: 'textarea' },
  { key: 'followup_enabled',  label: 'Follow-up activo',      type: 'toggle' },
  { key: 'followup_delay_m',  label: 'Minutos para follow-up',type: 'number' },
];

export function AgentConfig() {
  const [config, setConfig] = useState<Config>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    api.get<Config>('/dashboard/config').then(setConfig);
  }, []);

  async function saveKey(key: string) {
    setSaving(key);
    try {
      await api.put('/dashboard/config', { key, value: config[key] });
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-semibold">Configuración del Agente</h2>
      <p className="text-sm text-base-content/60">
        Los cambios se aplican inmediatamente sin necesidad de redeploy.
      </p>

      {EDITABLE_KEYS.map(field => (
        <div key={field.key} className="card bg-base-100 border border-base-200">
          <div className="card-body p-4 gap-3">
            <label className="text-sm font-medium">{field.label}</label>

            {field.type === 'textarea' ? (
              <textarea
                className="textarea textarea-bordered w-full min-h-32 text-sm font-mono"
                value={config[field.key] ?? ''}
                onChange={e => setConfig(c => ({ ...c, [field.key]: e.target.value }))}
              />
            ) : field.type === 'toggle' ? (
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={config[field.key] === 'true'}
                onChange={e => setConfig(c => ({ ...c, [field.key]: String(e.target.checked) }))}
              />
            ) : (
              <input
                type={field.type}
                className="input input-bordered w-full text-sm"
                value={config[field.key] ?? ''}
                onChange={e => setConfig(c => ({ ...c, [field.key]: e.target.value }))}
              />
            )}

            <div className="flex justify-end">
              <button
                className={`btn btn-sm gap-2 ${saved === field.key ? 'btn-success' : 'btn-primary'}`}
                onClick={() => saveKey(field.key)}
                disabled={saving === field.key}
              >
                {saving === field.key
                  ? <span className="loading loading-spinner loading-xs" />
                  : <Save size={14} />
                }
                {saved === field.key ? '¡Guardado!' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
