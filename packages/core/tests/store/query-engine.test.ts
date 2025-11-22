import { describe, it, expect, beforeEach } from 'vitest';
import { QueryEngine } from '../../src/store/query-engine.js';
import { DataStore } from '../../src/store/data-store.js';
import type { IssueBean, User, Project, Status, Priority, IssueType } from '../../src/types/jira-schemas.js';

describe('QueryEngine', () => {
  let dataStore: DataStore;
  let queryEngine: QueryEngine;
  let testUser: User;
  let testProject: Project;
  let testStatus: Status;
  let testPriority: Priority;
  let testIssueType: IssueType;

  beforeEach(() => {
    dataStore = new DataStore();
    queryEngine = new QueryEngine(dataStore);

    // Setup test data
    testUser = {
      accountId: 'user-123',
      displayName: 'Test User',
      emailAddress: 'test@example.com',
      active: true,
      self: 'https://test.atlassian.net/rest/api/2/user?accountId=user-123',
    };

    testProject = {
      id: '1',
      key: 'TEST',
      name: 'Test Project',
      projectTypeKey: 'software',
      self: 'https://test.atlassian.net/rest/api/2/project/1',
    };

    testStatus = {
      id: '1',
      name: 'To Do',
      statusCategory: {
        id: 1,
        key: 'new',
        name: 'To Do',
        colorName: 'blue-gray',
        self: 'https://test.atlassian.net/rest/api/2/statuscategory/1',
      },
      self: 'https://test.atlassian.net/rest/api/2/status/1',
    };

    testPriority = {
      id: '3',
      name: 'High',
      iconUrl: 'https://test.atlassian.net/images/icons/priorities/high.svg',
      self: 'https://test.atlassian.net/rest/api/2/priority/3',
    };

    testIssueType = {
      id: '1',
      name: 'Bug',
      subtask: false,
      iconUrl: 'https://test.atlassian.net/images/icons/issuetypes/bug.svg',
      self: 'https://test.atlassian.net/rest/api/2/issuetype/1',
    };

    dataStore.addUser(testUser);
    dataStore.setCurrentUser(testUser);
    dataStore.addProject(testProject);
    dataStore.addStatus(testStatus);
    dataStore.addPriority(testPriority);
    dataStore.addIssueType(testIssueType);
  });

  describe('Basic JQL queries', () => {
    it('should filter by project key', () => {
      const issue1: IssueBean = createTestIssue('TEST-1', testProject);
      const issue2: IssueBean = createTestIssue('OTHER-2', { ...testProject, key: 'OTHER' }); // Use OTHER-2 to avoid ID collision

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);

      const results = queryEngine.executeJQL({ jql: 'project = TEST' });

      expect(results.total).toBe(1);
      expect(results.issues[0].key).toBe('TEST-1');
    });

    it('should filter by status', () => {
      const issue1 = createTestIssue('TEST-1', testProject);
      issue1.fields.status = testStatus;
      const issue2 = createTestIssue('TEST-2', testProject);
      issue2.fields.status = { ...testStatus, name: 'Done' };

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);

      const results = queryEngine.executeJQL({ jql: 'status = "To Do"' });

      expect(results.total).toBe(1);
      expect(results.issues[0].key).toBe('TEST-1');
    });

    it('should filter by assignee', () => {
      const issue1 = createTestIssue('TEST-1', testProject);
      issue1.fields.assignee = testUser;
      const issue2 = createTestIssue('TEST-2', testProject);
      issue2.fields.assignee = null;

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);

      const results = queryEngine.executeJQL({ jql: 'assignee = currentUser()' });

      expect(results.total).toBe(1);
      expect(results.issues[0].key).toBe('TEST-1');
    });

    it('should filter by priority', () => {
      const issue1 = createTestIssue('TEST-1', testProject);
      issue1.fields.priority = testPriority;
      const issue2 = createTestIssue('TEST-2', testProject);
      issue2.fields.priority = { ...testPriority, name: 'Low' };

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);

      const results = queryEngine.executeJQL({ jql: 'priority = High' });

      expect(results.total).toBe(1);
      expect(results.issues[0].key).toBe('TEST-1');
    });

    it('should filter by issue type', () => {
      const issue1 = createTestIssue('TEST-1', testProject);
      issue1.fields.issuetype = testIssueType;
      const issue2 = createTestIssue('TEST-2', testProject);
      issue2.fields.issuetype = { ...testIssueType, name: 'Task' };

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);

      const results = queryEngine.executeJQL({ jql: 'issuetype = Bug' });

      expect(results.total).toBe(1);
      expect(results.issues[0].key).toBe('TEST-1');
    });

    it('should filter by labels', () => {
      const issue1 = createTestIssue('TEST-1', testProject);
      issue1.fields.labels = ['frontend', 'urgent'];
      const issue2 = createTestIssue('TEST-2', testProject);
      issue2.fields.labels = ['backend'];

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);

      const results = queryEngine.executeJQL({ jql: 'labels = frontend' });

      expect(results.total).toBe(1);
      expect(results.issues[0].key).toBe('TEST-1');
    });

    it('should filter by key IN clause', () => {
      const issue1 = createTestIssue('TEST-1', testProject);
      const issue2 = createTestIssue('TEST-2', testProject);
      const issue3 = createTestIssue('TEST-3', testProject);

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);
      dataStore.addIssue(issue3);

      const results = queryEngine.executeJQL({ jql: 'key IN (TEST-1, TEST-3)' });

      expect(results.total).toBe(2);
      expect(results.issues.map(i => i.key)).toEqual(['TEST-1', 'TEST-3']);
    });
  });

  describe('Complex JQL queries', () => {
    it('should combine multiple filters', () => {
      const issue1 = createTestIssue('TEST-1', testProject);
      issue1.fields.status = testStatus;
      issue1.fields.assignee = testUser;
      issue1.fields.priority = testPriority;

      const issue2 = createTestIssue('TEST-2', testProject);
      issue2.fields.status = { ...testStatus, name: 'Done' };
      issue2.fields.assignee = testUser;

      const issue3 = createTestIssue('TEST-3', testProject);
      issue3.fields.status = testStatus;
      issue3.fields.assignee = null;

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);
      dataStore.addIssue(issue3);

      const results = queryEngine.executeJQL({
        jql: 'project = TEST AND status = "To Do" AND assignee = currentUser() AND priority = High',
      });

      expect(results.total).toBe(1);
      expect(results.issues[0].key).toBe('TEST-1');
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      // Add 10 test issues
      for (let i = 1; i <= 10; i++) {
        const issue = createTestIssue(`TEST-${i}`, testProject);
        dataStore.addIssue(issue);
      }
    });

    it('should respect maxResults parameter', () => {
      const results = queryEngine.executeJQL({
        jql: 'project = TEST',
        maxResults: 5,
      });

      expect(results.issues.length).toBe(5);
      expect(results.total).toBe(10);
      expect(results.maxResults).toBe(5);
    });

    it('should respect startAt parameter', () => {
      const results = queryEngine.executeJQL({
        jql: 'project = TEST',
        startAt: 5,
        maxResults: 5,
      });

      expect(results.issues.length).toBe(5);
      expect(results.startAt).toBe(5);
      expect(results.total).toBe(10);
      expect(results.issues[0].key).toBe('TEST-6');
    });

    it('should default to startAt=0 and maxResults=50', () => {
      const results = queryEngine.executeJQL({ jql: 'project = TEST' });

      expect(results.startAt).toBe(0);
      expect(results.maxResults).toBe(50);
    });
  });

  describe('Edge cases', () => {
    it('should return empty results for no matches', () => {
      const issue = createTestIssue('TEST-1', testProject);
      dataStore.addIssue(issue);

      const results = queryEngine.executeJQL({ jql: 'project = NONEXISTENT' });

      expect(results.total).toBe(0);
      expect(results.issues).toEqual([]);
    });

    it('should handle empty JQL', () => {
      const issue = createTestIssue('TEST-1', testProject);
      dataStore.addIssue(issue);

      const results = queryEngine.executeJQL({ jql: '' });

      // Should return all issues when no filters
      expect(results.total).toBe(1);
    });

    it('should handle case-insensitive JQL', () => {
      const issue = createTestIssue('TEST-1', testProject);
      dataStore.addIssue(issue);

      const results = queryEngine.executeJQL({ jql: 'PROJECT = test' });

      expect(results.total).toBe(1);
    });
  });
});

// Helper function to create test issues
function createTestIssue(key: string, project: Project): IssueBean {
  return {
    id: key.split('-')[1],
    key,
    self: `https://test.atlassian.net/rest/api/2/issue/${key}`,
    fields: {
      summary: `Test issue ${key}`,
      description: 'Test description',
      project,
      issuetype: {
        id: '1',
        name: 'Task',
        subtask: false,
        self: 'https://test.atlassian.net/rest/api/2/issuetype/1',
      },
      status: {
        id: '1',
        name: 'To Do',
        statusCategory: {
          id: 1,
          key: 'new',
          name: 'To Do',
          colorName: 'blue-gray',
          self: 'https://test.atlassian.net/rest/api/2/statuscategory/1',
        },
        self: 'https://test.atlassian.net/rest/api/2/status/1',
      },
      priority: {
        id: '3',
        name: 'Medium',
        self: 'https://test.atlassian.net/rest/api/2/priority/3',
      },
      assignee: null,
      reporter: {
        accountId: 'reporter-123',
        displayName: 'Reporter User',
        emailAddress: 'reporter@example.com',
        active: true,
        self: 'https://test.atlassian.net/rest/api/2/user?accountId=reporter-123',
      },
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      labels: [],
    },
  };
}
