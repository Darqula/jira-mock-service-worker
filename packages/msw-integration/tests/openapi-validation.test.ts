import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupJiraMockServer } from '../src/setup/node.js';
import { OpenAPIValidator } from './helpers/openapi-validator.js';
import type { JiraMockConfig } from '@jira-mock/core';
import { join } from 'path';

describe('OpenAPI Schema Validation', () => {
  const config: JiraMockConfig = {
    version: '1.0',
    projects: [
      {
        projectKey: 'TEST',
        seed: 12345,
        issueCount: 10,
      },
      {
        projectKey: 'DEMO',
        seed: 12345,
        issueCount: 5,
      },
    ],
  };

  const baseUrl = 'https://test.atlassian.net';
  const { server, dataStore } = setupJiraMockServer({ config, baseUrl });

  // Initialize OpenAPI validator
  const specPath = join(process.cwd(), '../../jira_cloud_swagger.json');
  const validator = new OpenAPIValidator(specPath);

  beforeAll(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe('User Endpoints', () => {
    it('GET /rest/api/2/myself should match OpenAPI schema', async () => {
      const response = await fetch(`${baseUrl}/rest/api/2/myself`);
      expect(response.status).toBe(200);

      const data = await response.json();
      const result = validator.validateResponse(
        '/rest/api/2/myself',
        'GET',
        200,
        data
      );

      if (!result.valid) {
        console.error('Validation errors:', result.errors);
      }
      expect(result.valid).toBe(true);
    });

    it('GET /rest/api/2/user should match OpenAPI schema', async () => {
      const users = dataStore.getAllUsers();
      const user = users[0];

      const response = await fetch(
        `${baseUrl}/rest/api/2/user?accountId=${user.accountId}`
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      const result = validator.validateResponse('/rest/api/2/user', 'GET', 200, data);

      if (!result.valid) {
        console.error('Validation errors:', result.errors);
      }
      expect(result.valid).toBe(true);
    });

    it('GET /rest/api/2/user/search should match OpenAPI schema', async () => {
      const response = await fetch(`${baseUrl}/rest/api/2/user/search?query=test`);
      expect(response.status).toBe(200);

      const data = await response.json();
      const result = validator.validateResponse(
        '/rest/api/2/user/search',
        'GET',
        200,
        data
      );

      if (!result.valid) {
        console.error('Validation errors:', result.errors);
      }
      expect(result.valid).toBe(true);
    });
  });

  describe('Project Endpoints', () => {
    it('GET /rest/api/2/project should match OpenAPI schema', async () => {
      const response = await fetch(`${baseUrl}/rest/api/2/project`);
      expect(response.status).toBe(200);

      const data = await response.json();
      const result = validator.validateResponse('/rest/api/2/project', 'GET', 200, data);

      if (!result.valid) {
        console.error('Validation errors:', result.errors);
      }
      expect(result.valid).toBe(true);
    });

    it('GET /rest/api/2/project/search should match OpenAPI schema', async () => {
      const response = await fetch(`${baseUrl}/rest/api/2/project/search`);
      expect(response.status).toBe(200);

      const data = await response.json();
      const result = validator.validateResponse(
        '/rest/api/2/project/search',
        'GET',
        200,
        data
      );

      if (!result.valid) {
        console.error('Validation errors:', result.errors);
      }
      expect(result.valid).toBe(true);
    });

    it('GET /rest/api/2/project/{projectIdOrKey} should match OpenAPI schema', async () => {
      const projects = dataStore.getAllProjects();
      const project = projects[0];

      const response = await fetch(`${baseUrl}/rest/api/2/project/${project.key}`);
      expect(response.status).toBe(200);

      const data = await response.json();
      const result = validator.validateResponse(
        `/rest/api/2/project/${project.key}`,
        'GET',
        200,
        data
      );

      if (!result.valid) {
        console.error('Validation errors:', result.errors);
      }
      expect(result.valid).toBe(true);
    });

    it('GET /rest/api/2/project/{projectIdOrKey}/statuses should match OpenAPI schema', async () => {
      const projects = dataStore.getAllProjects();
      const project = projects[0];

      const response = await fetch(
        `${baseUrl}/rest/api/2/project/${project.key}/statuses`
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      const result = validator.validateResponse(
        `/rest/api/2/project/${project.key}/statuses`,
        'GET',
        200,
        data
      );

      if (!result.valid) {
        console.error('Validation errors:', result.errors);
      }
      expect(result.valid).toBe(true);
    });
  });

  describe('Issue Endpoints', () => {
    it('GET /rest/api/2/issue/{issueIdOrKey} should match OpenAPI schema', async () => {
      const issues = dataStore.getAllIssues();
      const issue = issues[0];

      const response = await fetch(`${baseUrl}/rest/api/2/issue/${issue.key}`);
      expect(response.status).toBe(200);

      const data = await response.json();
      const result = validator.validateResponse(
        `/rest/api/2/issue/${issue.key}`,
        'GET',
        200,
        data
      );

      if (!result.valid) {
        console.error('Validation errors:', result.errors);
      }
      expect(result.valid).toBe(true);
    });

    it('POST /rest/api/2/issue should match OpenAPI schema', async () => {
      const projects = dataStore.getAllProjects();
      const project = projects[0];

      const response = await fetch(`${baseUrl}/rest/api/2/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            project: { key: project.key },
            summary: 'Test Issue',
            description: 'Test Description',
            issuetype: { name: 'Task' },
          },
        }),
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      const result = validator.validateResponse('/rest/api/2/issue', 'POST', 201, data);

      if (!result.valid) {
        console.error('Validation errors:', result.errors);
      }
      expect(result.valid).toBe(true);
    });

    it('PUT /rest/api/2/issue/{issueIdOrKey} should return 204', async () => {
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
    });

    it('GET /rest/api/2/issue/picker should match OpenAPI schema', async () => {
      const response = await fetch(`${baseUrl}/rest/api/2/issue/picker?query=test`);
      expect(response.status).toBe(200);

      const data = await response.json();
      const result = validator.validateResponse(
        '/rest/api/2/issue/picker',
        'GET',
        200,
        data
      );

      if (!result.valid) {
        console.error('Validation errors:', result.errors);
      }
      expect(result.valid).toBe(true);
    });
  });

  describe('Search Endpoints', () => {
    it('GET /rest/api/2/search should match OpenAPI schema', async () => {
      const projects = dataStore.getAllProjects();
      const project = projects[0];

      const response = await fetch(
        `${baseUrl}/rest/api/2/search?jql=project=${project.key}`
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      const result = validator.validateResponse('/rest/api/2/search', 'GET', 200, data);

      if (!result.valid) {
        console.error('Validation errors:', result.errors);
      }
      expect(result.valid).toBe(true);
    });
  });

  describe('Metadata Endpoints', () => {
    it('GET /rest/api/2/issuetype should match OpenAPI schema', async () => {
      const response = await fetch(`${baseUrl}/rest/api/2/issuetype`);
      expect(response.status).toBe(200);

      const data = await response.json();
      const result = validator.validateResponse(
        '/rest/api/2/issuetype',
        'GET',
        200,
        data
      );

      if (!result.valid) {
        console.error('Validation errors:', result.errors);
      }
      expect(result.valid).toBe(true);
    });

    it('GET /rest/api/2/priority should match OpenAPI schema', async () => {
      const response = await fetch(`${baseUrl}/rest/api/2/priority`);
      expect(response.status).toBe(200);

      const data = await response.json();
      const result = validator.validateResponse('/rest/api/2/priority', 'GET', 200, data);

      if (!result.valid) {
        console.error('Validation errors:', result.errors);
      }
      expect(result.valid).toBe(true);
    });

    it('GET /rest/api/2/field should match OpenAPI schema', async () => {
      const response = await fetch(`${baseUrl}/rest/api/2/field`);
      expect(response.status).toBe(200);

      const data = await response.json();
      const result = validator.validateResponse('/rest/api/2/field', 'GET', 200, data);

      if (!result.valid) {
        console.error('Validation errors:', result.errors);
      }
      expect(result.valid).toBe(true);
    });

    it('GET /rest/api/2/statuscategory should match OpenAPI schema', async () => {
      const response = await fetch(`${baseUrl}/rest/api/2/statuscategory`);
      expect(response.status).toBe(200);

      const data = await response.json();
      const result = validator.validateResponse(
        '/rest/api/2/statuscategory',
        'GET',
        200,
        data
      );

      if (!result.valid) {
        console.error('Validation errors:', result.errors);
      }
      expect(result.valid).toBe(true);
    });
  });

  describe('Worklog Endpoints', () => {
    it('GET /rest/api/2/issue/{issueIdOrKey}/worklog should match OpenAPI schema', async () => {
      const issues = dataStore.getAllIssues();
      const issue = issues[0];

      const response = await fetch(
        `${baseUrl}/rest/api/2/issue/${issue.key}/worklog`
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      const result = validator.validateResponse(
        `/rest/api/2/issue/${issue.key}/worklog`,
        'GET',
        200,
        data
      );

      if (!result.valid) {
        console.error('Validation errors:', result.errors);
      }
      expect(result.valid).toBe(true);
    });

    it('POST /rest/api/2/issue/{issueIdOrKey}/worklog should match OpenAPI schema', async () => {
      const issues = dataStore.getAllIssues();
      const issue = issues[0];

      const response = await fetch(
        `${baseUrl}/rest/api/2/issue/${issue.key}/worklog`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timeSpentSeconds: 3600,
            comment: 'Test worklog',
            started: new Date().toISOString(),
          }),
        }
      );

      expect(response.status).toBe(201);

      const data = await response.json();
      const result = validator.validateResponse(
        `/rest/api/2/issue/${issue.key}/worklog`,
        'POST',
        201,
        data
      );

      if (!result.valid) {
        console.error('Validation errors:', result.errors);
      }
      expect(result.valid).toBe(true);
    });
  });

  describe('Version Endpoints', () => {
    it('GET /rest/api/2/project/{projectIdOrKey}/versions should match OpenAPI schema', async () => {
      const projects = dataStore.getAllProjects();
      const project = projects[0];

      const response = await fetch(
        `${baseUrl}/rest/api/2/project/${project.key}/versions`
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      const result = validator.validateResponse(
        `/rest/api/2/project/${project.key}/versions`,
        'GET',
        200,
        data
      );

      if (!result.valid) {
        console.error('Validation errors:', result.errors);
      }
      expect(result.valid).toBe(true);
    });
  });

  describe('Component Endpoints', () => {
    it('GET /rest/api/2/project/{projectIdOrKey}/components should match OpenAPI schema', async () => {
      const projects = dataStore.getAllProjects();
      const project = projects[0];

      const response = await fetch(
        `${baseUrl}/rest/api/2/project/${project.key}/components`
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      const result = validator.validateResponse(
        `/rest/api/2/project/${project.key}/components`,
        'GET',
        200,
        data
      );

      if (!result.valid) {
        console.error('Validation errors:', result.errors);
      }
      expect(result.valid).toBe(true);
    });
  });

  describe('Permission Endpoints', () => {
    it('GET /rest/api/2/mypermissions should match OpenAPI schema', async () => {
      const response = await fetch(`${baseUrl}/rest/api/2/mypermissions`);
      expect(response.status).toBe(200);

      const data = await response.json();
      const result = validator.validateResponse(
        '/rest/api/2/mypermissions',
        'GET',
        200,
        data
      );

      if (!result.valid) {
        console.error('Validation errors:', result.errors);
      }
      expect(result.valid).toBe(true);
    });
  });

  describe('Transitions Endpoints', () => {
    it('GET /rest/api/2/issue/{issueIdOrKey}/transitions should match OpenAPI schema', async () => {
      const issues = dataStore.getAllIssues();
      const issue = issues[0];

      const response = await fetch(
        `${baseUrl}/rest/api/2/issue/${issue.key}/transitions`
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      const result = validator.validateResponse(
        `/rest/api/2/issue/${issue.key}/transitions`,
        'GET',
        200,
        data
      );

      if (!result.valid) {
        console.error('Validation errors:', result.errors);
      }
      expect(result.valid).toBe(true);
    });
  });
});
