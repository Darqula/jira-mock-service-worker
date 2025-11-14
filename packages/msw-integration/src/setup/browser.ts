import { setupWorker } from 'msw/browser';
import { setupJiraMock } from '../index.js';
import type { SetupJiraMockOptions } from '../index.js';

export function setupJiraMockWorker(options: SetupJiraMockOptions) {
  const { handlers, dataStore, queryEngine } = setupJiraMock(options);
  const worker = setupWorker(...handlers);

  return {
    worker,
    dataStore,
    queryEngine,
  };
}

export { setupWorker } from 'msw/browser';
