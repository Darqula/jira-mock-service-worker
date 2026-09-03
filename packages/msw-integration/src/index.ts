import { generateMockData } from '@jira-mock/core';
import type { JiraMockConfig, DataStore, QueryEngine } from '@jira-mock/core';
import { createHandlers } from './handlers/index.js';
import type { RequestHandler } from 'msw';

export interface SetupJiraMockOptions {
  config: JiraMockConfig;
  baseUrl?: string;
}

export interface SetupJiraMockResult {
  handlers: RequestHandler[];
  dataStore: DataStore;
  queryEngine: QueryEngine;
}

export function setupJiraMock(options: SetupJiraMockOptions): SetupJiraMockResult {
  const { config, baseUrl = 'https://your-domain.atlassian.net' } = options;

  // Generate mock data
  const { dataStore, queryEngine } = generateMockData(config);

  // Stable seed for request-time generation contexts (transitions, createmeta,
  // permissions, ...): derived from the project seed when one is configured so
  // repeated GETs return identical data. Falls back to one per-setup value.
  const generationSeed = config.projects.find((p) => p.seed !== undefined)?.seed ?? Date.now();

  // Create MSW handlers
  const handlers = createHandlers(dataStore, queryEngine, baseUrl, generationSeed);

  return {
    handlers,
    dataStore,
    queryEngine,
  };
}

// Re-export core types
export type { JiraMockConfig, DataStore, QueryEngine } from '@jira-mock/core';
