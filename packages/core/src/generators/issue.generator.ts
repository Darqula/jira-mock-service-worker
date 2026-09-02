import type {
  IssueBean,
  IssueFields,
  Project,
  User,
  IssueType,
  Priority,
  Status,
  Component,
  Version,
} from '../types/jira-schemas.js';
import type { IssueContext } from '../types/generator.types.js';
import { generateSelfUrls } from '../utils/response-builder.js';
import { getBuiltInDefaults } from '../config/defaults.js';
import {
  shouldApply,
  weightedPick,
  normalizeDistribution,
} from './utils/probability.js';
import {
  generateIssueSummary,
  generateIssueDescription,
} from './utils/templates.js';
import { SprintGenerator } from './sprint.generator.js';

export class IssueGenerator {
  private sprintGenerator = new SprintGenerator();
  generateIssues(
    project: Project,
    count: number,
    users: User[],
    issueTypes: IssueType[],
    priorities: Priority[],
    statuses: Status[],
    components: Component[],
    versions: Version[],
    context: IssueContext
  ): IssueBean[] {
    // Use merged project config from context, or fall back to defaults
    const projectConfig = context.currentProject || getBuiltInDefaults();
    const startIssueNumber = projectConfig.startIssueNumber || 1;
    const issues: IssueBean[] = [];

    // Check if we should use epic-based generation
    const useEpics =
      projectConfig.issueTypes?.epic &&
      (projectConfig.issueTypes.epic.count || 0) > 0;

    // Honor an explicit issueCount by distributing the budget across
    // standalone issues and epic children; without it this reduces to the
    // configured issue-types plan.
    const allocation = this.distributeIssueCounts(projectConfig, count);

    if (useEpics) {
      // Generate with epics
      const epics = this.generateEpics(
        project,
        allocation.childrenPerEpicBase,
        allocation.childrenPerEpicExtra,
        users,
        issueTypes,
        priorities,
        statuses,
        components,
        versions,
        context,
        startIssueNumber
      );
      issues.push(...epics);
    } else {
      // Generate without epics (legacy behavior)
      for (let i = 0; i < allocation.genericCount; i++) {
        const issueNumber = startIssueNumber + issues.length;
        const issue = this.generateIssue(
          project,
          issueNumber,
          users,
          issueTypes,
          priorities,
          statuses,
          components,
          versions,
          { ...context, issueIndex: i }
        );
        issues.push(issue);
      }
    }

    // Generate standalone issues
    this.generateStandaloneIssues(
      issues,
      project,
      allocation.standaloneCounts,
      users,
      issueTypes,
      priorities,
      statuses,
      components,
      versions,
      context,
      startIssueNumber
    );

    return issues;
  }

  /**
   * Distributes the issue budget when an explicit `issueCount` is configured.
   *
   * Rules (documented in README):
   * - All epics are always generated; totals below the epic count are clamped
   *   up to the epic count (issueCount is treated as max(issueCount, epicCount)).
   * - Standalone issues keep their configured counts first, in Story → Task →
   *   Bug order, until the budget runs out.
   * - The remaining budget goes to epic children, distributed evenly across
   *   epics (the first `childrenPerEpicExtra` epics receive one additional
   *   child), both when padding and when truncating.
   * - Without `issueCount` the plan is the plain issue-types configuration.
   */
  private distributeIssueCounts(
    projectConfig: any,
    count: number
  ): {
    genericCount: number;
    childrenPerEpicBase: number;
    childrenPerEpicExtra: number;
    standaloneCounts: { story: number; task: number; bug: number };
  } {
    const issueTypesConfig = projectConfig.issueTypes;
    const standaloneCounts = {
      story: issueTypesConfig?.story?.standaloneCount || 0,
      task: issueTypesConfig?.task?.standaloneCount || 0,
      bug: issueTypesConfig?.bug?.standaloneCount || 0,
    };
    const epicCount = issueTypesConfig?.epic?.count || 0;

    if (projectConfig.issueCount === undefined) {
      return {
        genericCount: count,
        childrenPerEpicBase: issueTypesConfig?.epic?.childrenPerEpic || 0,
        childrenPerEpicExtra: 0,
        standaloneCounts,
      };
    }

    const total = Math.max(count, epicCount);
    let budget = total - epicCount;

    const standaloneTotal =
      standaloneCounts.story + standaloneCounts.task + standaloneCounts.bug;
    const allowedStandalone = Math.min(budget, standaloneTotal);
    const cappedCounts = {
      story: Math.min(standaloneCounts.story, allowedStandalone),
      task: 0,
      bug: 0,
    };
    let left = allowedStandalone - cappedCounts.story;
    cappedCounts.task = Math.min(standaloneCounts.task, left);
    left -= cappedCounts.task;
    cappedCounts.bug = Math.min(standaloneCounts.bug, left);
    const usedStandalone =
      cappedCounts.story + cappedCounts.task + cappedCounts.bug;

    budget -= usedStandalone;

    if (epicCount > 0) {
      return {
        genericCount: 0,
        childrenPerEpicBase: Math.floor(budget / epicCount),
        childrenPerEpicExtra: budget % epicCount,
        standaloneCounts: cappedCounts,
      };
    }

    return {
      genericCount: budget,
      childrenPerEpicBase: 0,
      childrenPerEpicExtra: 0,
      standaloneCounts: cappedCounts,
    };
  }

