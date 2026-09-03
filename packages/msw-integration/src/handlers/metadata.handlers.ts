import { http, HttpResponse } from 'msw';
import type { DataStore } from '@jira-mock/core';
import { CreateMetaGenerator, EditMetaGenerator } from '@jira-mock/core';
import { createGenerationContext } from '../utils/generation-context.js';

export function createMetadataHandlers(
  dataStore: DataStore,
  baseUrl: string,
  generationSeed: number = Date.now()
) {
  const createMetaGenerator = new CreateMetaGenerator();
  const editMetaGenerator = new EditMetaGenerator();

  return [
    // GET /rest/api/2/issuetype/page - Get issue types with pagination
    http.get(`${baseUrl}/rest/api/2/issuetype/page`, ({ request }) => {
      const url = new URL(request.url);
      const startAt = parseInt(url.searchParams.get('startAt') || '0', 10);
      const maxResults = parseInt(url.searchParams.get('maxResults') || '50', 10);

      // All mock projects share one global issue type scheme, so project
      // filters are accepted but every issue type is returned.
      const issueTypes = dataStore.getAllIssueTypes();

      const total = issueTypes.length;
      const paginatedTypes = issueTypes.slice(startAt, startAt + maxResults);

      return HttpResponse.json({
        self: `${baseUrl}/rest/api/2/issuetype/page`,
        maxResults,
        startAt,
        total,
        isLast: startAt + paginatedTypes.length >= total,
        values: paginatedTypes,
      });
    }),

    // GET /rest/api/2/issuetype/project - Get issue types for a project
    http.get(`${baseUrl}/rest/api/2/issuetype/project`, ({ request }) => {
      const url = new URL(request.url);
      const projectId = url.searchParams.get('projectId');

      if (!projectId) {
        return HttpResponse.json(
          { errorMessages: ['projectId parameter is required'] },
          { status: 400 }
        );
      }

      const project = dataStore.getProject(projectId);
      if (!project) {
        return HttpResponse.json(
          { errorMessages: ['Project not found'] },
          { status: 404 }
        );
      }

      // Every mock project shares one global issue type scheme, so the
      // project's type set is all generated issue types (same rationale as
      // /issuetype/page above).
      const issueTypes = dataStore.getAllIssueTypes();
      return HttpResponse.json(issueTypes);
    }),

    // GET /rest/api/2/issuetype - Get all issue types
    http.get(`${baseUrl}/rest/api/2/issuetype`, () => {
      const issueTypes = dataStore.getAllIssueTypes();
      return HttpResponse.json(issueTypes);
    }),

    // GET /rest/api/2/field - Get all fields
    http.get(`${baseUrl}/rest/api/2/field`, () => {
      const fields = dataStore.getAllFields();
      return HttpResponse.json(fields);
    }),

    // GET /rest/api/2/priority - Get all priorities
    http.get(`${baseUrl}/rest/api/2/priority`, () => {
      const priorities = dataStore.getAllPriorities();
      return HttpResponse.json(priorities);
    }),

    // GET /rest/api/2/status - Get all statuses
    http.get(`${baseUrl}/rest/api/2/status`, () => {
      const statuses = dataStore.getAllStatuses();
      return HttpResponse.json(statuses);
    }),

    // GET /rest/api/2/statuscategory - Get all status categories
    http.get(`${baseUrl}/rest/api/2/statuscategory`, () => {
      const statusCategories = dataStore.getAllStatusCategories();
      return HttpResponse.json(statusCategories);
    }),

    // GET /rest/api/2/label - Get all labels
    http.get(`${baseUrl}/rest/api/2/label`, ({ request }) => {
      const url = new URL(request.url);
      const startAt = parseInt(url.searchParams.get('startAt') || '0', 10);
      const maxResults = parseInt(url.searchParams.get('maxResults') || '50', 10);

      // Collect all unique labels from issues
      const issues = dataStore.getAllIssues();
      const labelsSet = new Set<string>();

      issues.forEach((issue) => {
        issue.fields.labels?.forEach((label) => labelsSet.add(label));
      });

      const labels = Array.from(labelsSet).sort();
      const total = labels.length;
      const paginatedLabels = labels.slice(startAt, startAt + maxResults);

      return HttpResponse.json({
        maxResults,
        startAt,
        total,
        isLast: startAt + paginatedLabels.length >= total,
        values: paginatedLabels,
      });
    }),

    // GET /rest/api/2/issue/createmeta - Get create metadata
    http.get(`${baseUrl}/rest/api/2/issue/createmeta`, ({ request }) => {
      const url = new URL(request.url);
      const projectIds = url.searchParams.get('projectIds')?.split(',');
      const projectKeys = url.searchParams.get('projectKeys')?.split(',');
      const issueTypeIds = url.searchParams.get('issuetypeIds')?.split(',');

      let projects = dataStore.getAllProjects();

      // Filter by project IDs or keys if provided (using Set for O(1) lookup)
      if (projectIds) {
        const projectIdSet = new Set(projectIds);
        projects = projects.filter((p) => projectIdSet.has(p.id));
      } else if (projectKeys) {
        const projectKeySet = new Set(projectKeys);
        projects = projects.filter((p) => projectKeySet.has(p.key));
      }

      let issueTypes = dataStore.getAllIssueTypes();

      // Filter by issue type IDs if provided (using Set for O(1) lookup)
      if (issueTypeIds) {
        const issueTypeIdSet = new Set(issueTypeIds);
        issueTypes = issueTypes.filter((it) => issueTypeIdSet.has(it.id));
      }

      const priorities = dataStore.getAllPriorities();
      const users = dataStore.getAllUsers();
      const allComponents = dataStore.getAllComponents();
      const allVersions = dataStore.getAllVersions();
      const context = createGenerationContext(generationSeed);

      const createMeta = createMetaGenerator.generateCreateMeta(
        projects,
        issueTypes,
        priorities,
        users,
        allComponents,
        allVersions,
        context
      );

      return HttpResponse.json(createMeta);
    }),

    // GET /rest/api/2/issue/createmeta/:projectIdOrKey/issuetypes - Get create metadata for project
    http.get(`${baseUrl}/rest/api/2/issue/createmeta/:projectIdOrKey/issuetypes`, ({ params }) => {
      const { projectIdOrKey } = params;

      const project = dataStore.getProject(projectIdOrKey as string);
      if (!project) {
        return HttpResponse.json(
          { errorMessages: ['Project not found'] },
          { status: 404 }
        );
      }

      const issueTypes = dataStore.getAllIssueTypes();
      const priorities = dataStore.getAllPriorities();
      const users = dataStore.getAllUsers();
      const components = dataStore.getComponentsByProject(project.id);
      const versions = dataStore.getVersionsByProject(project.id);
      const context = createGenerationContext(generationSeed);

      const metaIssueTypes = issueTypes.map((issueType) =>
        createMetaGenerator.generateIssueTypeFields(
          issueType,
          project,
          priorities,
          users,
          components,
          versions,
          context
        )
      );

      return HttpResponse.json({
        maxResults: metaIssueTypes.length,
        total: metaIssueTypes.length,
        values: metaIssueTypes,
      });
    }),

    // GET /rest/api/2/issue/createmeta/:projectIdOrKey/issuetypes/:issueTypeId - Get create metadata for specific issue type
    http.get(`${baseUrl}/rest/api/2/issue/createmeta/:projectIdOrKey/issuetypes/:issueTypeId`, ({ params }) => {
      const { projectIdOrKey, issueTypeId } = params;

      const project = dataStore.getProject(projectIdOrKey as string);
      if (!project) {
        return HttpResponse.json(
          { errorMessages: ['Project not found'] },
          { status: 404 }
        );
      }

      const issueType = dataStore.getAllIssueTypes().find((it) => it.id === issueTypeId);
      if (!issueType) {
        return HttpResponse.json(
          { errorMessages: ['Issue type not found'] },
          { status: 404 }
        );
      }

      const priorities = dataStore.getAllPriorities();
      const users = dataStore.getAllUsers();
      const components = dataStore.getComponentsByProject(project.id);
      const versions = dataStore.getVersionsByProject(project.id);
      const context = createGenerationContext(generationSeed);

      const metaIssueType = createMetaGenerator.generateIssueTypeFields(
        issueType,
        project,
        priorities,
        users,
        components,
        versions,
        context
      );

      return HttpResponse.json(metaIssueType);
    }),

    // GET /rest/api/2/issue/:issueIdOrKey/editmeta - Get edit metadata
    http.get(`${baseUrl}/rest/api/2/issue/:issueIdOrKey/editmeta`, ({ params }) => {
      const { issueIdOrKey } = params;

      const issue = dataStore.getIssue(issueIdOrKey as string);
      if (!issue) {
        return HttpResponse.json(
          { errorMessages: ['Issue not found'] },
          { status: 404 }
        );
      }

      const priorities = dataStore.getAllPriorities();
      const users = dataStore.getAllUsers();
      const components = dataStore.getComponentsByProject(issue.fields.project.id);
      const versions = dataStore.getVersionsByProject(issue.fields.project.id);
      const statuses = dataStore.getAllStatuses();
      const context = createGenerationContext(generationSeed);

      const editMeta = editMetaGenerator.generateEditMeta(
        issue,
        priorities,
        users,
        components,
        versions,
        statuses,
        context
      );

      return HttpResponse.json(editMeta);
    }),
  ];
}
