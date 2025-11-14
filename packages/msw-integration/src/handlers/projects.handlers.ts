import { http, HttpResponse } from 'msw';
import type { DataStore } from '@jira-mock/core';

export function createProjectsHandlers(dataStore: DataStore, baseUrl: string) {
  return [
    // GET /rest/api/2/project - Get all projects
    http.get(`${baseUrl}/rest/api/2/project`, ({ request }) => {
      const url = new URL(request.url);
      const startAt = parseInt(url.searchParams.get('startAt') || '0', 10);
      const maxResults = parseInt(url.searchParams.get('maxResults') || '50', 10);

      const allProjects = dataStore.getAllProjects();
      const total = allProjects.length;
      const projects = allProjects.slice(startAt, startAt + maxResults);
      const isLast = startAt + projects.length >= total;

      return HttpResponse.json({
        self: `${baseUrl}/rest/api/2/project`,
        maxResults,
        startAt,
        total,
        isLast,
        values: projects,
      });
    }),

    // GET /rest/api/2/project/:projectIdOrKey - Get project by ID or key
    http.get(`${baseUrl}/rest/api/2/project/:projectIdOrKey`, ({ params }) => {
      const { projectIdOrKey } = params;
      const project = dataStore.getProject(projectIdOrKey as string);

      if (!project) {
        return HttpResponse.json(
          { errorMessages: ['Project not found'] },
          { status: 404 }
        );
      }

      return HttpResponse.json(project);
    }),

    // GET /rest/api/2/project/:projectIdOrKey/statuses - Get project statuses
    http.get(`${baseUrl}/rest/api/2/project/:projectIdOrKey/statuses`, ({ params }) => {
      const { projectIdOrKey } = params;
      const project = dataStore.getProject(projectIdOrKey as string);

      if (!project) {
        return HttpResponse.json(
          { errorMessages: ['Project not found'] },
          { status: 404 }
        );
      }

      const issueTypes = dataStore.getAllIssueTypes();
      const statuses = dataStore.getAllStatuses();

      // Return statuses grouped by issue type
      const result = issueTypes.map((issueType) => ({
        self: `${baseUrl}/rest/api/2/issuetype/${issueType.id}`,
        id: issueType.id,
        name: issueType.name,
        subtask: issueType.subtask,
        statuses: statuses,
      }));

      return HttpResponse.json(result);
    }),
  ];
}
