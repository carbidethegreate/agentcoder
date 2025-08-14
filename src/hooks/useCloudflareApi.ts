const API_BASE = 'https://api.cloudflare.com/client/v4';

export function useCloudflareApi(token: string) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const request = async (path: string, init: RequestInit = {}) => {
    const res = await fetch(API_BASE + path, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...headers,
        ...(init.headers || {}),
      },
    });
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  };

  return {
    getAccounts: async () => {
      const data = await request('/accounts');
      return data.result || [];
    },
    getWorkers: async (accountId: string) => {
      const data = await request(`/accounts/${accountId}/workers/scripts`);
      return data.result || [];
    },
    getWorkerDetails: async (accountId: string, name: string) => {
      const data = await request(`/accounts/${accountId}/workers/scripts/${name}`);
      return data.result || {};
    },
    getPagesProjects: async (accountId: string) => {
      const data = await request(`/accounts/${accountId}/pages/projects`);
      return data.result || [];
    },
    getPagesDeployments: async (accountId: string, project: string) => {
      const data = await request(`/accounts/${accountId}/pages/projects/${project}/deployments?per_page=1`);
      return data.result || [];
    },
    graphql: async (query: string, variables: any) => {
      const res = await fetch(`${API_BASE}/graphql`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
        body: JSON.stringify({ query, variables }),
      });
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    },
  };
}
