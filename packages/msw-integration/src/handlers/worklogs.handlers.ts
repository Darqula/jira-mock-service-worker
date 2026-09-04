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
        return HttpResponse.json({ errorMessages: ['Issue does not exist'] }, { status: 404 });
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
        return HttpResponse.json({ errorMessages: ['Issue does not exist'] }, { status: 404 });
      }

      // Validate required fields
      if (!body.timeSpentSeconds) {
        return HttpResponse.json({ errorMessages: ['Time spent is required'] }, { status: 400 });
      }

      const currentUser = dataStore.getCurrentUser();
      if (!currentUser) {
        return HttpResponse.json({ errorMessages: ['User not authenticated'] }, { status: 401 });
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

    // PUT /rest/api/2/issue/:issueIdOrKey/worklog/:worklogId - Update worklog
    http.put(
      `${baseUrl}/rest/api/2/issue/:issueIdOrKey/worklog/:worklogId`,
      async ({ params, request }) => {
        const { issueIdOrKey, worklogId } = params;
        const body = (await request.json()) as Partial<CreateWorklogInput>;

        const issue = dataStore.getIssue(issueIdOrKey as string);
        if (!issue) {
          return HttpResponse.json({ errorMessages: ['Issue does not exist'] }, { status: 404 });
        }

        const currentUser = dataStore.getCurrentUser();
        if (!currentUser) {
          return HttpResponse.json({ errorMessages: ['User not authenticated'] }, { status: 401 });
        }

        const updates: any = {
          updated: new Date().toISOString(),
          updateAuthor: currentUser,
        };

        if (body.timeSpentSeconds) updates.timeSpentSeconds = body.timeSpentSeconds;
        if (body.timeSpent) updates.timeSpent = body.timeSpent;
        if (body.comment !== undefined) updates.comment = body.comment;
        if (body.started) updates.started = body.started;

        const updatedWorklog = dataStore.updateWorklog(worklogId as string, updates);
        if (!updatedWorklog) {
          return HttpResponse.json({ errorMessages: ['Worklog not found'] }, { status: 404 });
        }

        return HttpResponse.json(updatedWorklog);
      }
    ),

    // DELETE /rest/api/2/issue/:issueIdOrKey/worklog/:worklogId - Delete worklog
    http.delete(`${baseUrl}/rest/api/2/issue/:issueIdOrKey/worklog/:worklogId`, ({ params }) => {
      const { issueIdOrKey, worklogId } = params;

      const issue = dataStore.getIssue(issueIdOrKey as string);
      if (!issue) {
        return HttpResponse.json({ errorMessages: ['Issue does not exist'] }, { status: 404 });
      }

      const deleted = dataStore.deleteWorklogById(worklogId as string);
      if (!deleted) {
        return HttpResponse.json({ errorMessages: ['Worklog not found'] }, { status: 404 });
      }

      return HttpResponse.json(null, { status: 204 });
    }),

    // GET /rest/api/2/worklog/updated - Get updated worklogs since timestamp
    http.get(`${baseUrl}/rest/api/2/worklog/updated`, ({ request }) => {
      const url = new URL(request.url);
      const since = parseInt(url.searchParams.get('since') || '0', 10);

      const updatedWorklogs = dataStore.getUpdatedWorklogs(since);
      const until = Date.now();

      return HttpResponse.json({
        values: updatedWorklogs,
        since,
        until,
        isLast: true,
      });
    }),

    // POST /rest/api/2/worklog/list - Get worklogs by IDs
    http.post(`${baseUrl}/rest/api/2/worklog/list`, async ({ request }) => {
      const body = (await request.json()) as { ids: string[] };

      if (!body.ids || !Array.isArray(body.ids)) {
        return HttpResponse.json({ errorMessages: ['ids array is required'] }, { status: 400 });
      }

      const worklogs = dataStore.getWorklogsByIds(body.ids);

      return HttpResponse.json(worklogs);
    }),

    // GET /rest/api/2/worklog/deleted - Get deleted worklog IDs since timestamp
    http.get(`${baseUrl}/rest/api/2/worklog/deleted`, ({ request }) => {
      const url = new URL(request.url);
      const since = parseInt(url.searchParams.get('since') || '0', 10);

      const deletedIds = dataStore.getDeletedWorklogIds(since);
      const until = Date.now();

      return HttpResponse.json({
        values: deletedIds,
        since,
        until,
        isLast: true,
      });
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
