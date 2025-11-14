import { http, HttpResponse } from 'msw';
import type { DataStore, CreateWorklogInput } from '@jira-mock/core';

export function createWorklogsHandlers(dataStore: DataStore, baseUrl: string) {
  return [
    // GET /rest/api/2/issue/:issueIdOrKey/worklog - Get worklogs for issue
    http.get(`${baseUrl}/rest/api/2/issue/:issueIdOrKey/worklog`, ({ params, request }) => {
      const { issueIdOrKey } = params;
      const url = new URL(request.url);
      const startAt = parseInt(url.searchParams.get('startAt') || '0', 10);
      const maxResults = parseInt(url.searchParams.get('maxResults') || '50', 10);

      const issue = dataStore.getIssue(issueIdOrKey as string);

      if (!issue) {
        return HttpResponse.json(
          { errorMessages: ['Issue does not exist'] },
          { status: 404 }
        );
      }

      const worklogs = dataStore.getWorklogsByIssue(issueIdOrKey as string);
      const total = worklogs.length;
      const paginatedWorklogs = worklogs.slice(startAt, startAt + maxResults);

      return HttpResponse.json({
        startAt,
        maxResults,
        total,
        worklogs: paginatedWorklogs,
      });
    }),

    // POST /rest/api/2/issue/:issueIdOrKey/worklog - Add worklog to issue
    http.post(`${baseUrl}/rest/api/2/issue/:issueIdOrKey/worklog`, async ({ params, request }) => {
      const { issueIdOrKey } = params;
      const body = (await request.json()) as CreateWorklogInput;

      const issue = dataStore.getIssue(issueIdOrKey as string);

      if (!issue) {
        return HttpResponse.json(
          { errorMessages: ['Issue does not exist'] },
          { status: 404 }
        );
      }

      // Validate required fields
      if (!body.timeSpentSeconds) {
        return HttpResponse.json(
          { errorMessages: ['Time spent is required'] },
          { status: 400 }
        );
      }

      const currentUser = dataStore.getCurrentUser();
      if (!currentUser) {
        return HttpResponse.json(
          { errorMessages: ['User not authenticated'] },
          { status: 401 }
        );
      }

      // Create worklog
      const worklogId = `${Date.now()}`;
      const now = new Date().toISOString();
      const started = body.started || now;

      const newWorklog = {
        self: `${baseUrl}/rest/api/2/issue/${issue.key}/worklog/${worklogId}`,
        id: worklogId,
        issueId: issue.id,
        author: currentUser,
        updateAuthor: currentUser,
        comment: body.comment,
        created: now,
        updated: now,
        started,
        timeSpent: body.timeSpent || formatTimeSpent(body.timeSpentSeconds),
        timeSpentSeconds: body.timeSpentSeconds,
      };

      dataStore.addWorklog(newWorklog);

      return HttpResponse.json(newWorklog, { status: 201 });
    }),
  ];
}

function formatTimeSpent(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
}
