import React, { useEffect, useState } from 'react';
import TokenGate from './components/TokenGate';
import Sidebar from './components/Sidebar';
import ReportView from './components/ReportView';
import SettingsModal from './components/SettingsModal';
import { useCloudflareApi } from './hooks/useCloudflareApi';
import { runDiagnostics } from './hooks/useDiagnostics';
import type { WorkerInfo, PagesProjectInfo, Report, DiagnosticsSettings } from './types';

const defaultSettings: DiagnosticsSettings = {
  range: '24h',
  includeLatency: true,
};

export default function App() {
  const [token, setToken] = useState('');
  const api = useCloudflareApi(token);
  const [connected, setConnected] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [settings, setSettings] = useState<DiagnosticsSettings>(() => {
    const saved = localStorage.getItem('diag_settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });
  const [workers, setWorkers] = useState<WorkerInfo[]>([]);
  const [pages, setPages] = useState<PagesProjectInfo[]>([]);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('diag_settings', JSON.stringify(settings));
  }, [settings]);

  const connect = async (t: string) => {
    setToken(t);
    try {
      const acc = await api.getAccounts();
      setAccounts(acc);
      const chosen = settings.accountId || acc[0]?.id;
      setSettings(s => ({ ...s, accountId: chosen }));
      if (chosen) {
        const [ws, ps] = await Promise.all([
          api.getWorkers(chosen),
          api.getPagesProjects(chosen),
        ]);
        setWorkers(ws);
        setPages(ps);
        setConnected(true);
      }
    } catch (e) {
      console.error(e);
      alert('Token invalid or failed to fetch accounts');
    }
  };

  const toggleWorker = (name: string) => {
    setSelectedWorkers(w => w.includes(name) ? w.filter(n => n !== name) : [...w, name]);
  };
  const togglePage = (name: string) => {
    setSelectedPages(p => p.includes(name) ? p.filter(n => n !== name) : [...p, name]);
  };

  const selectAllWorkers = () => {
    setSelectedWorkers(sw => sw.length === workers.length ? [] : workers.map(w => w.name));
  };
  const selectAllPages = () => {
    setSelectedPages(sp => sp.length === pages.length ? [] : pages.map(p => p.name));
  };

  const generate = async () => {
    if (!settings.accountId) return;
    const rep = await runDiagnostics(api, settings.accountId, selectedWorkers, selectedPages, settings);
    setReport(rep);
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        workers={workers}
        pages={pages}
        selectedWorkers={selectedWorkers}
        selectedPages={selectedPages}
        onToggleWorker={toggleWorker}
        onTogglePage={togglePage}
        onSelectAllWorkers={selectAllWorkers}
        onSelectAllPages={selectAllPages}
      />
      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between p-4 border-b">
          <h1 className="text-lg font-bold">Cloudflare Diagnostics</h1>
          <div className="flex items-center gap-4">
            <button className="text-sm underline" onClick={() => setSettingsOpen(true)}>Settings</button>
            <span className={`px-2 py-1 rounded-full text-sm border ${connected ? 'border-green-500 text-green-500' : ''}`}>{connected ? 'Connected' : 'Not connected'}</span>
          </div>
        </header>
        <div className="p-4 space-y-4 overflow-auto">
          <TokenGate onConnect={connect} />
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:bg-gray-400"
            disabled={!token || (!selectedWorkers.length && !selectedPages.length)}
            onClick={generate}
          >
            Generate Report
          </button>
          {report && <ReportView report={report} />}
        </div>
      </main>
      {settingsOpen && (
        <SettingsModal
          accounts={accounts}
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onSave={(s) => { setSettings(s); setSettingsOpen(false); }}
        />
      )}
    </div>
  );
}
