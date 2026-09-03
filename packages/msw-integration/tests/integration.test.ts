import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupJiraMockServer } from '../src/setup/node.js';
import type { JiraMockConfig } from '@jira-mock/core';

describe('MSW Integration', () => {
  const config: JiraMockConfig = {
    version: '1.0',
    projects: [
      {
        projectKey: 'TEST1',
        issueCount: 5,
        seed: 12345,
      },
      {
        projectKey: 'TEST2',
        issueCount: 5,
        seed: 12345,
      },
    ],
  };

  const baseUrl = 'https://test.atlassian.net';
  const { server, dataStore } = setupJiraMockServer({ config, baseUrl });

  beforeAll(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it('should get current user', async () => {
    const response = await fetch(`${baseUrl}/rest/api/2/myself`);
    expect(response.status).toBe(200);

    const user = await response.json();
    expect(user.accountId).toBeDefined();
    expect(user.displayName).toBeDefined();
  });

  it('should get all projects', async () => {
    const response = await fetch(`${baseUrl}/rest/api/2/project`);
    expect(response.status).toBe(200);

    const projects = await response.json();
    expect(Array.isArray(projects)).toBe(true);
    expect(projects).toHaveLength(2);
  });

  it('should get project by key', async () => {
    const projects = dataStore.getAllProjects();
    const projectKey = projects[0].key;

    const response = await fetch(`${baseUrl}/rest/api/2/project/${projectKey}`);
    expect(response.status).toBe(200);

    const project = await response.json();
    expect(project.key).toBe(projectKey);
    expect(project.name).toBeDefined();
  });

  it('should get issue by key', async () => {
    const issues = dataStore.getAllIssues();
    const issueKey = issues[0].key;

    const response = await fetch(`${baseUrl}/rest/api/2/issue/${issueKey}`);
    expect(response.status).toBe(200);

    const issue = await response.json();
    expect(issue.key).toBe(issueKey);
    expect(issue.fields.summary).toBeDefined();
  });

  it('should search issues with JQL', async () => {
    const projects = dataStore.getAllProjects();
    const projectKey = projects[0].key;

    const response = await fetch(
      `${baseUrl}/rest/api/2/search?jql=project=${projectKey}`
    );
    expect(response.status).toBe(200);

    const result = await response.json();
    expect(result.issues.length).toBeGreaterThan(0);
    result.issues.forEach((issue: any) => {
      expect(issue.fields.project.key).toBe(projectKey);
    });
  });

  it('should create a new issue', async () => {
    const projects = dataStore.getAllProjects();
    const project = projects[0];
    const issueTypes = dataStore.getAllIssueTypes();
    const issueType = issueTypes.find((it) => !it.subtask);

    const response = await fetch(`${baseUrl}/rest/api/2/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          project: { key: project.key },
          summary: 'Test Issue',
          description: 'This is a test issue',
          issuetype: { id: issueType?.id },
        },
      }),
    });

    expect(response.status).toBe(201);

    const result = await response.json();
    expect(result.key).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('should update an issue', async () => {
    const issues = dataStore.getAllIssues();
    const issue = issues[0];

    const response = await fetch(`${baseUrl}/rest/api/2/issue/${issue.key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          summary: 'Updated Summary',
        },
      }),
    });

    expect(response.status).toBe(204);

    // Verify the update
    const updatedIssue = dataStore.getIssue(issue.key);
    expect(updatedIssue?.fields.summary).toBe('Updated Summary');
  });

  it('should delete an issue', async () => {
    const issues = dataStore.getAllIssues();
    const issue = issues[0];

    const response = await fetch(`${baseUrl}/rest/api/2/issue/${issue.key}`, {
      method: 'DELETE',
    });

    expect(response.status).toBe(204);

    // Verify the deletion
    const deletedIssue = dataStore.getIssue(issue.key);
    expect(deletedIssue).toBeUndefined();
  });

  it('should get all issue types', async () => {
    const response = await fetch(`${baseUrl}/rest/api/2/issuetype`);
    expect(response.status).toBe(200);

    const issueTypes = await response.json();
    expect(issueTypes.length).toBeGreaterThan(0);
    expect(issueTypes[0].name).toBeDefined();
  });

  it('should get all priorities', async () => {
    const response = await fetch(`${baseUrl}/rest/api/2/priority`);
    expect(response.status).toBe(200);

    const priorities = await response.json();
    expect(priorities.length).toBeGreaterThan(0);
    expect(priorities[0].name).toBeDefined();
  });

  it('should get worklogs for an issue', async () => {
    const issues = dataStore.getAllIssues();
    const issue = issues[0];

    const response = await fetch(
      `${baseUrl}/rest/api/2/issue/${issue.key}/worklog`
    );
    expect(response.status).toBe(200);

    const result = await response.json();
    expect(result.worklogs).toBeDefined();
    expect(Array.isArray(result.worklogs)).toBe(true);
  });

  it('should return identical transitions for repeated GETs', async () => {
    const issueKey = dataStore.getAllIssues()[0].key;

    const first = await (
      await fetch(`${baseUrl}/rest/api/2/issue/${issueKey}/transitions`)
    ).json();
    const second = await (
      await fetch(`${baseUrl}/rest/api/2/issue/${issueKey}/transitions`)
    ).json();

    expect(second).toEqual(first);
  });

  it('should create collision-free issues after deletions', async () => {
    const projects = dataStore.getAllProjects();
    const project = projects[0];
    const issueTypes = dataStore.getAllIssueTypes();
    const issueType = issueTypes.find((it) => !it.subtask);

    const create = () =>
      fetch(`${baseUrl}/rest/api/2/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            project: { key: project.key },
            summary: 'Created after deletion',
            issuetype: { id: issueType?.id },
          },
        }),
      });

    const first = await (await create()).json();
    await fetch(`${baseUrl}/rest/api/2/issue/${first.key}`, { method: 'DELETE' });
    const second = await (await create()).json();

    expect(second.key).not.toBe(first.key);
    expect(second.id).not.toBe(first.id);

    const fetched = await fetch(`${baseUrl}/rest/api/2/issue/${second.key}`);
    expect(fetched.status).toBe(200);
  });

  it('should search issues via POST /rest/api/2/search', async () => {
    const projects = dataStore.getAllProjects();
    const projectKey = projects[0].key;

    const response = await fetch(`${baseUrl}/rest/api/2/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jql: `project=${projectKey}`, maxResults: 3 }),
    });
    expect(response.status).toBe(200);

    const result = await response.json();
    expect(result.total).toBeGreaterThan(0);
    expect(result.issues).toHaveLength(3);
    result.issues.forEach((issue: any) => {
      expect(issue.fields.project.key).toBe(projectKey);
    });
  });

  it('should list and fetch resolutions', async () => {
    const listResponse = await fetch(`${baseUrl}/rest/api/2/resolution`);
    expect(listResponse.status).toBe(200);
    const resolutions = await listResponse.json();
    expect(resolutions.length).toBeGreaterThan(0);
    expect(resolutions[0].id).toBeDefined();
    expect(resolutions[0].name).toBeDefined();

    const singleResponse = await fetch(
      `${baseUrl}/rest/api/2/resolution/${resolutions[0].id}`
    );
    expect(singleResponse.status).toBe(200);
    expect((await singleResponse.json()).id).toBe(resolutions[0].id);

    const missingResponse = await fetch(`${baseUrl}/rest/api/2/resolution/999999`);
    expect(missingResponse.status).toBe(404);
  });

  it('should echo uploaded file metadata when posting attachments', async () => {
    const issueKey = dataStore.getAllIssues()[0].key;
    const form = new FormData();
    form.append('file', new File(['hello world'], 'report.txt', { type: 'text/plain' }));

    const response = await fetch(
      `${baseUrl}/rest/api/2/issue/${issueKey}/attachments`,
      { method: 'POST', body: form }
    );
    expect(response.status).toBe(200);

    const result = await response.json();
    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('report.txt');
    expect(result[0].size).toBe(11);
    expect(result[0].mimeType).toBe('text/plain');
  });
});
