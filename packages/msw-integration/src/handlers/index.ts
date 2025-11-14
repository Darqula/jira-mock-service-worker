import type { DataStore, QueryEngine } from '@jira-mock/core';
import { createUsersHandlers } from './users.handlers.js';
import { createProjectsHandlers } from './projects.handlers.js';
import { createIssuesHandlers } from './issues.handlers.js';
import { createSearchHandlers } from './search.handlers.js';
import { createWorklogsHandlers } from './worklogs.handlers.js';
import { createMetadataHandlers } from './metadata.handlers.js';
import { createFiltersHandlers } from './filters.handlers.js';

export function createHandlers(
  dataStore: DataStore,
  queryEngine: QueryEngine,
  baseUrl: string
) {
  return [
    ...createUsersHandlers(dataStore, baseUrl),
    ...createProjectsHandlers(dataStore, baseUrl),
    ...createIssuesHandlers(dataStore, baseUrl),
    ...createSearchHandlers(queryEngine, baseUrl),
    ...createWorklogsHandlers(dataStore, baseUrl),
    ...createMetadataHandlers(dataStore, baseUrl),
    ...createFiltersHandlers(dataStore, baseUrl),
  ];
}

export * from './users.handlers.js';
export * from './projects.handlers.js';
export * from './issues.handlers.js';
export * from './search.handlers.js';
export * from './worklogs.handlers.js';
export * from './metadata.handlers.js';
export * from './filters.handlers.js';
