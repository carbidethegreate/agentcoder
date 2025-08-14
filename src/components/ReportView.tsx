import React, { useState } from 'react';
import type { Report } from '../types';
import { downloadBlob } from '../utils/downloadBlob';

interface Props {
  report: Report;
}

export default function ReportView({ report }: Props) {
  const [tab, setTab] = useState<'summary' | 'details' | 'errors'>('summary');

  const exportJson = () => {
    downloadBlob('report.json', 'application/json', JSON.stringify(report, null, 2));
  };
  const exportMarkdown = () => {
    const md = `# Diagnostics Report\nGenerated: ${report.generatedAt}\n\n## Summary\nWorkers selected: ${report.summary.totals.workersSelected}\nPages selected: ${report.summary.totals.pagesSelected}`;
    downloadBlob('report.md', 'text/markdown', md);
  };

  return (
    <div className="border rounded p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <button className={`px-3 py-1 rounded ${tab === 'summary' ? 'bg-gray-200' : ''}`} onClick={() => setTab('summary')}>Summary</button>
          <button className={`px-3 py-1 rounded ${tab === 'details' ? 'bg-gray-200' : ''}`} onClick={() => setTab('details')}>Details</button>
          <button className={`px-3 py-1 rounded ${tab === 'errors' ? 'bg-gray-200' : ''}`} onClick={() => setTab('errors')}>Errors</button>
        </div>
        <div className="flex gap-2">
          <button className="text-sm underline" onClick={exportJson}>Export JSON</button>
          <button className="text-sm underline" onClick={exportMarkdown}>Export Markdown</button>
        </div>
      </div>
      {tab === 'summary' && (
        <div>
          <p>Workers selected: {report.summary.totals.workersSelected}</p>
          <p>Pages selected: {report.summary.totals.pagesSelected}</p>
          <p>Requests 24h: {report.summary.totals.requests24h}</p>
          <p>Requests 7d: {report.summary.totals.requests7d}</p>
          <p>Avg error rate 24h: {report.summary.totals.avgErrorRate24h}</p>
        </div>
      )}
      {tab === 'details' && (
        <pre className="overflow-auto text-xs bg-gray-100 p-2 rounded">{JSON.stringify({ workers: report.workers, pages: report.pages }, null, 2)}</pre>
      )}
      {tab === 'errors' && (
        <pre className="overflow-auto text-xs bg-gray-100 p-2 rounded">{JSON.stringify(report.summary.flags, null, 2)}</pre>
      )}
    </div>
  );
}
