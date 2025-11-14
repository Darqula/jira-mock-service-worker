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

export class IssueGenerator {
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
    const issues: IssueBean[] = [];

    for (let i = 0; i < count; i++) {
      const issueNumber = i + 1;
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

    return issues;
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
    const labelOptions = [
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
    const index = context.faker.number.int({ min: 0, max: statuses.length - 1 });
    return statuses[index];
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

    const count = context.faker.number.int({ min: 0, max: 1 });
    if (count === 0) {
      return [];
    }

    return context.faker.helpers.arrayElements(versions, count);
  }
}
