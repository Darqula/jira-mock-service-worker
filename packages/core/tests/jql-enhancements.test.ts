import { describe, it, expect, beforeEach } from 'vitest';
import { QueryEngine } from '../src/store/query-engine.js';
import { DataStore } from '../src/store/data-store.js';
import type { IssueBean, User, Project, Status, Priority, IssueType } from '../src/types/jira-schemas.js';

describe('JQL Enhancements', () => {
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

  describe('!= (Not Equals) Operator', () => {
    it('should filter by status != Done', () => {
      const issue1 = createTestIssue('TEST-1', testProject);
      issue1.fields.status = { ...testStatus, name: 'To Do' };

      const issue2 = createTestIssue('TEST-2', testProject);
      issue2.fields.status = { ...testStatus, name: 'Done' };

      const issue3 = createTestIssue('TEST-3', testProject);
      issue3.fields.status = { ...testStatus, name: 'In Progress' };

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);
      dataStore.addIssue(issue3);

      const results = queryEngine.executeJQL({ jql: 'status != Done' });

      expect(results.total).toBe(2);
      expect(results.issues.map((i) => i.key)).toEqual(['TEST-1', 'TEST-3']);
    });

    it('should filter by priority != Low', () => {
      const issue1 = createTestIssue('TEST-1', testProject);
      issue1.fields.priority = { ...testPriority, name: 'High' };

      const issue2 = createTestIssue('TEST-2', testProject);
      issue2.fields.priority = { ...testPriority, name: 'Low' };

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);

      const results = queryEngine.executeJQL({ jql: 'priority != Low' });

      expect(results.total).toBe(1);
      expect(results.issues[0].key).toBe('TEST-1');
    });

    it('should filter by assignee != currentUser()', () => {
      const otherUser = { ...testUser, accountId: 'user-456', displayName: 'Other User' };
      dataStore.addUser(otherUser);

      const issue1 = createTestIssue('TEST-1', testProject);
      issue1.fields.assignee = testUser;

      const issue2 = createTestIssue('TEST-2', testProject);
      issue2.fields.assignee = otherUser;

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);

      const results = queryEngine.executeJQL({ jql: 'assignee != currentUser()' });

      expect(results.total).toBe(1);
      expect(results.issues[0].key).toBe('TEST-2');
    });
  });

  describe('IN Operator for All Fields', () => {
    it('should filter by status IN (...)', () => {
      const issue1 = createTestIssue('TEST-1', testProject);
      issue1.fields.status = { ...testStatus, name: 'To Do' };

      const issue2 = createTestIssue('TEST-2', testProject);
      issue2.fields.status = { ...testStatus, name: 'In Progress' };

      const issue3 = createTestIssue('TEST-3', testProject);
      issue3.fields.status = { ...testStatus, name: 'Done' };

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);
      dataStore.addIssue(issue3);

      const results = queryEngine.executeJQL({ jql: 'status IN ("To Do", "In Progress")' });

      expect(results.total).toBe(2);
      expect(results.issues.map((i) => i.key)).toEqual(['TEST-1', 'TEST-2']);
    });

    it('should filter by priority IN (High, Highest)', () => {
      const issue1 = createTestIssue('TEST-1', testProject);
      issue1.fields.priority = { ...testPriority, name: 'High' };

      const issue2 = createTestIssue('TEST-2', testProject);
      issue2.fields.priority = { ...testPriority, name: 'Highest' };

      const issue3 = createTestIssue('TEST-3', testProject);
      issue3.fields.priority = { ...testPriority, name: 'Low' };

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);
      dataStore.addIssue(issue3);

      const results = queryEngine.executeJQL({ jql: 'priority IN (High, Highest)' });

      expect(results.total).toBe(2);
      expect(results.issues.map((i) => i.key)).toEqual(['TEST-1', 'TEST-2']);
    });

    it('should filter by issuetype IN (Bug, Task)', () => {
      const issue1 = createTestIssue('TEST-1', testProject);
      issue1.fields.issuetype = { ...testIssueType, name: 'Bug' };

      const issue2 = createTestIssue('TEST-2', testProject);
      issue2.fields.issuetype = { ...testIssueType, name: 'Task' };

      const issue3 = createTestIssue('TEST-3', testProject);
      issue3.fields.issuetype = { ...testIssueType, name: 'Story' };

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);
      dataStore.addIssue(issue3);

      const results = queryEngine.executeJQL({ jql: 'issuetype IN (Bug, Task)' });

      expect(results.total).toBe(2);
      expect(results.issues.map((i) => i.key)).toEqual(['TEST-1', 'TEST-2']);
    });
  });

  describe('NOT IN Operator', () => {
    it('should filter by status NOT IN (Done, Closed)', () => {
      const issue1 = createTestIssue('TEST-1', testProject);
      issue1.fields.status = { ...testStatus, name: 'To Do' };

      const issue2 = createTestIssue('TEST-2', testProject);
      issue2.fields.status = { ...testStatus, name: 'Done' };

      const issue3 = createTestIssue('TEST-3', testProject);
      issue3.fields.status = { ...testStatus, name: 'Closed' };

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);
      dataStore.addIssue(issue3);

      const results = queryEngine.executeJQL({ jql: 'status NOT IN (Done, Closed)' });

      expect(results.total).toBe(1);
      expect(results.issues[0].key).toBe('TEST-1');
    });

    it('should filter by priority NOT IN (Low, Lowest)', () => {
      const issue1 = createTestIssue('TEST-1', testProject);
      issue1.fields.priority = { ...testPriority, name: 'High' };

      const issue2 = createTestIssue('TEST-2', testProject);
      issue2.fields.priority = { ...testPriority, name: 'Low' };

      const issue3 = createTestIssue('TEST-3', testProject);
      issue3.fields.priority = { ...testPriority, name: 'Lowest' };

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);
      dataStore.addIssue(issue3);

      const results = queryEngine.executeJQL({ jql: 'priority NOT IN (Low, Lowest)' });

      expect(results.total).toBe(1);
      expect(results.issues[0].key).toBe('TEST-1');
    });
  });

  describe('IS EMPTY / IS NOT EMPTY Operators', () => {
    it('should filter by assignee IS EMPTY', () => {
      const issue1 = createTestIssue('TEST-1', testProject);
      issue1.fields.assignee = null;

      const issue2 = createTestIssue('TEST-2', testProject);
      issue2.fields.assignee = testUser;

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);

      const results = queryEngine.executeJQL({ jql: 'assignee IS EMPTY' });

      expect(results.total).toBe(1);
      expect(results.issues[0].key).toBe('TEST-1');
    });

    it('should filter by assignee IS NOT EMPTY', () => {
      const issue1 = createTestIssue('TEST-1', testProject);
      issue1.fields.assignee = testUser;

      const issue2 = createTestIssue('TEST-2', testProject);
      issue2.fields.assignee = null;

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);

      const results = queryEngine.executeJQL({ jql: 'assignee IS NOT EMPTY' });

      expect(results.total).toBe(1);
      expect(results.issues[0].key).toBe('TEST-1');
    });

    it('should filter by labels IS EMPTY', () => {
      const issue1 = createTestIssue('TEST-1', testProject);
      issue1.fields.labels = [];

      const issue2 = createTestIssue('TEST-2', testProject);
      issue2.fields.labels = ['bug', 'urgent'];

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);

      const results = queryEngine.executeJQL({ jql: 'labels IS EMPTY' });

      expect(results.total).toBe(1);
      expect(results.issues[0].key).toBe('TEST-1');
    });

    it('should filter by resolution IS NOT EMPTY', () => {
      const issue1 = createTestIssue('TEST-1', testProject);
      (issue1.fields as any).resolution = { name: 'Fixed' };

      const issue2 = createTestIssue('TEST-2', testProject);
      (issue2.fields as any).resolution = null;

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);

      const results = queryEngine.executeJQL({ jql: 'resolution IS NOT EMPTY' });

      expect(results.total).toBe(1);
      expect(results.issues[0].key).toBe('TEST-1');
    });
  });

  describe('Text Search (~) Operator', () => {
    it('should filter by summary ~ "bug"', () => {
      const issue1 = createTestIssue('TEST-1', testProject);
      issue1.fields.summary = 'Fix bug in login';

      const issue2 = createTestIssue('TEST-2', testProject);
      issue2.fields.summary = 'Add new feature';

      const issue3 = createTestIssue('TEST-3', testProject);
      issue3.fields.summary = 'Another bug fix';

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);
      dataStore.addIssue(issue3);

      const results = queryEngine.executeJQL({ jql: 'summary ~ "bug"' });

      expect(results.total).toBe(2);
      expect(results.issues.map((i) => i.key)).toEqual(['TEST-1', 'TEST-3']);
    });

    it('should filter by description ~ "database"', () => {
      const issue1 = createTestIssue('TEST-1', testProject);
      issue1.fields.description = 'Fix database connection issue';

      const issue2 = createTestIssue('TEST-2', testProject);
      issue2.fields.description = 'Update UI components';

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);

      const results = queryEngine.executeJQL({ jql: 'description ~ "database"' });

      expect(results.total).toBe(1);
      expect(results.issues[0].key).toBe('TEST-1');
    });

    it('should filter by text ~ "error" (full-text search)', () => {
      const issue1 = createTestIssue('TEST-1', testProject);
      issue1.fields.summary = 'Fix error in API';
      issue1.fields.description = 'Some description';

      const issue2 = createTestIssue('TEST-2', testProject);
      issue2.fields.summary = 'Normal task';
      issue2.fields.description = 'Error handling needs improvement';

      const issue3 = createTestIssue('TEST-3', testProject);
      issue3.fields.summary = 'Another task';
      issue3.fields.description = 'No issues here';

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);
      dataStore.addIssue(issue3);

      const results = queryEngine.executeJQL({ jql: 'text ~ "error"' });

      expect(results.total).toBe(2);
      expect(results.issues.map((i) => i.key)).toEqual(['TEST-1', 'TEST-2']);
    });
  });

  describe('Date Filters', () => {
    it('should filter by created >= date', () => {
      const issue1 = createTestIssue('TEST-1', testProject);
      issue1.fields.created = '2024-01-15T10:00:00.000Z';

      const issue2 = createTestIssue('TEST-2', testProject);
      issue2.fields.created = '2024-02-01T10:00:00.000Z';

      const issue3 = createTestIssue('TEST-3', testProject);
      issue3.fields.created = '2024-03-01T10:00:00.000Z';

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);
      dataStore.addIssue(issue3);

      const results = queryEngine.executeJQL({ jql: 'created >= "2024-02-01"' });

      expect(results.total).toBe(2);
      expect(results.issues.map((i) => i.key)).toEqual(['TEST-2', 'TEST-3']);
    });

    it('should filter by updated <= date', () => {
      const issue1 = createTestIssue('TEST-1', testProject);
      issue1.fields.updated = '2024-01-15T10:00:00.000Z';

      const issue2 = createTestIssue('TEST-2', testProject);
      issue2.fields.updated = '2024-02-01T10:00:00.000Z';

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);

      const results = queryEngine.executeJQL({ jql: 'updated <= "2024-01-20"' });

      expect(results.total).toBe(1);
      expect(results.issues[0].key).toBe('TEST-1');
    });

    it('should filter by due < date', () => {
      const issue1 = createTestIssue('TEST-1', testProject);
      (issue1.fields as any).duedate = '2024-01-15';

      const issue2 = createTestIssue('TEST-2', testProject);
      (issue2.fields as any).duedate = '2024-02-01';

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);

      const results = queryEngine.executeJQL({ jql: 'due < "2024-01-20"' });

      expect(results.total).toBe(1);
      expect(results.issues[0].key).toBe('TEST-1');
    });

    it('should support date functions like startOfDay()', () => {
      // Just verify that the date function is parsed and evaluated
      // The actual filtering is already tested in the other date tests
      const issue1 = createTestIssue('TEST-1', testProject);
      issue1.fields.created = '2024-01-15T10:00:00.000Z';

      dataStore.addIssue(issue1);

      // This should execute without error - startOfDay() should be parsed
      const results = queryEngine.executeJQL({ jql: 'created >= startOfDay()' });

      // Just verify the query executed successfully
      expect(results).toBeDefined();
      expect(typeof results.total).toBe('number');
    });
  });

  describe('Resolution Field', () => {
    it('should filter by resolution = Fixed', () => {
      const issue1 = createTestIssue('TEST-1', testProject);
      (issue1.fields as any).resolution = { name: 'Fixed' };

      const issue2 = createTestIssue('TEST-2', testProject);
      (issue2.fields as any).resolution = { name: "Won't Fix" };

      const issue3 = createTestIssue('TEST-3', testProject);
      (issue3.fields as any).resolution = null;

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);
      dataStore.addIssue(issue3);

      const results = queryEngine.executeJQL({ jql: 'resolution = Fixed' });

      expect(results.total).toBe(1);
      expect(results.issues[0].key).toBe('TEST-1');
    });

    it('should filter by resolution IN (Fixed, Done)', () => {
      const issue1 = createTestIssue('TEST-1', testProject);
      (issue1.fields as any).resolution = { name: 'Fixed' };

      const issue2 = createTestIssue('TEST-2', testProject);
      (issue2.fields as any).resolution = { name: 'Done' };

      const issue3 = createTestIssue('TEST-3', testProject);
      (issue3.fields as any).resolution = { name: "Won't Fix" };

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);
      dataStore.addIssue(issue3);

      const results = queryEngine.executeJQL({ jql: 'resolution IN (Fixed, Done)' });

      expect(results.total).toBe(2);
      expect(results.issues.map((i) => i.key)).toEqual(['TEST-1', 'TEST-2']);
    });
  });

  describe('ORDER BY', () => {
    it('should order by created DESC', () => {
      const issue1 = createTestIssue('TEST-1', testProject);
      issue1.fields.created = '2024-01-01T10:00:00.000Z';

      const issue2 = createTestIssue('TEST-2', testProject);
      issue2.fields.created = '2024-02-01T10:00:00.000Z';

      const issue3 = createTestIssue('TEST-3', testProject);
      issue3.fields.created = '2024-03-01T10:00:00.000Z';

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);
      dataStore.addIssue(issue3);

      const results = queryEngine.executeJQL({ jql: 'project = TEST ORDER BY created DESC' });

      expect(results.issues.map((i) => i.key)).toEqual(['TEST-3', 'TEST-2', 'TEST-1']);
    });

    it('should order by key ASC', () => {
      const issue1 = createTestIssue('TEST-3', testProject);
      const issue2 = createTestIssue('TEST-1', testProject);
      const issue3 = createTestIssue('TEST-2', testProject);

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);
      dataStore.addIssue(issue3);

      const results = queryEngine.executeJQL({ jql: 'project = TEST ORDER BY key ASC' });

      expect(results.issues.map((i) => i.key)).toEqual(['TEST-1', 'TEST-2', 'TEST-3']);
    });
  });

  describe('Complex Queries', () => {
    it('should handle multiple operators together', () => {
      const issue1 = createTestIssue('TEST-1', testProject);
      issue1.fields.status = { ...testStatus, name: 'To Do' };
      issue1.fields.priority = { ...testPriority, name: 'High' };
      issue1.fields.assignee = testUser;
      issue1.fields.labels = ['frontend'];

      const issue2 = createTestIssue('TEST-2', testProject);
      issue2.fields.status = { ...testStatus, name: 'Done' };
      issue2.fields.priority = { ...testPriority, name: 'High' };
      issue2.fields.assignee = testUser;

      const issue3 = createTestIssue('TEST-3', testProject);
      issue3.fields.status = { ...testStatus, name: 'To Do' };
      issue3.fields.priority = { ...testPriority, name: 'Low' };
      issue3.fields.assignee = testUser;

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);
      dataStore.addIssue(issue3);

      const results = queryEngine.executeJQL({
        jql: 'status != Done AND priority IN (High, Highest) AND assignee = currentUser() AND labels IS NOT EMPTY',
      });

      expect(results.total).toBe(1);
      expect(results.issues[0].key).toBe('TEST-1');
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