  /**
   * Generates epics and their children
   */
  private generateEpics(
    project: Project,
    childrenPerEpicBase: number,
    childrenPerEpicExtra: number,
    users: User[],
    issueTypes: IssueType[],
    priorities: Priority[],
    statuses: Status[],
    components: Component[],
    versions: Version[],
    context: IssueContext,
    startIssueNumber: number
  ): IssueBean[] {
    const projectConfig = context.currentProject || getBuiltInDefaults();
    const epicConfig = projectConfig.issueTypes!.epic!;
    const epicCount = epicConfig.count || 0;

    const issues: IssueBean[] = [];
    const epicType = issueTypes.find((t) => t.name === 'Epic');

    if (!epicType) {
      console.warn('Epic issue type not found, skipping epic generation');
      return issues;
    }

    for (let epicIndex = 0; epicIndex < epicCount; epicIndex++) {
      const issueNumber = startIssueNumber + issues.length;

      // Generate epic
      const epic = this.generateEpic(
        project,
        issueNumber,
        users,
        epicType,
        priorities,
        statuses,
        components,
        versions,
        { ...context, issueIndex: issues.length }
      );
      issues.push(epic);

      // Generate children for this epic
      const childrenPerEpic =
        childrenPerEpicBase + (epicIndex < childrenPerEpicExtra ? 1 : 0);
      const children = this.generateEpicChildren(
        project,
        epic,
        childrenPerEpic,
        users,
        issueTypes,
        priorities,
        statuses,
        components,
        versions,
        context,
        startIssueNumber + issues.length
      );
      issues.push(...children);
    }

    return issues;
  }

  /**
   * Generates an epic issue
   */
  private generateEpic(
    project: Project,
    issueNumber: number,
    users: User[],
    epicType: IssueType,
    priorities: Priority[],
    statuses: Status[],
    components: Component[],
    versions: Version[],
    context: IssueContext
  ): IssueBean {
    const projectConfig = context.currentProject || getBuiltInDefaults();
    const epicConfig = projectConfig.issueTypes!.epic!;

    const id = context.idGenerator.next('issue');
    const key = context.idGenerator.issueKey(project.key, issueNumber);
    const priority = this.getRandomPriority(priorities, context);
    const status = this.getRandomStatus(statuses, context);
    const reporter = this.getRandomUser(users, context);
    const urls = generateSelfUrls();

    // Apply epic-specific probabilities
    const assignee = shouldApply(context.faker, epicConfig.assignProbability || 0.9)
      ? this.getRandomUser(users, context)
      : undefined;

    const labels = shouldApply(context.faker, epicConfig.labelProbability || 0.8)
      ? this.generateLabels(context)
      : [];

    const { created, updated } = this.generateIssueDates(context);

    const fields: IssueFields = {
      summary: generateIssueSummary(context.faker, 'Epic'),
      description: generateIssueDescription(context.faker, 'Epic'),
      issuetype: epicType,
      project: this.createProjectReference(project),
      reporter,
      assignee,
      priority,
      status,
      created: created.toISOString(),
      updated: updated.toISOString(),
      labels,
      components: this.getRandomComponents(components, context),
      versions: [],
      fixVersions: this.getRandomVersions(versions, context),
    };

    // Assign sprint if configured
    if (context.sprints && context.sprints.length > 0) {
      const sprint = this.sprintGenerator.getRandomSprint(
        context.sprints,
        context,
        projectConfig.sprints?.assignProbability || 0.7
      );
      if (sprint) {
        fields.sprint = {
          id: sprint.id,
          name: sprint.name,
          state: sprint.state,
        };
      }
    }

    return {
      id,
      key,
      self: urls.issue(key),
      fields,
    };
  }

