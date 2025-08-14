import type { Report, WorkerInfo, PagesProjectInfo, DiagnosticsSettings } from '../types';

export async function runDiagnostics(
  api: any,
  accountId: string,
  workerNames: string[],
  pageNames: string[],
  settings: DiagnosticsSettings,
): Promise<Report> {
  const generatedAt = new Date().toISOString();

  const workers: WorkerInfo[] = await Promise.all(
    workerNames.map(async (name) => {
      const details = await api.getWorkerDetails(accountId, name);
      return {
        name,
        modifiedOn: details.modified_on,
        usageModel: details.usage_model,
      } as WorkerInfo;
    })
  );

  const pages: PagesProjectInfo[] = await Promise.all(
    pageNames.map(async (name) => {
      const deployments = await api.getPagesDeployments(accountId, name);
      const latest = deployments[0];
      return {
        name,
        latestDeploy: latest && {
          createdOn: latest.created_on,
          status: latest.status,
        },
      } as PagesProjectInfo;
    })
  );

  return {
    generatedAt,
    accountId,
    workers,
    pages,
    summary: {
      totals: {
        workersSelected: workers.length,
        pagesSelected: pages.length,
        requests24h: 0,
        requests7d: 0,
        avgErrorRate24h: 0,
      },
      flags: [],
    },
  };
}
