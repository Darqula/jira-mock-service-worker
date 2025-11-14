import type {
  User,
  Project,
  IssueBean,
  IssueType,
  Priority,
  Status,
  StatusCategory,
  Component,
  Version,
  Worklog,
  Field,
  SearchResults,
} from '../types/jira-schemas.js';

export interface QueryOptions {
  startAt?: number;
  maxResults?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface IssueFilters {
  projectKey?: string;
  projectId?: string;
  issueType?: string;
  status?: string;
  assignee?: string;
  reporter?: string;
  priority?: string;
  labels?: string[];
  keys?: string[];
}

export class DataStore {
  private users: Map<string, User> = new Map();
  private projects: Map<string, Project> = new Map();
  private projectsByKey: Map<string, Project> = new Map();
  private issues: Map<string, IssueBean> = new Map();
  private issuesByKey: Map<string, IssueBean> = new Map();
  private issueTypes: Map<string, IssueType> = new Map();
  private priorities: Map<string, Priority> = new Map();
  private statuses: Map<string, Status> = new Map();
  private statusCategories: Map<string, StatusCategory> = new Map();
  private components: Map<string, Component> = new Map();
  private versions: Map<string, Version> = new Map();
  private worklogs: Map<string, Worklog> = new Map();
  private worklogsByIssue: Map<string, Worklog[]> = new Map();
  private fields: Map<string, Field> = new Map();
  private currentUser: User | null = null;

  // Users
  addUser(user: User): void {
    this.users.set(user.accountId, user);
  }

  getUser(accountId: string): User | undefined {
    return this.users.get(accountId);
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  searchUsers(query: string, maxResults: number = 50): User[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.users.values())
      .filter(
        (user) =>
          user.displayName.toLowerCase().includes(lowerQuery) ||
          user.emailAddress?.toLowerCase().includes(lowerQuery) ||
          user.accountId.toLowerCase().includes(lowerQuery)
      )
      .slice(0, maxResults);
  }