  /**
   * Generates children for an epic
   */
  private generateEpicChildren(
    project: Project,
    epic: IssueBean,
    count: number,
    users: User[],
    issueTypes: IssueType[],
    priorities: Priority[],
    statuses: Status[],
    components: Component[],
    versions: Version[],
    context: IssueContext,
    startIndex: number
  ): IssueBean[] {
    const projectConfig = context.currentProject || getBuiltInDefaults();
    const epicConfig = projectConfig.issueTypes!.epic!;
    const distribution = epicConfig.childDistribution || {};
    const childDistribution = normalizeDistribution({
      story: distribution.story || 0.5,
      task: distribution.task || 0.3,
      bug: distribution.bug || 0.2,
    });

    const children: IssueBean[] = [];

    for (let i = 0; i < count; i++) {
      const issueNumber = startIndex + i;

      // Determine child type based on distribution
      const childTypeName = weightedPick(context.faker, childDistribution);
      const childType = this.getIssueTypeByName(
        issueTypes,
        this.capitalizeFirst(childTypeName)
      );

      if (!childType) {
        console.warn(`Child type ${childTypeName} not found`);
        continue;
      }

      const child = this.generateChildIssue(
        project,
        epic,
        issueNumber,
        childType,
        users,
        priorities,
        statuses,
        components,
        versions,
        { ...context, issueIndex: startIndex + i }
      );

      children.push(child);
    }

    return children;
  }

  /**
   * Generates standalone issues (not in epics)
   */
  private generateStandaloneIssues(
    existingIssues: IssueBean[],
    project: Project,
    standaloneCounts: { story: number; task: number; bug: number },
    users: User[],
    issueTypes: IssueType[],
    priorities: Priority[],
    statuses: Status[],
    components: Component[],
    versions: Version[],
    context: IssueContext,
    startIssueNumber: number
  ): void {
    const standaloneTypes = [
      { name: 'Story', count: standaloneCounts.story },
      { name: 'Task', count: standaloneCounts.task },
      { name: 'Bug', count: standaloneCounts.bug },
    ];

    for (const { name, count } of standaloneTypes) {
      if (count === 0) continue;

      const issueType = this.getIssueTypeByName(issueTypes, name);
      if (!issueType) {
        console.warn(`Issue type ${name} not found`);
        continue;
      }

      for (let i = 0; i < count; i++) {
        const issueNumber = startIssueNumber + existingIssues.length;
        const issue = this.generateStandaloneIssue(
          project,
          issueNumber,
          issueType,
          users,
          priorities,
          statuses,
          components,
          versions,
          { ...context, issueIndex: existingIssues.length }
        );
        existingIssues.push(issue);
      }
    }
  }

