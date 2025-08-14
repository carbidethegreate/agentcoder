import React, { useState } from 'react';
import type { DiagnosticsSettings } from '../types';

interface Props {
  accounts: any[];
  settings: DiagnosticsSettings;
  onSave(settings: DiagnosticsSettings): void;
  onClose(): void;
}

export default function SettingsModal({ accounts, settings, onSave, onClose }: Props) {
  const [local, setLocal] = useState<DiagnosticsSettings>(settings);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="bg-white text-black p-4 rounded space-y-4 min-w-[300px]">
        <h2 className="text-lg font-bold">Settings</h2>
        {accounts.length > 1 && (
          <div>
            <label className="block text-sm">Account</label>
            <select
              className="border p-2 w-full rounded"
              value={local.accountId}
              onChange={e => setLocal({ ...local, accountId: e.target.value })}
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm">Date Range</label>
          <select
            className="border p-2 w-full rounded"
            value={local.range}
            onChange={e => setLocal({ ...local, range: e.target.value as any })}
          >
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7d</option>
          </select>
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={local.includeLatency}
            onChange={e => setLocal({ ...local, includeLatency: e.target.checked })}
          />
          <span>Include latency percentiles</span>
        </label>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1" onClick={onClose}>Cancel</button>
          <button
            className="px-3 py-1 bg-blue-600 text-white rounded"
            onClick={() => onSave(local)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
