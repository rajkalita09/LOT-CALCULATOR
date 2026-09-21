import type { ApiClient, CalculationRequest, CalculationResponse } from './types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { headers: { 'content-type': 'application/json' }, ...init });
  if (!response.ok) {
    throw new Error(`API request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const liveClient: ApiClient = {
  calculate: async (body: CalculationRequest) => {
    const response = await request<{ data: CalculationResponse }>('/api/calculations', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return response.data;
  },
  health: () => request('/api/health'),
};