  generateIssue(
    project: Project,
    issueNumber: number,
    users: User[],
    issueTypes: IssueType[],
    priorities: Priority[],
    statuses: Status[],
    components: Component[],
    versions: Version[],
    context: IssueContext
  ): IssueBean {
    const id = context.idGenerator.next('issue');
    const key = context.idGenerator.issueKey(project.key, issueNumber);
    const issueType = this.getRandomIssueType(issueTypes, context);
    const priority = this.getRandomPriority(priorities, context);
    const status = this.getRandomStatus(statuses, context);
    const reporter = this.getRandomUser(users, context);
    const assignee = this.getRandomUserOrUndefined(users, context, 0.8);
    const urls = generateSelfUrls();

    // Generate project creation date if not set
    const projectCreatedDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const created = context.dateGenerator.issueCreated(projectCreatedDate);
    const updated = context.dateGenerator.issueUpdated(created);

    const fields: IssueFields = {
      summary: this.generateSummary(issueType.name, context),
      description: context.faker.lorem.paragraphs(2),
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
      created: created.toISOString(),
      updated: updated.toISOString(),
      labels: this.generateLabels(context),
      components: this.getRandomComponents(components, context),
      versions: [],
      fixVersions: this.getRandomVersions(versions, context),
    };

    return {
      id,
      key,
      self: urls.issue(key),
      fields,
    };
  }

  private generateSummary(issueTypeName: string, context: IssueContext): string {
    const verbs = ['Implement', 'Fix', 'Update', 'Refactor', 'Add', 'Remove', 'Improve'];
    const objects = [
      'authentication',
      'user interface',
      'API endpoint',
      'database query',
      'error handling',
      'validation logic',
      'performance',
      'security',
      'documentation',
      'tests',
    ];

    const verb = context.faker.helpers.arrayElement(verbs);
    const object = context.faker.helpers.arrayElement(objects);

    if (issueTypeName === 'Bug') {
      return `${verb} issue with ${object}`;
    }

    return `${verb} ${object}`;
  }

  private generateLabels(context: IssueContext): string[] {
    const projectConfig = context.currentProject || getBuiltInDefaults();
    const labelOptions = projectConfig.data?.labels || [
      'frontend',
      'backend',
      'api',
      'bug',
      'enhancement',
      'security',
      'performance',
      'documentation',
      'testing',
    ];

    const labelCount = context.faker.number.int({ min: 0, max: 3 });
    const labels: string[] = [];

    for (let i = 0; i < labelCount; i++) {
      const label = context.faker.helpers.arrayElement(labelOptions);
      if (!labels.includes(label)) {
        labels.push(label);
      }
    }

    return labels;
  }

  private getRandomIssueType(issueTypes: IssueType[], context: IssueContext): IssueType {
    const normalTypes = issueTypes.filter((t) => !t.subtask);
    const index = context.faker.number.int({ min: 0, max: normalTypes.length - 1 });
    return normalTypes[index];
  }

  private getRandomPriority(priorities: Priority[], context: IssueContext): Priority {
    const index = context.faker.number.int({ min: 0, max: priorities.length - 1 });
    return priorities[index];
  }

  private getRandomStatus(statuses: Status[], context: IssueContext): Status {
    const projectConfig = context.currentProject || getBuiltInDefaults();
    const distribution = projectConfig.statusDistribution!;

    // Categorize statuses by category key
    const todoStatuses = statuses.filter(
      (s) => s.statusCategory.key === 'new'
    );
    const inProgressStatuses = statuses.filter(
      (s) => s.statusCategory.key === 'indeterminate'
    );
    const doneStatuses = statuses.filter(
      (s) => s.statusCategory.key === 'done'
    );

    // Use weighted distribution to pick a category
    const categoryWeights = normalizeDistribution({
      toDo: distribution.toDo!,
      inProgress: distribution.inProgress!,
      done: distribution.done!,
    });

    const category = weightedPick(context.faker, categoryWeights);

    // Pick a random status from the selected category
    let selectedStatuses: Status[];
    switch (category) {
      case 'toDo':
        selectedStatuses = todoStatuses.length > 0 ? todoStatuses : statuses;
        break;
      case 'inProgress':
        selectedStatuses = inProgressStatuses.length > 0 ? inProgressStatuses : statuses;
        break;
      case 'done':
        selectedStatuses = doneStatuses.length > 0 ? doneStatuses : statuses;
        break;
      default:
        selectedStatuses = statuses;
    }

    const index = context.faker.number.int({ min: 0, max: selectedStatuses.length - 1 });
    return selectedStatuses[index];
  }

  private getRandomUser(users: User[], context: IssueContext): User {
    const index = context.faker.number.int({ min: 0, max: users.length - 1 });
    return users[index];
  }

