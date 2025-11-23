import { http, HttpResponse } from 'msw';
import type { DataStore, CreateIssueInput, UpdateIssueInput } from '@jira-mock/core';

export function createIssuesHandlers(dataStore: DataStore, baseUrl: string) {
  return [
    // GET /rest/api/2/issue/picker - Issue picker suggestions
    // NOTE: This MUST come before /rest/api/2/issue/:issueIdOrKey to avoid route collision
    http.get(`${baseUrl}/rest/api/2/issue/picker`, ({ request }) => {
      const url = new URL(request.url);
      const query = url.searchParams.get('query') || '';
      const currentProjectKey = url.searchParams.get('currentProjectKey');

      let issues = dataStore.getAllIssues();

      // Filter by project if specified
      if (currentProjectKey) {
        issues = issues.filter((issue) => issue.fields.project.key === currentProjectKey);
      }

      // Filter by query
      if (query) {
        const lowerQuery = query.toLowerCase();
        issues = issues.filter(
          (issue) =>
            issue.key.toLowerCase().includes(lowerQuery) ||
            issue.fields.summary.toLowerCase().includes(lowerQuery)
        );
      }

      // Limit to 10 results
      issues = issues.slice(0, 10);

      return HttpResponse.json({
        sections: [
          {
            label: 'Current Search',
            sub: 'Search results',
            id: 'cs',
            issues: issues.map((issue) => ({
              id: parseInt(issue.id, 10),
              key: issue.key,
              keyHtml: issue.key,
              img: issue.fields.issuetype.iconUrl,
              summary: issue.fields.summary,
              summaryText: issue.fields.summary,
            })),
          },
        ],
      });
    }),

    // GET /rest/api/2/issue/:issueIdOrKey - Get issue
    http.get(`${baseUrl}/rest/api/2/issue/:issueIdOrKey`, ({ params, request }) => {
      const { issueIdOrKey } = params;
      const url = new URL(request.url);
      const expand = url.searchParams.get('expand');

      const issue = dataStore.getIssue(issueIdOrKey as string);

      if (!issue) {
        return HttpResponse.json(
          { errorMessages: ['Issue does not exist'] },
          { status: 404 }
        );
      }

      // Handle expand parameter (basic implementation)
      let responseIssue = issue;
      if (expand) {
        // In a full implementation, we'd handle various expand options
        // For now, just return the issue as-is
        responseIssue = issue;
      }

      return HttpResponse.json(responseIssue);
    }),

    // POST /rest/api/2/issue - Create issue
    http.post(`${baseUrl}/rest/api/2/issue`, async ({ request }) => {
      const body = (await request.json()) as CreateIssueInput;

      // Validate required fields
      if (!body.fields?.project || !body.fields?.summary || !body.fields?.issuetype) {
        return HttpResponse.json(
          {
            errorMessages: [],
            errors: {
              project: body.fields?.project ? undefined : 'Project is required',
              summary: body.fields?.summary ? undefined : 'Summary is required',
              issuetype: body.fields?.issuetype ? undefined : 'Issue type is required',
            },
          },
          { status: 400 }
        );
      }

      // Find project
      const projectKey = body.fields.project.key || body.fields.project.id;
      const project = projectKey ? dataStore.getProject(projectKey) : undefined;

      if (!project) {
        return HttpResponse.json(
          { errorMessages: ['Project not found'] },
          { status: 404 }
        );
      }

      // Find issue type (build Map for O(1) lookup)
      const issueTypes = dataStore.getAllIssueTypes();
      const issueTypeMap = new Map(issueTypes.flatMap(it => [[it.id, it], [it.name, it]]));
      const issueType = (body.fields.issuetype.id && issueTypeMap.get(body.fields.issuetype.id)) ||
                        (body.fields.issuetype.name && issueTypeMap.get(body.fields.issuetype.name));

      if (!issueType) {
        return HttpResponse.json(
          { errorMessages: ['Issue type not found'] },
          { status: 404 }
        );
      }

      // Find priority (build Map for O(1) lookup)
      const priorities = dataStore.getAllPriorities();
      const priorityMap = new Map(priorities.flatMap(p => [[p.id, p], [p.name, p]]));
      const priority =
        body.fields.priority
          ? (body.fields.priority.id && priorityMap.get(body.fields.priority.id)) ||
            (body.fields.priority.name && priorityMap.get(body.fields.priority.name)) ||
            priorities[2]
          : priorities[2];

      // Find or default status
      const statuses = dataStore.getAllStatuses();
      const status = statuses[0]; // Default to first status

      // Find assignee
      let assignee;
      if (body.fields.assignee) {
        const assigneeId = body.fields.assignee.accountId || body.fields.assignee.id;
        assignee = assigneeId ? dataStore.getUser(assigneeId) : undefined;
      }

      // Get current user as reporter
      const reporter = dataStore.getCurrentUser() || undefined;

      // Generate new issue
      const issueCount = dataStore.getAllIssues().length;
      const issueNumber = issueCount + 1;
      const issueKey = `${project.key}-${issueNumber}`;
      const issueId = `${10000 + issueCount}`;

      const newIssue = {
        id: issueId,
        key: issueKey,
        self: `${baseUrl}/rest/api/2/issue/${issueKey}`,
        fields: {
          summary: body.fields.summary,
          description: body.fields.description,
          issuetype: issueType,
          project: {
            self: project.self,
            id: project.id,
            key: project.key,
            name: project.name,
            projectTypeKey: project.projectTypeKey,
            simplified: project.simplified,
            avatarUrls: project.avatarUrls,
            style: project.style,
          },
          reporter,
          assignee,
          priority,
          status,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          labels: body.fields.labels || [],
          components: [],
          versions: [],
          fixVersions: [],
        },
      };

      dataStore.addIssue(newIssue);

      return HttpResponse.json(
        {
          id: newIssue.id,
          key: newIssue.key,
          self: newIssue.self,
        },
        { status: 201 }
      );
    }),

    // PUT /rest/api/2/issue/:issueIdOrKey - Update issue
    http.put(`${baseUrl}/rest/api/2/issue/:issueIdOrKey`, async ({ params, request }) => {
      const { issueIdOrKey } = params;
      const body = (await request.json()) as UpdateIssueInput;

      const issue = dataStore.getIssue(issueIdOrKey as string);

      if (!issue) {
        return HttpResponse.json(
          { errorMessages: ['Issue does not exist'] },
          { status: 404 }
        );
      }

      // Update fields
      const updates: any = {};

      if (body.fields) {
        const fields = body.fields;
        if (fields.summary) {
          updates.fields = { ...issue.fields, summary: fields.summary };
        }
        if (fields.description !== undefined) {
          updates.fields = {
            ...(updates.fields || issue.fields),
            description: fields.description,
          };
        }
        if (fields.assignee) {
          const assigneeId = fields.assignee.accountId || fields.assignee.id;
          const assignee = assigneeId ? dataStore.getUser(assigneeId) : undefined;
          updates.fields = { ...(updates.fields || issue.fields), assignee };
        }
        if (fields.priority) {
          const priorities = dataStore.getAllPriorities();
          const priority = priorities.find(
            (p) => p.id === fields.priority?.id || p.name === fields.priority?.name
          );
          if (priority) {
            updates.fields = { ...(updates.fields || issue.fields), priority };
          }
        }
        if (fields.labels) {
          updates.fields = { ...(updates.fields || issue.fields), labels: fields.labels };
        }
      }

      dataStore.updateIssue(issueIdOrKey as string, updates);

      return HttpResponse.json(null, { status: 204 });
    }),

    // DELETE /rest/api/2/issue/:issueIdOrKey - Delete issue
    http.delete(`${baseUrl}/rest/api/2/issue/:issueIdOrKey`, ({ params }) => {
      const { issueIdOrKey } = params;

      const deleted = dataStore.deleteIssue(issueIdOrKey as string);

      if (!deleted) {
        return HttpResponse.json(
          { errorMessages: ['Issue does not exist'] },
          { status: 404 }
        );
      }

      return HttpResponse.json(null, { status: 204 });
    }),
  ];
}
