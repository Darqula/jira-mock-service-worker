import { describe, it, expect, beforeEach } from 'vitest';
import { DataStore } from '../../src/store/data-store.js';
import type { User, Project, IssueBean } from '../../src/types/jira-schemas.js';

describe('DataStore', () => {
  let dataStore: DataStore;

  beforeEach(() => {
    dataStore = new DataStore();
  });

  describe('Users', () => {
    const mockUser: User = {
      self: 'https://test.atlassian.net/rest/api/2/user?accountId=123',
      accountId: '123',
      accountType: 'atlassian',
      displayName: 'Test User',
      emailAddress: 'test@example.com',
      active: true,
      avatarUrls: {
        '48x48': 'https://avatar.png',
        '24x24': 'https://avatar.png',
        '16x16': 'https://avatar.png',
        '32x32': 'https://avatar.png',
      },
    };

    it('should add and retrieve a user', () => {
      dataStore.addUser(mockUser);
      const retrieved = dataStore.getUser('123');

      expect(retrieved).toEqual(mockUser);
    });

    it('should search users by name', () => {
      dataStore.addUser(mockUser);
      const results = dataStore.searchUsers('Test');

      expect(results).toHaveLength(1);
      expect(results[0].displayName).toBe('Test User');
    });

    it('should return all users', () => {
      dataStore.addUser(mockUser);
      dataStore.addUser({ ...mockUser, accountId: '456', displayName: 'Another User' });

      const all = dataStore.getAllUsers();
      expect(all).toHaveLength(2);
    });
  });

  describe('Issues', () => {
    const mockIssue: IssueBean = {
      id: '1',
      key: 'TEST-1',
      self: 'https://test.atlassian.net/rest/api/2/issue/TEST-1',
      fields: {
        summary: 'Test Issue',
        project: {} as Project,
        issuetype: {
          self: '',
          id: '1',
          name: 'Bug',
          description: '',
          iconUrl: '',
          subtask: false,
        },
        priority: {
          self: '',
          id: '1',
          name: 'High',
          iconUrl: '',
        },
        status: {
          self: '',
          id: '1',
          name: 'Open',
          description: '',
          iconUrl: '',
          statusCategory: {
            self: '',
            id: 1,
            key: 'new',
            name: 'To Do',
            colorName: 'blue',
          },
        },
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      },
    };

    it('should add and retrieve an issue', () => {
      dataStore.addIssue(mockIssue);
      const retrieved = dataStore.getIssue('1');

      expect(retrieved).toEqual(mockIssue);
    });

    it('should retrieve issue by key', () => {
      dataStore.addIssue(mockIssue);
      const retrieved = dataStore.getIssue('TEST-1');

      expect(retrieved).toEqual(mockIssue);
    });

    it('should update an issue', () => {
      dataStore.addIssue(mockIssue);
      const updated = dataStore.updateIssue('TEST-1', {
        fields: { ...mockIssue.fields, summary: 'Updated Summary' },
      });

      expect(updated?.fields.summary).toBe('Updated Summary');
    });

    it('should delete an issue', () => {
      dataStore.addIssue(mockIssue);
      const deleted = dataStore.deleteIssue('TEST-1');

      expect(deleted).toBe(true);
      expect(dataStore.getIssue('TEST-1')).toBeUndefined();
    });

    it('should search issues with filters', () => {
      const project: Project = {
        self: '',
        id: '1',
        key: 'TEST',
        name: 'Test Project',
        projectTypeKey: 'software',
        simplified: false,
        style: 'classic',
        avatarUrls: {
          '48x48': '',
          '24x24': '',
          '16x16': '',
          '32x32': '',
        },
      };

      const issue1 = { ...mockIssue, id: '1', key: 'TEST-1' };
      issue1.fields.project = project;
      const issue2 = { ...mockIssue, id: '2', key: 'TEST-2' };
      issue2.fields.project = project;

      dataStore.addIssue(issue1);
      dataStore.addIssue(issue2);

      const results = dataStore.searchIssues({ projectKey: 'TEST' });

      expect(results.total).toBe(2);
      expect(results.issues).toHaveLength(2);
    });
  });

  describe('Stats', () => {
    it('should return statistics', () => {
      const stats = dataStore.getStats();

      expect(stats.users).toBe(0);
      expect(stats.projects).toBe(0);
      expect(stats.issues).toBe(0);
    });
  });
});