  private getRandomUserOrUndefined(
    users: User[],
    context: IssueContext,
    probability: number
  ): User | undefined {
    if (context.faker.number.float() < probability) {
      return this.getRandomUser(users, context);
    }
    return undefined;
  }

  private getRandomComponents(components: Component[], context: IssueContext): Component[] {
    if (components.length === 0) {
      return [];
    }

    const count = context.faker.number.int({ min: 0, max: Math.min(2, components.length) });
    if (count === 0) {
      return [];
    }

    return context.faker.helpers.arrayElements(components, count);
  }

  private getRandomVersions(versions: Version[], context: IssueContext): Version[] {
    if (versions.length === 0) {
      return [];
    }

    const projectConfig = context.currentProject || getBuiltInDefaults();
    const versionConfig = projectConfig.versions!;

    // Check if we should assign a version based on probability
    if (!shouldApply(context.faker, versionConfig.assignProbability!)) {
      return [];
    }

    // Assign 1 version (most common case in Jira)
    const count = context.faker.number.int({ min: 0, max: 1 });
    if (count === 0) {
      return [];
    }

    return context.faker.helpers.arrayElements(versions, count);
  }

  /**
   * Generates a child issue for an epic
   */
  private generateChildIssue(
    project: Project,
    epic: IssueBean,
    issueNumber: number,
    issueType: IssueType,
    users: User[],
    priorities: Priority[],
    statuses: Status[],
    components: Component[],
    versions: Version[],
    context: IssueContext
  ): IssueBean {
    const projectConfig = context.currentProject || getBuiltInDefaults();
    const typeConfig = this.getIssueTypeConfig(issueType.name, projectConfig);

    const id = context.idGenerator.next('issue');
    const key = context.idGenerator.issueKey(project.key, issueNumber);
    const priority = this.getRandomPriority(priorities, context);
    const status = this.getRandomStatus(statuses, context);
    const reporter = this.getRandomUser(users, context);
    const urls = generateSelfUrls();

    // Apply issue-type-specific probabilities
    const assignee = shouldApply(context.faker, typeConfig.assignProbability)
      ? this.getRandomUser(users, context)
      : undefined;

    const labels = shouldApply(context.faker, typeConfig.labelProbability)
      ? this.generateLabels(context)
      : [];

    const { created, updated } = this.generateIssueDates(context);

    const fields: IssueFields = {
      summary: generateIssueSummary(context.faker, issueType.name),
      description: generateIssueDescription(context.faker, issueType.name),
      issuetype: issueType,
      project: this.createProjectReference(project),
      reporter,
      assignee,
      priority,
      status,
      created: created.toISOString(),
      updated: updated.toISOString(),
      labels,
      components: this.getRandomComponents(components, context),
      versions: [],
      fixVersions: this.getRandomVersions(versions, context),
    };

    // Assign sprint if configured
    if (context.sprints && context.sprints.length > 0) {
      const sprint = this.sprintGenerator.getRandomSprint(
        context.sprints,
        context,
        projectConfig.sprints?.assignProbability || 0.7
      );
      if (sprint) {
        fields.sprint = {
          id: sprint.id,
          name: sprint.name,
          state: sprint.state,
        };
      }
    }

    // Add parent relationship
    if ((projectConfig as any).projectType === 'team-managed') {
      // Team-managed projects use custom field
      fields.customFieldValues = fields.customFieldValues || [];
      fields.customFieldValues.push({
        fieldName: 'ParentKey',
        value: epic.key,
      });
    } else {
      // Company-managed projects use parent field
      fields.parent = {
        id: epic.id,
        key: epic.key,
        self: epic.self,
        fields: {
          summary: epic.fields.summary,
          status: epic.fields.status,
          priority: epic.fields.priority,
          issuetype: epic.fields.issuetype,
        },
      };
    }

    return {
      id,
      key,
      self: urls.issue(key),
      fields,
    };
  }

