import type { DataStore, QueryEngine } from '@jira-mock/core';
import { createUsersHandlers } from './users.handlers.js';
import { createUserPropertiesHandlers } from './user-properties.handlers.js';
import { createProjectsHandlers } from './projects.handlers.js';
import { createProjectPropertiesHandlers } from './project-properties.handlers.js';
import { createIssuesHandlers } from './issues.handlers.js';
import { createIssuePropertiesHandlers } from './issue-properties.handlers.js';
import { createSearchHandlers } from './search.handlers.js';
import { createWorklogsHandlers } from './worklogs.handlers.js';
import { createMetadataHandlers } from './metadata.handlers.js';
import { createFiltersHandlers } from './filters.handlers.js';
import { createCommentsHandlers } from './comments.handlers.js';
import { createTransitionsHandlers } from './transitions.handlers.js';
import { createIssueLinksHandlers } from './issue-links.handlers.js';
import { createAttachmentsHandlers } from './attachments.handlers.js';
import { createComponentsHandlers } from './components.handlers.js';
import { createVersionsHandlers } from './versions.handlers.js';

export function createHandlers(
  dataStore: DataStore,
  queryEngine: QueryEngine,
  baseUrl: string,
  generationSeed: number = Date.now()
) {
  return [
    ...createUsersHandlers(dataStore, baseUrl, generationSeed),
    ...createUserPropertiesHandlers(dataStore, baseUrl),
    ...createProjectsHandlers(dataStore, baseUrl),
    ...createProjectPropertiesHandlers(dataStore, baseUrl),
    ...createIssuesHandlers(dataStore, baseUrl),
    ...createIssuePropertiesHandlers(dataStore, baseUrl),
    ...createSearchHandlers(queryEngine, baseUrl),
    ...createWorklogsHandlers(dataStore, baseUrl),
    ...createMetadataHandlers(dataStore, baseUrl, generationSeed),
    ...createFiltersHandlers(dataStore, baseUrl),
    ...createCommentsHandlers(dataStore, baseUrl),
    ...createTransitionsHandlers(dataStore, baseUrl, generationSeed),
    ...createIssueLinksHandlers(dataStore, baseUrl),
    ...createAttachmentsHandlers(dataStore, baseUrl),
    ...createComponentsHandlers(dataStore, baseUrl),
    ...createVersionsHandlers(dataStore, baseUrl),
  ];
}

export * from './users.handlers.js';
export * from './user-properties.handlers.js';
export * from './projects.handlers.js';
export * from './project-properties.handlers.js';
export * from './issues.handlers.js';
export * from './issue-properties.handlers.js';
export * from './search.handlers.js';
export * from './worklogs.handlers.js';
export * from './metadata.handlers.js';
export * from './filters.handlers.js';
export * from './comments.handlers.js';
export * from './transitions.handlers.js';
export * from './issue-links.handlers.js';
export * from './attachments.handlers.js';
export * from './components.handlers.js';
export * from './versions.handlers.js';
