import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupJiraMockServer } from '@jira-mock/msw-integration/node';

describe('Jira API Integration Example', () => {
  const baseUrl = 'https://your-domain.atlassian.net';

  const { server, dataStore } = setupJiraMockServer({
    config: {
      version: '1.0',
      projects: [
        {
          projectKey: 'PROJ1',
          // issueCount is honored exactly: 2 epics + 8 children = 10 issues
          issueCount: 10,
          seed: 12345, // Reproducible data
          issueTypes: {
            epic: {
              count: 2,
              childrenPerEpic: 4,
            },
          },
        },
        {
          projectKey: 'PROJ2',
          issueCount: 10,
          seed: 12345,
          issueTypes: {
            epic: {
              count: 2,
              childrenPerEpic: 4,
            },
          },
        },
        {
          projectKey: 'PROJ3',
          issueCount: 10,
          seed: 12345,
          issueTypes: {
            epic: {
              count: 2,
              childrenPerEpic: 4,
            },
          },
        },
      ],
    },
    baseUrl,
  });

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe('Projects', () => {
    it('should list all projects', async () => {
      const response = await fetch(`${baseUrl}/rest/api/2/project`);
      const projects = await response.json();

      expect(Array.isArray(projects)).toBe(true);
      expect(projects).toHaveLength(3);
    });

    it('should get project by key', async () => {
      const projects = dataStore.getAllProjects();
      const project = projects[0];

      const response = await fetch(`${baseUrl}/rest/api/2/project/${project.key}`);
      const result = await response.json();

      expect(result.key).toBe(project.key);
      expect(result.name).toBeDefined();
    });
  });

  describe('Issues', () => {
    it('should search issues by project', async () => {
      const project = dataStore.getAllProjects()[0];

      const response = await fetch(`${baseUrl}/rest/api/2/search?jql=project=${project.key}`);
      const result = await response.json();

      // issueCount is honored exactly: 10 issues per project
      expect(result.total).toBe(10);
      result.issues.forEach((issue: any) => {
        expect(issue.fields.project.key).toBe(project.key);
      });
    });

    it('should create a new issue', async () => {
      const project = dataStore.getAllProjects()[0];

      const response = await fetch(`${baseUrl}/rest/api/2/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            project: { key: project.key },
            summary: 'Test issue from example',
            description: 'This is a test issue created in the example',
            issuetype: { name: 'Task' },
          },
        }),
      });

      expect(response.status).toBe(201);

      const result = await response.json();
      expect(result.key).toMatch(new RegExp(`^${project.key}-\\d+$`));
    });

    it('should update an issue', async () => {
      const issue = dataStore.getAllIssues()[0];

      const response = await fetch(`${baseUrl}/rest/api/2/issue/${issue.key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            summary: 'Updated summary',
          },
        }),
      });

      expect(response.status).toBe(204);

      const updatedIssue = dataStore.getIssue(issue.key);
      expect(updatedIssue?.fields.summary).toBe('Updated summary');
    });
  });

  describe('JQL Search', () => {
    it('should search by status', async () => {
      const response = await fetch(`${baseUrl}/rest/api/2/search?jql=status="To Do"`);
      const result = await response.json();

      result.issues.forEach((issue: any) => {
        expect(issue.fields.status.name).toBe('To Do');
      });
    });

    it('should search by assignee', async () => {
      const currentUser = dataStore.getCurrentUser();

      const response = await fetch(`${baseUrl}/rest/api/2/search?jql=assignee=currentUser()`);
      const result = await response.json();

      result.issues.forEach((issue: any) => {
        expect(issue.fields.assignee?.accountId).toBe(currentUser?.accountId);
      });
    });
  });

  describe('Worklogs', () => {
    it('should add a worklog to an issue', async () => {
      const issue = dataStore.getAllIssues()[0];

      const response = await fetch(`${baseUrl}/rest/api/2/issue/${issue.key}/worklog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeSpentSeconds: 3600, // 1 hour
          comment: 'Working on the issue',
          started: new Date().toISOString(),
        }),
      });

      expect(response.status).toBe(201);

      const result = await response.json();
      expect(result.timeSpentSeconds).toBe(3600);
      expect(result.timeSpent).toBe('1h');
    });
  });
});