  setCurrentUser(user: User): void {
    this.currentUser = user;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Projects
  addProject(project: Project): void {
    this.projects.set(project.id, project);
    this.projectsByKey.set(project.key, project);
  }

  getProject(idOrKey: string): Project | undefined {
    return this.projects.get(idOrKey) || this.projectsByKey.get(idOrKey);
  }

  getAllProjects(): Project[] {
    return Array.from(this.projects.values());
  }

  // Issues
  addIssue(issue: IssueBean): void {
    this.issues.set(issue.id, issue);
    this.issuesByKey.set(issue.key, issue);
  }

  getIssue(idOrKey: string): IssueBean | undefined {
    return this.issues.get(idOrKey) || this.issuesByKey.get(idOrKey);
  }

  updateIssue(idOrKey: string, updates: Partial<IssueBean>): IssueBean | undefined {
    const issue = this.getIssue(idOrKey);
    if (!issue) {
      return undefined;
    }

    const updated: IssueBean = {
      ...issue,
      ...updates,
      fields: {
        ...issue.fields,
        ...(updates.fields || {}),
        updated: new Date().toISOString(),
      },
    };

    this.issues.set(issue.id, updated);
    this.issuesByKey.set(issue.key, updated);
    return updated;
  }

  deleteIssue(idOrKey: string): boolean {
    const issue = this.getIssue(idOrKey);
    if (!issue) {
      return false;
    }

    this.issues.delete(issue.id);
    this.issuesByKey.delete(issue.key);

    // Also delete associated worklogs
    this.worklogsByIssue.delete(issue.id);

    return true;
  }

  getAllIssues(): IssueBean[] {
    return Array.from(this.issues.values());
  }

  searchIssues(filters: IssueFilters, options: QueryOptions = {}): SearchResults {
    let results = this.getAllIssues();

    // Apply filters
    if (filters.projectKey) {
      results = results.filter((issue) => issue.fields.project.key === filters.projectKey);
    }

    if (filters.projectId) {
      results = results.filter((issue) => issue.fields.project.id === filters.projectId);
    }

    if (filters.issueType) {
      results = results.filter((issue) => issue.fields.issuetype.name === filters.issueType);
    }

    if (filters.status) {
      results = results.filter((issue) => issue.fields.status.name === filters.status);
    }

    if (filters.assignee) {
      results = results.filter(
        (issue) => issue.fields.assignee?.accountId === filters.assignee
      );
    }

    if (filters.reporter) {
      results = results.filter(
        (issue) => issue.fields.reporter?.accountId === filters.reporter
      );
    }

    if (filters.priority) {
      results = results.filter((issue) => issue.fields.priority.name === filters.priority);
    }

    if (filters.labels && filters.labels.length > 0) {
      results = results.filter((issue) =>
        filters.labels!.some((label) => issue.fields.labels?.includes(label))
      );
    }

    if (filters.keys && filters.keys.length > 0) {
      results = results.filter((issue) => filters.keys!.includes(issue.key));
    }

    // Apply sorting
    if (options.orderBy) {
      results.sort((a, b) => {
        const aValue = this.getFieldValue(a, options.orderBy!);
        const bValue = this.getFieldValue(b, options.orderBy!);
        const direction = options.orderDirection === 'desc' ? -1 : 1;
        return aValue > bValue ? direction : -direction;
      });
    }

    // Apply pagination
    const total = results.length;
    const startAt = options.startAt || 0;
    const maxResults = options.maxResults || 50;
    const paginated = results.slice(startAt, startAt + maxResults);

    return {
      expand: '',
      startAt,
      maxResults,
      total,
      issues: paginated,
    };
  }

  private getFieldValue(issue: IssueBean, field: string): any {
    if (field === 'created') return issue.fields.created;
    if (field === 'updated') return issue.fields.updated;
    if (field === 'key') return issue.key;
    return issue.fields[field];
  }

  // Issue Types
  addIssueType(issueType: IssueType): void {
    this.issueTypes.set(issueType.id, issueType);
  }

  getIssueType(id: string): IssueType | undefined {
    return this.issueTypes.get(id);
  }

  getAllIssueTypes(): IssueType[] {
    return Array.from(this.issueTypes.values());
  }

  // Priorities
  addPriority(priority: Priority): void {
    this.priorities.set(priority.id, priority);
  }

  getPriority(id: string): Priority | undefined {
    return this.priorities.get(id);
  }

  getAllPriorities(): Priority[] {
    return Array.from(this.priorities.values());
  }

  // Statuses
  addStatus(status: Status): void {
    this.statuses.set(status.id, status);
  }

  getStatus(id: string): Status | undefined {
    return this.statuses.get(id);
  }

  getAllStatuses(): Status[] {
    return Array.from(this.statuses.values());
  }

  // Status Categories
  addStatusCategory(category: StatusCategory): void {
    this.statusCategories.set(category.key, category);
  }

  getStatusCategory(key: string): StatusCategory | undefined {
    return this.statusCategories.get(key);
  }

  getAllStatusCategories(): StatusCategory[] {
    return Array.from(this.statusCategories.values());
  }

  // Components
  addComponent(component: Component): void {
    this.components.set(component.id, component);
  }

  getComponent(id: string): Component | undefined {
    return this.components.get(id);
  }

  getComponentsByProject(projectIdOrKey: string): Component[] {
    return Array.from(this.components.values()).filter(
      (c) => c.projectId?.toString() === projectIdOrKey || c.project === projectIdOrKey
    );
  }

  // Versions
  addVersion(version: Version): void {
    this.versions.set(version.id, version);
  }

  getVersion(id: string): Version | undefined {
    return this.versions.get(id);
  }

  getVersionsByProject(projectId: string): Version[] {
    return Array.from(this.versions.values()).filter(
      (v) => v.projectId.toString() === projectId
    );
  }

  // Worklogs
  addWorklog(worklog: Worklog): void {
    this.worklogs.set(worklog.id, worklog);

    // Index by issue
    const issueWorklogs = this.worklogsByIssue.get(worklog.issueId) || [];
    issueWorklogs.push(worklog);
    this.worklogsByIssue.set(worklog.issueId, issueWorklogs);
  }

  getWorklog(id: string): Worklog | undefined {
    return this.worklogs.get(id);
  }

  getWorklogsByIssue(issueIdOrKey: string): Worklog[] {
    const issue = this.getIssue(issueIdOrKey);
    if (!issue) {
      return [];
    }
    return this.worklogsByIssue.get(issue.id) || [];
  }

  // Fields
  addField(field: Field): void {
    this.fields.set(field.id, field);
  }

  getField(id: string): Field | undefined {
    return this.fields.get(id);
  }

  getAllFields(): Field[] {
    return Array.from(this.fields.values());
  }

  // Utility methods
  clear(): void {
    this.users.clear();
    this.projects.clear();
    this.projectsByKey.clear();
    this.issues.clear();
    this.issuesByKey.clear();
    this.issueTypes.clear();
    this.priorities.clear();
    this.statuses.clear();
    this.statusCategories.clear();
    this.components.clear();
    this.versions.clear();
    this.worklogs.clear();
    this.worklogsByIssue.clear();
    this.fields.clear();
    this.currentUser = null;
  }

  getStats() {
    return {
      users: this.users.size,
      projects: this.projects.size,
      issues: this.issues.size,
      issueTypes: this.issueTypes.size,
      priorities: this.priorities.size,
      statuses: this.statuses.size,
      statusCategories: this.statusCategories.size,
      components: this.components.size,
      versions: this.versions.size,
      worklogs: this.worklogs.size,
      fields: this.fields.size,
    };
  }
}
