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
        },
        {
          projectKey: 'TEST2',
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
        },
        {
          projectKey: 'TEST2',
        },
        {
          projectKey: 'TEST3',
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
      projects: [
        {
          projectKey: 'TEST1',
          issueTypes: {
            epic: {
              count: 0, // Disable epic-based generation
            },
            story: { standaloneCount: 7 },
            task: { standaloneCount: 3 },
          },
        },
        {
          projectKey: 'TEST2',
          issueTypes: {
            epic: {
              count: 0,
            },
            bug: { standaloneCount: 5 },
          },
        },
      ],
    };

    const { dataStore } = generateMockData(config);
    const proj1Issues = dataStore.getAllIssues().filter((i) => i.fields.project.key === 'TEST1');
    const proj2Issues = dataStore.getAllIssues().filter((i) => i.fields.project.key === 'TEST2');

    // Standalone-only configs (epic count 0, no issueCount) generate exactly
    // the sum of their configured standalone counts.
    expect(proj1Issues).toHaveLength(10);
    expect(proj2Issues).toHaveLength(5);
  });

  it('should generate users', () => {
    const config: JiraMockConfig = {
      version: '1.0',
      projects: [
        {
          projectKey: 'TEST',
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
        },
        {
          projectKey: 'TEST2',
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

describe('issueCount option', () => {
  const clampRule = (issueCount: number, epicCount: number) => Math.max(issueCount, epicCount);

  const buildConfig = (
    seed: number,
    issueCount: number,
    issueTypes?: JiraMockConfig['projects'][number]['issueTypes']
  ): JiraMockConfig => ({
    version: '1.0',
    projects: [
      {
        projectKey: 'TEST',
        seed,
        issueCount,
        issueTypes,
      },
    ],
  });

  // Default epic config: 10 epics, 100 children each (no standalone issues)
  for (const seed of [1, 2, 3, 4, 5]) {
    for (const issueCount of [1, 3, 50, 137]) {
      it(`generates exactly max(issueCount, epicCount)=${clampRule(issueCount, 10)} issues (seed ${seed}, issueCount ${issueCount})`, () => {
        const { dataStore } = generateMockData(buildConfig(seed, issueCount));
        const issues = dataStore.getAllIssues();

        expect(issues).toHaveLength(clampRule(issueCount, 10));
      });
    }
  }

  for (const seed of [1, 2, 3, 4, 5]) {
    for (const issueCount of [1, 3, 50, 137]) {
      it(`keeps epic hierarchy intact and keys contiguous (seed ${seed}, issueCount ${issueCount})`, () => {
        const { dataStore } = generateMockData(buildConfig(seed, issueCount));
        const issues = dataStore.getAllIssues();

        const epicKeys = new Set(
          issues.filter((i) => i.fields.issuetype.name === 'Epic').map((i) => i.key)
        );
        expect(epicKeys.size).toBe(10);

        for (const issue of issues) {
          if (issue.fields.issuetype.name === 'Epic') continue;
          // Every non-epic issue must have a parent epic that exists
          expect(issue.fields.parent).toBeDefined();
          expect(epicKeys.has(issue.fields.parent!.key)).toBe(true);
        }

        // Contiguous numbering PROJ-1..PROJ-N
        const numbers = issues.map((i) => Number(i.key.split('-')[1])).sort((a, b) => a - b);
        expect(numbers[0]).toBe(1);
        expect(numbers[numbers.length - 1]).toBe(issues.length);
        expect(new Set(numbers).size).toBe(issues.length);
      });

      it(`is deterministic for the same seed (seed ${seed}, issueCount ${issueCount})`, () => {
        const run1 = generateMockData(buildConfig(seed, issueCount)).dataStore.getAllIssues();
        const run2 = generateMockData(buildConfig(seed, issueCount)).dataStore.getAllIssues();

        expect(run1.map((i) => i.key)).toEqual(run2.map((i) => i.key));
        expect(run1.map((i) => i.fields.summary)).toEqual(run2.map((i) => i.fields.summary));
      });
    }
  }

  it('pads beyond the issue-types plan by adding epic children', () => {
    // Plan: 2 epics * (1 + 5 children) = 12 issues; ask for 20
    const { dataStore } = generateMockData(
      buildConfig(42, 20, {
        epic: { count: 2, childrenPerEpic: 5 },
      })
    );
    const issues = dataStore.getAllIssues();

    expect(issues).toHaveLength(20);
    // 2 epics + 18 children distributed evenly: 9 each
    const childrenByEpic = new Map<string, number>();
    for (const issue of issues) {
      if (issue.fields.issuetype.name === 'Epic') continue;
      const parentKey = issue.fields.parent!.key;
      childrenByEpic.set(parentKey, (childrenByEpic.get(parentKey) || 0) + 1);
    }
    expect([...childrenByEpic.values()].sort()).toEqual([9, 9]);
  });

  it('truncates children before standalone counts and caps in Story → Task → Bug order', () => {
    // Plan: 2 epics * 11 = 22 + 15 standalone = 37 issues; ask for 8
    // Budget: 8 - 2 epics = 6 → standalone first: 5 Story, 1 Task, 0 Bug, 0 children
    const { dataStore } = generateMockData(
      buildConfig(42, 8, {
        epic: { count: 2, childrenPerEpic: 10 },
        story: { standaloneCount: 5 },
        task: { standaloneCount: 5 },
        bug: { standaloneCount: 5 },
      })
    );
    const issues = dataStore.getAllIssues();

    expect(issues).toHaveLength(8);

    const countByType = (name: string) =>
      issues.filter((i) => i.fields.issuetype.name === name).length;
    expect(countByType('Epic')).toBe(2);
    expect(countByType('Story')).toBe(5);
    expect(countByType('Task')).toBe(1);
    expect(countByType('Bug')).toBe(0);

    // Children truncated to zero; standalone issues never have a parent
    for (const issue of issues) {
      if (issue.fields.issuetype.name !== 'Epic') {
        expect(issue.fields.parent).toBeUndefined();
      }
    }
  });

  it('falls back to the epic-derived default when issueCount is omitted', () => {
    const { dataStore } = generateMockData({
      version: '1.0',
      projects: [{ projectKey: 'TEST', seed: 1 }],
    });

    expect(dataStore.getAllIssues()).toHaveLength(1010);
  });
});

describe('issue types without epics', () => {
  it('generates standalone issues exactly once when issueCount is omitted', () => {
    const { dataStore } = generateMockData({
      version: '1.0',
      projects: [
        {
          projectKey: 'LEGACY',
          seed: 1,
          issueTypes: {
            epic: { count: 0 },
            story: { standaloneCount: 3 },
            task: { standaloneCount: 2 },
            bug: { standaloneCount: 1 },
          },
        },
      ],
    });

    const issues = dataStore.getAllIssues();
    expect(issues).toHaveLength(6);

    const countByType = (name: string) =>
      issues.filter((i) => i.fields.issuetype.name === name).length;
    expect(countByType('Story')).toBe(3);
    expect(countByType('Task')).toBe(2);
    expect(countByType('Bug')).toBe(1);
  });
});
