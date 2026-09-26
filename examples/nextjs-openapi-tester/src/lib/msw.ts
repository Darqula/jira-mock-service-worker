import { setupJiraMockWorker } from '@jira-mock/msw-integration/browser';
import type { JiraMockConfig } from '@jira-mock/core';

type JiraMockWorkerBundle = ReturnType<typeof setupJiraMockWorker>;

declare global {
  interface Window {
    jiraMock?: {
      worker: JiraMockWorkerBundle['worker'];
      dataStore: JiraMockWorkerBundle['dataStore'];
      queryEngine: JiraMockWorkerBundle['queryEngine'];
      config: JiraMockConfig;
    };
  }
}

// Load config from public directory
let config: JiraMockConfig;

try {
  // In browser, we'll fetch the config
  config = {
    version: '1.0',
    projects: [
      {
        projectKey: 'DEMO',
        projectName: 'Demo Project',
        seed: 42,
      },
    ],
  };
} catch (error) {
  console.error('Failed to load config, using defaults:', error);
  config = {
    version: '1.0',
    projects: [
      {
        projectKey: 'DEMO',
        projectName: 'Demo Project',
        seed: 42,
      },
    ],
  };
}

export async function initMocks() {
  if (typeof window === 'undefined') {
    return;
  }

  // Fetch config from API route
  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      config = (await response.json()) as JiraMockConfig;
    }
  } catch (error) {
    console.warn('Failed to fetch config, using defaults:', error);
  }

  const { worker, dataStore, queryEngine } = setupJiraMockWorker({
    config,
    baseUrl: 'https://your-domain.atlassian.net',
  });

  await worker.start({
    onUnhandledRequest: 'bypass',
  });

  console.log('🎭 MSW started with config:', config);
  console.log('📊 Data store initialized');
  console.log(`📁 Projects: ${dataStore.getAllProjects().length}`);
  console.log(`📋 Total issues: ${dataStore.getAllIssues().length}`);

  // Expose to window for debugging
  if (typeof window !== 'undefined') {
    window.jiraMock = {
      worker,
      dataStore,
      queryEngine,
      config,
    };
  }

  return { worker, dataStore, queryEngine };
}
