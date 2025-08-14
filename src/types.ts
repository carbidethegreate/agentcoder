export type WorkerInfo = {
  name: string;
  modifiedOn?: string;
  usageModel?: string;
  bindings?: { type: string; name: string; detail?: string }[];
  routes?: { pattern: string; zoneName?: string }[];
  metrics?: {
    window: '24h' | '7d';
    requests: number;
    error4xxRate: number;
    error5xxRate: number;
    p50?: number;
    p95?: number;
    p99?: number;
    topErrorColos?: { colo: string; errorRate: number }[];
  }[];
  flags?: string[];
  suggestions?: string[];
};

export type PagesProjectInfo = {
  name: string;
  productionBranch?: string;
  latestDeploy?: {
    createdOn?: string;
    status?: string;
    commit?: string;
    durationSec?: number;
  };
  domains?: { hostname: string; status?: string }[];
  metrics?: WorkerInfo['metrics'];
  lastFailureReason?: string;
  suggestions?: string[];
};

export type Report = {
  generatedAt: string;
  accountId: string;
  workers: WorkerInfo[];
  pages: PagesProjectInfo[];
  summary: {
    totals: {
      workersSelected: number;
      pagesSelected: number;
      requests24h: number;
      requests7d: number;
      avgErrorRate24h: number;
    };
    flags: { type: 'warning' | 'error'; message: string; resource?: string }[];
  };
};

export type DiagnosticsSettings = {
  accountId?: string;
  range: '24h' | '7d';
  includeLatency: boolean;
};
