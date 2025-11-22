import { describe, it, expect } from 'vitest';
import { generateMockData } from '../src/index.js';
import type { JiraMockConfig } from '../src/config/types.js';

describe('Data Generation', () => {
  it('should generate mock data successfully', () => {
    const config: JiraMockConfig = {
      version: '1.0',
      projects: [
        {
          projectKey: 'TEST1',
          issueCount: 10,
        },
        {
          projectKey: 'TEST2',
          issueCount: 10,
        },
      ],
    };

    const result = generateMockData(config);

    expect(result.dataStore).toBeDefined();
    expect(result.queryEngine).toBeDefined();
  });

  it('should generate correct number of projects', () => {
    const config: JiraMockConfig = {
      version: '1.0',
      projects: [
        {
          projectKey: 'TEST1',
          issueCount: 5,
        },
        {
          projectKey: 'TEST2',
          issueCount: 5,
        },
        {
          projectKey: 'TEST3',
          issueCount: 5,
        },
      ],
    };

    const { dataStore } = generateMockData(config);
    const projects = dataStore.getAllProjects();

    expect(projects).toHaveLength(3);
  });

  it('should generate correct number of issues per project', () => {
    const config: JiraMockConfig = {
      version: '1.0',
      globalDefaults: {
        issueTypes: {
          epic: {
            count: 0, // Disable epic-based generation
          },
        },
      },
      projects: [
        {
          projectKey: 'TEST1',
          issueCount: 15,
        },
        {
          projectKey: 'TEST2',
          issueCount: 15,
        },
      ],
    };

    const { dataStore } = generateMockData(config);
    const issues = dataStore.getAllIssues();

    expect(issues).toHaveLength(30); // 2 projects * 15 issues
  });

  it('should generate users', () => {
    const config: JiraMockConfig = {
      version: '1.0',
      projects: [
        {
          projectKey: 'TEST',
          issueCount: 5,
        },
      ],
    };

    const { dataStore } = generateMockData(config);
    const users = dataStore.getAllUsers();

    expect(users.length).toBeGreaterThan(0);
  });

  it('should generate metadata', () => {
    const config: JiraMockConfig = {
      version: '1.0',
      projects: [
        {
          projectKey: 'TEST',
          issueCount: 5,
        },
      ],
    };

    const { dataStore } = generateMockData(config);

    expect(dataStore.getAllStatuses().length).toBeGreaterThan(0);
    expect(dataStore.getAllPriorities().length).toBeGreaterThan(0);
    expect(dataStore.getAllIssueTypes().length).toBeGreaterThan(0);
    expect(dataStore.getAllFields().length).toBeGreaterThan(0);
  });

  it('should set a current user', () => {
    const config: JiraMockConfig = {
      version: '1.0',
      projects: [
        {
          projectKey: 'TEST',
          issueCount: 5,
        },
      ],
    };

    const { dataStore } = generateMockData(config);
    const currentUser = dataStore.getCurrentUser();

    expect(currentUser).toBeDefined();
    expect(currentUser?.accountId).toBeDefined();
  });

  it('should generate consistent data with same seed', () => {
    const config: JiraMockConfig = {
      version: '1.0',
      projects: [
        {
          projectKey: 'TEST',
          issueCount: 5,
          seed: 99999,
        },
      ],
    };

    const result1 = generateMockData(config);
    const result2 = generateMockData(config);

    const projects1 = result1.dataStore.getAllProjects();
    const projects2 = result2.dataStore.getAllProjects();

    expect(projects1[0].name).toBe(projects2[0].name);
    expect(projects1[0].key).toBe(projects2[0].key);
  });

  it('should execute JQL queries', () => {
    const config: JiraMockConfig = {
      version: '1.0',
      projects: [
        {
          projectKey: 'TEST1',
          issueCount: 10,
        },
        {
          projectKey: 'TEST2',
          issueCount: 10,
        },
      ],
    };

    const { dataStore, queryEngine } = generateMockData(config);
    const projects = dataStore.getAllProjects();
    const projectKey = projects[0].key;

    const results = queryEngine.executeJQL({
      jql: `project = ${projectKey}`,
      maxResults: 50,
    });

    expect(results.issues.length).toBeGreaterThan(0);
    results.issues.forEach((issue) => {
      expect(issue.fields.project.key).toBe(projectKey);
    });
  });

  it('should generate issues with valid relationships', () => {
    const config: JiraMockConfig = {
      version: '1.0',
      projects: [
        {
          projectKey: 'TEST',
          issueCount: 10,
        },
      ],
    };

    const { dataStore } = generateMockData(config);
    const issues = dataStore.getAllIssues();

    issues.forEach((issue) => {
      expect(issue.id).toBeDefined();
      expect(issue.key).toBeDefined();
      expect(issue.fields.summary).toBeDefined();
      expect(issue.fields.project).toBeDefined();
      expect(issue.fields.issuetype).toBeDefined();
      expect(issue.fields.priority).toBeDefined();
      expect(issue.fields.status).toBeDefined();
      expect(issue.fields.created).toBeDefined();
      expect(issue.fields.updated).toBeDefined();
    });
  });
});
