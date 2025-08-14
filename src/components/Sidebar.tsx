import React, { useState } from 'react';
import type { WorkerInfo, PagesProjectInfo } from '../types';

interface Props {
  workers: WorkerInfo[];
  pages: PagesProjectInfo[];
  selectedWorkers: string[];
  selectedPages: string[];
  onToggleWorker(name: string): void;
  onTogglePage(name: string): void;
  onSelectAllWorkers(): void;
  onSelectAllPages(): void;
}

export default function Sidebar({
  workers,
  pages,
  selectedWorkers,
  selectedPages,
  onToggleWorker,
  onTogglePage,
  onSelectAllWorkers,
  onSelectAllPages,
}: Props) {
  const [search, setSearch] = useState('');
  const filter = (name: string) => name.toLowerCase().includes(search.toLowerCase());
  const fw = workers.filter(w => filter(w.name));
  const fp = pages.filter(p => filter(p.name));
  return (
    <aside className="w-64 border-r p-4 space-y-6 overflow-auto">
      <input
        type="text"
        placeholder="Search"
        className="w-full border p-2 rounded"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">Workers</h2>
          <button className="text-sm underline" onClick={onSelectAllWorkers}>Select All</button>
        </div>
        <ul className="space-y-1">
          {fw.map(w => (
            <li key={w.name} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedWorkers.includes(w.name)}
                onChange={() => onToggleWorker(w.name)}
                aria-label={`select worker ${w.name}`}
              />
              <span className="text-sm">{w.name}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">Pages</h2>
          <button className="text-sm underline" onClick={onSelectAllPages}>Select All</button>
        </div>
        <ul className="space-y-1">
          {fp.map(p => (
            <li key={p.name} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedPages.includes(p.name)}
                onChange={() => onTogglePage(p.name)}
                aria-label={`select project ${p.name}`}
              />
              <span className="text-sm">{p.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
