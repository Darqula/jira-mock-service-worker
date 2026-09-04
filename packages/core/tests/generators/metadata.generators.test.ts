import { describe, it, expect, beforeEach } from 'vitest';
import { StatusGenerator } from '../../src/generators/status.generator.js';
import { PriorityGenerator } from '../../src/generators/priority.generator.js';
import { IssueTypeGenerator } from '../../src/generators/issue-type.generator.js';
import { ProjectGenerator } from '../../src/generators/project.generator.js';
import { createFaker } from '../../src/generators/base/faker-config.js';
import { IdGenerator } from '../../src/generators/base/id-generator.js';
import { DateGenerator } from '../../src/generators/base/date-generator.js';
import type { GenerationContext } from '../../src/types/generator.types.js';
import type { User } from '../../src/types/jira-schemas.js';

describe('Metadata Generators', () => {
  let context: GenerationContext;
  let testUsers: User[];

  beforeEach(() => {
    const faker = createFaker(12345);
    context = {
      config: {
        version: '1.0',
        projects: [],
      },
      faker,
      idGenerator: new IdGenerator(),
      dateGenerator: new DateGenerator(faker),
      seed: 12345,
    };

    testUsers = [
      {
        accountId: 'user-1',
        displayName: 'John Doe',
        emailAddress: 'john@example.com',
        accountType: 'atlassian',
        avatarUrls: {
          '48x48': 'https://test.atlassian.net/avatars/user-1/48.png',
          '24x24': 'https://test.atlassian.net/avatars/user-1/24.png',
          '16x16': 'https://test.atlassian.net/avatars/user-1/16.png',
          '32x32': 'https://test.atlassian.net/avatars/user-1/32.png',
        },
        active: true,
        self: 'https://test.atlassian.net/rest/api/2/user?accountId=user-1',
      },
      {
        accountId: 'user-2',
        displayName: 'Jane Smith',
        emailAddress: 'jane@example.com',
        accountType: 'atlassian',
        avatarUrls: {
          '48x48': 'https://test.atlassian.net/avatars/user-2/48.png',
          '24x24': 'https://test.atlassian.net/avatars/user-2/24.png',
          '16x16': 'https://test.atlassian.net/avatars/user-2/16.png',
          '32x32': 'https://test.atlassian.net/avatars/user-2/32.png',
        },
        active: true,
        self: 'https://test.atlassian.net/rest/api/2/user?accountId=user-2',
      },
    ];
  });

  describe('StatusGenerator', () => {
    let generator: StatusGenerator;

    beforeEach(() => {
      generator = new StatusGenerator();
    });

    describe('generateStatusCategories', () => {
      it('should generate all three status categories', () => {
        const categories = generator.generateStatusCategories(context);

        expect(categories).toHaveLength(3);

        const categoryKeys = categories.map((c) => c.key);
        expect(categoryKeys).toContain('new');
        expect(categoryKeys).toContain('indeterminate');
        expect(categoryKeys).toContain('done');
      });

      it('should have unique IDs for each category', () => {
        const categories = generator.generateStatusCategories(context);
        const ids = categories.map((c) => c.id);
        const uniqueIds = new Set(ids);

        expect(uniqueIds.size).toBe(ids.length);
      });

      it('should include self URLs', () => {
        const categories = generator.generateStatusCategories(context);

        categories.forEach((category) => {
          expect(category.self).toBeDefined();
          expect(category.self).toContain('statuscategory');
        });
      });
    });

    describe('generateStatuses', () => {
      it('should generate standard Jira statuses', () => {
        const categories = generator.generateStatusCategories(context);
        const statuses = generator.generateStatuses(context, categories);

        expect(statuses.length).toBeGreaterThan(0);

        const statusNames = statuses.map((s) => s.name);
        expect(statusNames).toContain('To Do');
        expect(statusNames).toContain('In Progress');
        expect(statusNames).toContain('Done');
      });

      it('should link statuses to categories', () => {
        const categories = generator.generateStatusCategories(context);
        const statuses = generator.generateStatuses(context, categories);

        statuses.forEach((status) => {
          expect(status.statusCategory).toBeDefined();
          expect(categories.map((c) => c.id)).toContain(status.statusCategory.id);
        });
      });

      it('should have unique IDs', () => {
        const categories = generator.generateStatusCategories(context);
        const statuses = generator.generateStatuses(context, categories);

        const ids = statuses.map((s) => s.id);
        const uniqueIds = new Set(ids);

        expect(uniqueIds.size).toBe(ids.length);
      });

      it('should include self URLs', () => {
        const categories = generator.generateStatusCategories(context);
        const statuses = generator.generateStatuses(context, categories);

        statuses.forEach((status) => {
          expect(status.self).toBeDefined();
          expect(status.self).toContain('status');
        });
      });
    });
  });

  describe('PriorityGenerator', () => {
    let generator: PriorityGenerator;

    beforeEach(() => {
      generator = new PriorityGenerator();
    });

    describe('generatePriorities', () => {
      it('should generate standard Jira priorities', () => {
        const priorities = generator.generatePriorities(context);

        expect(priorities.length).toBeGreaterThan(0);

        const priorityNames = priorities.map((p) => p.name);
        expect(priorityNames).toContain('Highest');
        expect(priorityNames).toContain('High');
        expect(priorityNames).toContain('Medium');
        expect(priorityNames).toContain('Low');
        // Default config has Low, Medium, High, Highest (no Lowest)
      });

      it('should have unique IDs', () => {
        const priorities = generator.generatePriorities(context);
        const ids = priorities.map((p) => p.id);
        const uniqueIds = new Set(ids);

        expect(uniqueIds.size).toBe(ids.length);
      });

      it('should include icon URLs', () => {
        const priorities = generator.generatePriorities(context);

        priorities.forEach((priority) => {
          expect(priority.iconUrl).toBeDefined();
          expect(priority.iconUrl).toContain('icon');
        });
      });

      it('should include self URLs', () => {
        const priorities = generator.generatePriorities(context);

        priorities.forEach((priority) => {
          expect(priority.self).toBeDefined();
          expect(priority.self).toContain('priority');
        });
      });
    });
  });

  describe('IssueTypeGenerator', () => {
    let generator: IssueTypeGenerator;

    beforeEach(() => {
      generator = new IssueTypeGenerator();
    });

    describe('generateIssueTypes', () => {
      it('should generate standard Jira issue types', () => {
        const issueTypes = generator.generateIssueTypes(context);

        expect(issueTypes.length).toBeGreaterThan(0);

        const typeNames = issueTypes.map((t) => t.name);
        expect(typeNames).toContain('Epic');
        expect(typeNames).toContain('Story');
        expect(typeNames).toContain('Task');
        expect(typeNames).toContain('Bug');
      });

      it('should mark appropriate types as subtasks', () => {
        const issueTypes = generator.generateIssueTypes(context);

        const subtaskType = issueTypes.find((t) => t.name === 'Sub-task');
        if (subtaskType) {
          expect(subtaskType.subtask).toBe(true);
        }

        const epicType = issueTypes.find((t) => t.name === 'Epic');
        expect(epicType?.subtask).toBe(false);

        const storyType = issueTypes.find((t) => t.name === 'Story');
        expect(storyType?.subtask).toBe(false);
      });

      it('should have unique IDs', () => {
        const issueTypes = generator.generateIssueTypes(context);
        const ids = issueTypes.map((t) => t.id);
        const uniqueIds = new Set(ids);

        expect(uniqueIds.size).toBe(ids.length);
      });

      it('should include icon URLs', () => {
        const issueTypes = generator.generateIssueTypes(context);

        issueTypes.forEach((type) => {
          expect(type.iconUrl).toBeDefined();
          expect(type.iconUrl).toContain('icon');
        });
      });

      it('should include self URLs', () => {
        const issueTypes = generator.generateIssueTypes(context);

        issueTypes.forEach((type) => {
          expect(type.self).toBeDefined();
          expect(type.self).toContain('issuetype');
        });
      });
    });
  });

  describe('ProjectGenerator', () => {
    let generator: ProjectGenerator;

    beforeEach(() => {
      generator = new ProjectGenerator();
    });

    describe('generateProject', () => {
      it('should generate project with specified key', () => {
        const projectConfig = {
          projectKey: 'TEST',
        };

        const project = generator.generateProject(projectConfig, testUsers, context);

        expect(project.key).toBe('TEST');
      });

      it('should use provided project name if specified', () => {
        const projectConfig = {
          projectKey: 'TEST',
          projectName: 'Test Project',
        };

        const project = generator.generateProject(projectConfig, testUsers, context);

        expect(project.name).toBe('Test Project');
      });

      it('should generate project name if not specified', () => {
        const projectConfig = {
          projectKey: 'TEST',
        };

        const project = generator.generateProject(projectConfig, testUsers, context);

        expect(project.name).toBeDefined();
        expect(project.name.length).toBeGreaterThan(0);
      });

      it('should respect project type configuration', () => {
        const companyConfig = {
          projectKey: 'COMP',
          projectType: 'company-managed' as const,
        };

        const teamConfig = {
          projectKey: 'TEAM',
          projectType: 'team-managed' as const,
        };

        const companyProject = generator.generateProject(companyConfig, testUsers, context);
        const teamProject = generator.generateProject(teamConfig, testUsers, context);

        expect(companyProject.projectTypeKey).toBe('software');
        expect(teamProject.projectTypeKey).toBe('software');
      });

      it('should assign a lead from available users', () => {
        const projectConfig = {
          projectKey: 'TEST',
        };

        const project = generator.generateProject(projectConfig, testUsers, context);

        expect(project.lead).toBeDefined();
        expect(testUsers.map((u) => u.accountId)).toContain(project.lead?.accountId);
      });

      it('should include self URL', () => {
        const projectConfig = {
          projectKey: 'TEST',
        };

        const project = generator.generateProject(projectConfig, testUsers, context);

        expect(project.self).toBeDefined();
        expect(project.self).toContain('project');
        expect(project.self).toContain(project.key); // Self URL uses project key, not numeric ID
      });

      it('should generate unique IDs for different projects', () => {
        const config1 = { projectKey: 'PROJ1' };
        const config2 = { projectKey: 'PROJ2' };

        const project1 = generator.generateProject(config1, testUsers, context);
        const project2 = generator.generateProject(config2, testUsers, context);

        expect(project1.id).not.toBe(project2.id);
      });
    });
  });
});