  /**
   * Generates a standalone issue (not in an epic)
   */
  private generateStandaloneIssue(
    project: Project,
    issueNumber: number,
    issueType: IssueType,
    users: User[],
    priorities: Priority[],
    statuses: Status[],
    components: Component[],
    versions: Version[],
    context: IssueContext
  ): IssueBean {
    const projectConfig = context.currentProject || getBuiltInDefaults();
    const typeConfig = this.getIssueTypeConfig(issueType.name, projectConfig);

    const id = context.idGenerator.next('issue');
    const key = context.idGenerator.issueKey(project.key, issueNumber);
    const priority = this.getRandomPriority(priorities, context);
    const status = this.getRandomStatus(statuses, context);
    const reporter = this.getRandomUser(users, context);
    const urls = generateSelfUrls();

    // Apply issue-type-specific probabilities
    const assignee = shouldApply(context.faker, typeConfig.assignProbability)
      ? this.getRandomUser(users, context)
      : undefined;

    const labels = shouldApply(context.faker, typeConfig.labelProbability)
      ? this.generateLabels(context)
      : [];

    const { created, updated } = this.generateIssueDates(context);

    const fields: IssueFields = {
      summary: generateIssueSummary(context.faker, issueType.name),
      description: generateIssueDescription(context.faker, issueType.name),
      issuetype: issueType,
      project: this.createProjectReference(project),
      reporter,
      assignee,
      priority,
      status,
      created: created.toISOString(),
      updated: updated.toISOString(),
      labels,
      components: this.getRandomComponents(components, context),
      versions: [],
      fixVersions: this.getRandomVersions(versions, context),
    };

    // Assign sprint if configured
    if (context.sprints && context.sprints.length > 0) {
      const sprint = this.sprintGenerator.getRandomSprint(
        context.sprints,
        context,
        projectConfig.sprints?.assignProbability || 0.7
      );
      if (sprint) {
        fields.sprint = {
          id: sprint.id,
          name: sprint.name,
          state: sprint.state,
        };
      }
    }

    return {
      id,
      key,
      self: urls.issue(key),
      fields,
    };
  }

  /**
   * Generates created and updated dates based on config
   */
  private generateIssueDates(context: IssueContext): {
    created: Date;
    updated: Date;
  } {
    const projectConfig = context.currentProject || getBuiltInDefaults();
    const startDate = projectConfig.startDate
      ? new Date(projectConfig.startDate)
      : new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

    const endDate = projectConfig.endDate
      ? new Date(projectConfig.endDate)
      : new Date();

    const created = context.dateGenerator.issueCreated(startDate, endDate);
    const updated = context.dateGenerator.issueUpdated(created);

    return { created, updated };
  }

  /**
   * Creates a project reference object
   */
  private createProjectReference(project: Project) {
    return {
      self: project.self,
      id: project.id,
      key: project.key,
      name: project.name,
      projectTypeKey: project.projectTypeKey,
      simplified: project.simplified,
      avatarUrls: project.avatarUrls,
      style: project.style,
    };
  }

  /**
   * Finds an issue type by name
   */
  private getIssueTypeByName(
    issueTypes: IssueType[],
    name: string
  ): IssueType | undefined {
    return issueTypes.find(
      (t) => t.name.toLowerCase() === name.toLowerCase()
    );
  }

  /**
   * Gets configuration for a specific issue type
   */
  private getIssueTypeConfig(
    issueTypeName: string,
    projectConfig: any
  ): {
    assignProbability: number;
    labelProbability: number;
  } {
    const issueTypesConfig = projectConfig.issueTypes!;
    const normalizedName = issueTypeName.toLowerCase();

    switch (normalizedName) {
      case 'story':
        return {
          assignProbability: issueTypesConfig.story!.assignProbability!,
          labelProbability: issueTypesConfig.story!.labelProbability!,
        };
      case 'task':
        return {
          assignProbability: issueTypesConfig.task!.assignProbability!,
          labelProbability: issueTypesConfig.task!.labelProbability!,
        };
      case 'bug':
        return {
          assignProbability: issueTypesConfig.bug!.assignProbability!,
          labelProbability: issueTypesConfig.bug!.labelProbability!,
        };
      default:
        return {
          assignProbability: 0.8,
          labelProbability: 0.5,
        };
    }
  }

  /**
   * Capitalizes the first letter of a string
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
