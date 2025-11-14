import { setupServer } from 'msw/node';
import { setupJiraMock } from '../index.js';
import type { SetupJiraMockOptions } from '../index.js';

export function setupJiraMockServer(options: SetupJiraMockOptions) {
  const { handlers, dataStore, queryEngine } = setupJiraMock(options);
  const server = setupServer(...handlers);

  return {
    server,
    dataStore,
    queryEngine,
  };
}

export { setupServer } from 'msw/node';
