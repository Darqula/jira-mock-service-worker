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
  Comment,
  Attachment,
  IssueLink,
  IssueLinkType,
  UserProperty,
  ProjectProperty,
  IssueProperty,
  Permission,
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
  projectKeys?: string[];
  projectIds?: string[];
  issueType?: string;
  issueTypes?: string[];
  issueTypeExclude?: string;
  issueTypesExclude?: string[];
  status?: string;
  statuses?: string[];
  statusExclude?: string;
  statusesExclude?: string[];
  assignee?: string;
  assignees?: string[];
  assigneeExclude?: string;
  assigneesExclude?: string[];
  assigneeIsEmpty?: boolean;
  assigneeIsNotEmpty?: boolean;
  reporter?: string;
  reporters?: string[];
  reporterExclude?: string;
  reportersExclude?: string[];
  reporterIsEmpty?: boolean;
  reporterIsNotEmpty?: boolean;
  priority?: string;
  priorities?: string[];
  priorityExclude?: string;
  prioritiesExclude?: string[];
  labels?: string[];
  labelsExclude?: string[];
  labelsIsEmpty?: boolean;
  labelsIsNotEmpty?: boolean;
  keys?: string[];
  keysExclude?: string[];
  resolution?: string;
  resolutions?: string[];
  resolutionIsEmpty?: boolean;
  resolutionIsNotEmpty?: boolean;
  summaryContains?: string;
  summaryNotContains?: string;
  descriptionContains?: string;
  descriptionNotContains?: string;
  textContains?: string;
  createdAfter?: string;
  createdBefore?: string;
  createdEquals?: string;
  updatedAfter?: string;
  updatedBefore?: string;
  updatedEquals?: string;
  resolvedAfter?: string;
  resolvedBefore?: string;
  dueAfter?: string;
  dueBefore?: string;
  component?: string;
  components?: string[];
  componentIsEmpty?: boolean;
  componentIsNotEmpty?: boolean;
  fixVersion?: string;
  fixVersions?: string[];
  fixVersionIsEmpty?: boolean;
  fixVersionIsNotEmpty?: boolean;
  affectedVersion?: string;
  affectedVersions?: string[];
  sprint?: string;
  sprints?: string[];
  sprintIsEmpty?: boolean;
  sprintIsNotEmpty?: boolean;
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
  private comments: Map<string, Comment> = new Map();
  private commentsByIssue: Map<string, Comment[]> = new Map();
  private attachments: Map<string, Attachment> = new Map();
  private attachmentsByIssue: Map<string, Attachment[]> = new Map();
  private issueLinks: Map<string, IssueLink> = new Map();
  private issueLinksByIssue: Map<string, IssueLink[]> = new Map();
  private issueLinkTypes: Map<string, IssueLinkType> = new Map();

  // Properties
  private userProperties: Map<string, Map<string, UserProperty>> = new Map();
  private projectProperties: Map<string, Map<string, ProjectProperty>> = new Map();
  private issueProperties: Map<string, Map<string, IssueProperty>> = new Map();

  // Permissions
  private userPermissions: Map<string, Permission[]> = new Map();

  // Worklog tracking
  private worklogUpdates: Map<string, { worklog: Worklog; timestamp: number }> = new Map();
  private worklogDeletes: Map<string, number> = new Map();

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
    // Project filters
    if (filters.projectKey) {
      results = results.filter((issue) => issue.fields.project.key === filters.projectKey);
    }

    if (filters.projectId) {
      results = results.filter((issue) => issue.fields.project.id === filters.projectId);
    }

    // Handle array filters with OR logic (for IN clauses)
    if ((filters.projectKeys && filters.projectKeys.length > 0) ||
        (filters.projectIds && filters.projectIds.length > 0)) {
      results = results.filter((issue) => {
        const matchesKey = filters.projectKeys?.includes(issue.fields.project.key) ?? false;
        const matchesId = filters.projectIds?.includes(issue.fields.project.id) ?? false;
        return matchesKey || matchesId;
      });
    }

    // Issue type filters
    if (filters.issueType) {
      results = results.filter((issue) => issue.fields.issuetype.name === filters.issueType);
    }

    if (filters.issueTypes && filters.issueTypes.length > 0) {
      results = results.filter((issue) => filters.issueTypes!.includes(issue.fields.issuetype.name));
    }

    if (filters.issueTypeExclude) {
      results = results.filter((issue) => issue.fields.issuetype.name !== filters.issueTypeExclude);
    }

    if (filters.issueTypesExclude && filters.issueTypesExclude.length > 0) {
      results = results.filter((issue) => !filters.issueTypesExclude!.includes(issue.fields.issuetype.name));
    }

    // Status filters
    if (filters.status) {
      results = results.filter((issue) => issue.fields.status.name === filters.status);
    }

    if (filters.statuses && filters.statuses.length > 0) {
      results = results.filter((issue) => filters.statuses!.includes(issue.fields.status.name));
    }

    if (filters.statusExclude) {
      results = results.filter((issue) => issue.fields.status.name !== filters.statusExclude);
    }

    if (filters.statusesExclude && filters.statusesExclude.length > 0) {
      results = results.filter((issue) => !filters.statusesExclude!.includes(issue.fields.status.name));
    }

    // Assignee filters
    if (filters.assignee) {
      results = results.filter(
        (issue) => issue.fields.assignee?.accountId === filters.assignee
      );
    }

    if (filters.assignees && filters.assignees.length > 0) {
      results = results.filter(
        (issue) => issue.fields.assignee && filters.assignees!.includes(issue.fields.assignee.accountId)
      );
    }

    if (filters.assigneeExclude) {
      results = results.filter(
        (issue) => issue.fields.assignee?.accountId !== filters.assigneeExclude
      );
    }

    if (filters.assigneesExclude && filters.assigneesExclude.length > 0) {
      results = results.filter(
        (issue) => !issue.fields.assignee || !filters.assigneesExclude!.includes(issue.fields.assignee.accountId)
      );
    }

    if (filters.assigneeIsEmpty) {
      results = results.filter((issue) => !issue.fields.assignee);
    }

    if (filters.assigneeIsNotEmpty) {
      results = results.filter((issue) => !!issue.fields.assignee);
    }

    // Reporter filters
    if (filters.reporter) {
      results = results.filter(
        (issue) => issue.fields.reporter?.accountId === filters.reporter
      );
    }

    if (filters.reporters && filters.reporters.length > 0) {
      results = results.filter(
        (issue) => issue.fields.reporter && filters.reporters!.includes(issue.fields.reporter.accountId)
      );
    }

    if (filters.reporterExclude) {
      results = results.filter(
        (issue) => issue.fields.reporter?.accountId !== filters.reporterExclude
      );
    }

    if (filters.reportersExclude && filters.reportersExclude.length > 0) {
      results = results.filter(
        (issue) => !issue.fields.reporter || !filters.reportersExclude!.includes(issue.fields.reporter.accountId)
      );
    }

    if (filters.reporterIsEmpty) {
      results = results.filter((issue) => !issue.fields.reporter);
    }

    if (filters.reporterIsNotEmpty) {
      results = results.filter((issue) => !!issue.fields.reporter);
    }

    // Priority filters
    if (filters.priority) {
      results = results.filter((issue) => issue.fields.priority.name === filters.priority);
    }

    if (filters.priorities && filters.priorities.length > 0) {
      results = results.filter((issue) => filters.priorities!.includes(issue.fields.priority.name));
    }

    if (filters.priorityExclude) {
      results = results.filter((issue) => issue.fields.priority.name !== filters.priorityExclude);
    }

    if (filters.prioritiesExclude && filters.prioritiesExclude.length > 0) {
      results = results.filter((issue) => !filters.prioritiesExclude!.includes(issue.fields.priority.name));
    }

    // Labels filters
    if (filters.labels && filters.labels.length > 0) {
      results = results.filter((issue) =>
        filters.labels!.some((label) => issue.fields.labels?.includes(label))
      );
    }

    if (filters.labelsExclude && filters.labelsExclude.length > 0) {
      results = results.filter((issue) =>
        !filters.labelsExclude!.some((label) => issue.fields.labels?.includes(label))
      );
    }

    if (filters.labelsIsEmpty) {
      results = results.filter((issue) => !issue.fields.labels || issue.fields.labels.length === 0);
    }

    if (filters.labelsIsNotEmpty) {
      results = results.filter((issue) => issue.fields.labels && issue.fields.labels.length > 0);
    }

    // Key filters
    if (filters.keys && filters.keys.length > 0) {
      results = results.filter((issue) => filters.keys!.includes(issue.key));
    }

    if (filters.keysExclude && filters.keysExclude.length > 0) {
      results = results.filter((issue) => !filters.keysExclude!.includes(issue.key));
    }

    // Resolution filters
    if (filters.resolution) {
      results = results.filter((issue) => (issue.fields as any).resolution?.name === filters.resolution);
    }

    if (filters.resolutions && filters.resolutions.length > 0) {
      results = results.filter((issue) => {
        const resolution = (issue.fields as any).resolution;
        return resolution && filters.resolutions!.includes(resolution.name);
      });
    }

    if (filters.resolutionIsEmpty) {
      results = results.filter((issue) => !(issue.fields as any).resolution);
    }

    if (filters.resolutionIsNotEmpty) {
      results = results.filter((issue) => !!(issue.fields as any).resolution);
    }

    // Text search filters
    if (filters.summaryContains) {
      const searchTerm = filters.summaryContains.toLowerCase();
      results = results.filter((issue) =>
        issue.fields.summary?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.summaryNotContains) {
      const searchTerm = filters.summaryNotContains.toLowerCase();
      results = results.filter((issue) =>
        !issue.fields.summary?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.descriptionContains) {
      const searchTerm = filters.descriptionContains.toLowerCase();
      results = results.filter((issue) =>
        issue.fields.description?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.descriptionNotContains) {
      const searchTerm = filters.descriptionNotContains.toLowerCase();
      results = results.filter((issue) =>
        !issue.fields.description?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.textContains) {
      const searchTerm = filters.textContains.toLowerCase();
      results = results.filter((issue) => {
        const summary = issue.fields.summary?.toLowerCase() || '';
        const description = issue.fields.description?.toLowerCase() || '';
        return summary.includes(searchTerm) || description.includes(searchTerm);
      });
    }

    // Date filters
    if (filters.createdAfter) {
      const afterDate = new Date(filters.createdAfter).getTime();
      results = results.filter((issue) => new Date(issue.fields.created).getTime() >= afterDate);
    }

    if (filters.createdBefore) {
      const beforeDate = new Date(filters.createdBefore).getTime();
      results = results.filter((issue) => new Date(issue.fields.created).getTime() <= beforeDate);
    }

    if (filters.createdEquals) {
      const equalsDate = new Date(filters.createdEquals).toISOString().split('T')[0];
      results = results.filter((issue) => {
        const issueDate = new Date(issue.fields.created).toISOString().split('T')[0];
        return issueDate === equalsDate;
      });
    }

    if (filters.updatedAfter) {
      const afterDate = new Date(filters.updatedAfter).getTime();
      results = results.filter((issue) => new Date(issue.fields.updated).getTime() >= afterDate);
    }

    if (filters.updatedBefore) {
      const beforeDate = new Date(filters.updatedBefore).getTime();
      results = results.filter((issue) => new Date(issue.fields.updated).getTime() <= beforeDate);
    }

    if (filters.updatedEquals) {
      const equalsDate = new Date(filters.updatedEquals).toISOString().split('T')[0];
      results = results.filter((issue) => {
        const issueDate = new Date(issue.fields.updated).toISOString().split('T')[0];
        return issueDate === equalsDate;
      });
    }

    if (filters.resolvedAfter) {
      const afterDate = new Date(filters.resolvedAfter).getTime();
      results = results.filter((issue) => {
        const resolved = (issue.fields as any).resolutiondate;
        return resolved && new Date(resolved).getTime() >= afterDate;
      });
    }

    if (filters.resolvedBefore) {
      const beforeDate = new Date(filters.resolvedBefore).getTime();
      results = results.filter((issue) => {
        const resolved = (issue.fields as any).resolutiondate;
        return resolved && new Date(resolved).getTime() <= beforeDate;
      });
    }

    if (filters.dueAfter) {
      const afterDate = new Date(filters.dueAfter).getTime();
      results = results.filter((issue) => {
        const due = (issue.fields as any).duedate;
        return due && new Date(due).getTime() >= afterDate;
      });
    }

    if (filters.dueBefore) {
      const beforeDate = new Date(filters.dueBefore).getTime();
      results = results.filter((issue) => {
        const due = (issue.fields as any).duedate;
        return due && new Date(due).getTime() <= beforeDate;
      });
    }

    // Component filters
    if (filters.component) {
      results = results.filter((issue) => {
        const components = (issue.fields as any).components;
        return components && components.some((c: any) => c.name === filters.component);
      });
    }

    if (filters.components && filters.components.length > 0) {
      results = results.filter((issue) => {
        const components = (issue.fields as any).components;
        return components && components.some((c: any) => filters.components!.includes(c.name));
      });
    }

    if (filters.componentIsEmpty) {
      results = results.filter((issue) => {
        const components = (issue.fields as any).components;
        return !components || components.length === 0;
      });
    }

    if (filters.componentIsNotEmpty) {
      results = results.filter((issue) => {
        const components = (issue.fields as any).components;
        return components && components.length > 0;
      });
    }

    // Fix version filters
    if (filters.fixVersion) {
      results = results.filter((issue) => {
        const fixVersions = (issue.fields as any).fixVersions;
        return fixVersions && fixVersions.some((v: any) => v.name === filters.fixVersion);
      });
    }

    if (filters.fixVersions && filters.fixVersions.length > 0) {
      results = results.filter((issue) => {
        const fixVersions = (issue.fields as any).fixVersions;
        return fixVersions && fixVersions.some((v: any) => filters.fixVersions!.includes(v.name));
      });
    }

    if (filters.fixVersionIsEmpty) {
      results = results.filter((issue) => {
        const fixVersions = (issue.fields as any).fixVersions;
        return !fixVersions || fixVersions.length === 0;
      });
    }

    if (filters.fixVersionIsNotEmpty) {
      results = results.filter((issue) => {
        const fixVersions = (issue.fields as any).fixVersions;
        return fixVersions && fixVersions.length > 0;
      });
    }

    // Affected version filters
    if (filters.affectedVersion) {
      results = results.filter((issue) => {
        const versions = (issue.fields as any).versions;
        return versions && versions.some((v: any) => v.name === filters.affectedVersion);
      });
    }

    if (filters.affectedVersions && filters.affectedVersions.length > 0) {
      results = results.filter((issue) => {
        const versions = (issue.fields as any).versions;
        return versions && versions.some((v: any) => filters.affectedVersions!.includes(v.name));
      });
    }

    // Sprint filters
    if (filters.sprint) {
      results = results.filter((issue) => {
        const sprint = (issue.fields as any).sprint;
        return sprint && sprint.name === filters.sprint;
      });
    }

    if (filters.sprints && filters.sprints.length > 0) {
      results = results.filter((issue) => {
        const sprint = (issue.fields as any).sprint;
        return sprint && filters.sprints!.includes(sprint.name);
      });
    }

    if (filters.sprintIsEmpty) {
      results = results.filter((issue) => {
        const sprint = (issue.fields as any).sprint;
        return !sprint;
      });
    }

    if (filters.sprintIsNotEmpty) {
      results = results.filter((issue) => {
        const sprint = (issue.fields as any).sprint;
        return !!sprint;
      });
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

  getAllComponents(): Component[] {
    return Array.from(this.components.values());
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

  getAllVersions(): Version[] {
    return Array.from(this.versions.values());
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

  // Comments
  addComment(comment: Comment, issueIdOrKey: string): void {
    this.comments.set(comment.id, comment);

    // Index by issue
    const issue = this.getIssue(issueIdOrKey);
    if (issue) {
      const issueComments = this.commentsByIssue.get(issue.id) || [];
      issueComments.push(comment);
      this.commentsByIssue.set(issue.id, issueComments);
    }
  }

  getComment(id: string): Comment | undefined {
    return this.comments.get(id);
  }

  getCommentsByIssue(issueIdOrKey: string): Comment[] {
    const issue = this.getIssue(issueIdOrKey);
    if (!issue) {
      return [];
    }
    return this.commentsByIssue.get(issue.id) || [];
  }

  updateComment(id: string, updates: Partial<Comment>): Comment | undefined {
    const comment = this.comments.get(id);
    if (!comment) {
      return undefined;
    }

    const updated: Comment = {
      ...comment,
      ...updates,
      updated: new Date().toISOString(),
    };

    this.comments.set(id, updated);
    return updated;
  }

  deleteComment(id: string, issueIdOrKey: string): boolean {
    const comment = this.comments.get(id);
    if (!comment) {
      return false;
    }

    this.comments.delete(id);

    // Remove from issue index
    const issue = this.getIssue(issueIdOrKey);
    if (issue) {
      const issueComments = this.commentsByIssue.get(issue.id) || [];
      this.commentsByIssue.set(
        issue.id,
        issueComments.filter((c) => c.id !== id)
      );
    }

    return true;
  }

  // Attachments
  addAttachment(attachment: Attachment, issueIdOrKey: string): void {
    this.attachments.set(attachment.id, attachment);

    // Index by issue
    const issue = this.getIssue(issueIdOrKey);
    if (issue) {
      const issueAttachments = this.attachmentsByIssue.get(issue.id) || [];
      issueAttachments.push(attachment);
      this.attachmentsByIssue.set(issue.id, issueAttachments);
    }
  }

  getAttachment(id: string): Attachment | undefined {
    return this.attachments.get(id);
  }

  getAttachmentsByIssue(issueIdOrKey: string): Attachment[] {
    const issue = this.getIssue(issueIdOrKey);
    if (!issue) {
      return [];
    }
    return this.attachmentsByIssue.get(issue.id) || [];
  }

  deleteAttachment(id: string): boolean {
    const attachment = this.attachments.get(id);
    if (!attachment) {
      return false;
    }

    this.attachments.delete(id);

    // Remove from all issue indexes
    for (const [issueId, attachments] of this.attachmentsByIssue.entries()) {
      this.attachmentsByIssue.set(
        issueId,
        attachments.filter((a) => a.id !== id)
      );
    }

    return true;
  }

  // Issue Links
  addIssueLink(link: IssueLink): void {
    this.issueLinks.set(link.id, link);

    // Index by both inward and outward issues
    if (link.inwardIssue) {
      const links = this.issueLinksByIssue.get(link.inwardIssue.id) || [];
      links.push(link);
      this.issueLinksByIssue.set(link.inwardIssue.id, links);
    }

    if (link.outwardIssue) {
      const links = this.issueLinksByIssue.get(link.outwardIssue.id) || [];
      links.push(link);
      this.issueLinksByIssue.set(link.outwardIssue.id, links);
    }
  }

  getIssueLink(id: string): IssueLink | undefined {
    return this.issueLinks.get(id);
  }

  getIssueLinksByIssue(issueIdOrKey: string): IssueLink[] {
    const issue = this.getIssue(issueIdOrKey);
    if (!issue) {
      return [];
    }
    return this.issueLinksByIssue.get(issue.id) || [];
  }

  deleteIssueLink(id: string): boolean {
    const link = this.issueLinks.get(id);
    if (!link) {
      return false;
    }

    this.issueLinks.delete(id);

    // Remove from issue indexes
    if (link.inwardIssue) {
      const links = this.issueLinksByIssue.get(link.inwardIssue.id) || [];
      this.issueLinksByIssue.set(
        link.inwardIssue.id,
        links.filter((l) => l.id !== id)
      );
    }

    if (link.outwardIssue) {
      const links = this.issueLinksByIssue.get(link.outwardIssue.id) || [];
      this.issueLinksByIssue.set(
        link.outwardIssue.id,
        links.filter((l) => l.id !== id)
      );
    }

    return true;
  }

  // Issue Link Types
  addIssueLinkType(linkType: IssueLinkType): void {
    this.issueLinkTypes.set(linkType.id, linkType);
  }

  getIssueLinkType(id: string): IssueLinkType | undefined {
    return this.issueLinkTypes.get(id);
  }

  getIssueLinkTypeByName(name: string): IssueLinkType | undefined {
    return Array.from(this.issueLinkTypes.values()).find((lt) => lt.name === name);
  }

  getAllIssueLinkTypes(): IssueLinkType[] {
    return Array.from(this.issueLinkTypes.values());
  }

  // User Properties
  getUserProperty(accountId: string, key: string): UserProperty | undefined {
    const userProps = this.userProperties.get(accountId);
    return userProps?.get(key);
  }

  setUserProperty(accountId: string, key: string, value: any): void {
    if (!this.userProperties.has(accountId)) {
      this.userProperties.set(accountId, new Map());
    }
    this.userProperties.get(accountId)!.set(key, { key, value });
  }

  deleteUserProperty(accountId: string, key: string): boolean {
    const userProps = this.userProperties.get(accountId);
    if (!userProps) {
      return false;
    }
    return userProps.delete(key);
  }

  getAllUserProperties(accountId: string): UserProperty[] {
    const userProps = this.userProperties.get(accountId);
    return userProps ? Array.from(userProps.values()) : [];
  }

  // Project Properties
  getProjectProperty(projectId: string, key: string): ProjectProperty | undefined {
    const projectProps = this.projectProperties.get(projectId);
    return projectProps?.get(key);
  }

  setProjectProperty(projectId: string, key: string, value: any): void {
    if (!this.projectProperties.has(projectId)) {
      this.projectProperties.set(projectId, new Map());
    }
    this.projectProperties.get(projectId)!.set(key, { key, value });
  }

  deleteProjectProperty(projectId: string, key: string): boolean {
    const projectProps = this.projectProperties.get(projectId);
    if (!projectProps) {
      return false;
    }
    return projectProps.delete(key);
  }

  getAllProjectProperties(projectId: string): ProjectProperty[] {
    const projectProps = this.projectProperties.get(projectId);
    return projectProps ? Array.from(projectProps.values()) : [];
  }

  // Issue Properties
  getIssueProperty(issueId: string, key: string): IssueProperty | undefined {
    const issueProps = this.issueProperties.get(issueId);
    return issueProps?.get(key);
  }

  setIssueProperty(issueId: string, key: string, value: any): void {
    if (!this.issueProperties.has(issueId)) {
      this.issueProperties.set(issueId, new Map());
    }
    this.issueProperties.get(issueId)!.set(key, { key, value });
  }

  deleteIssueProperty(issueId: string, key: string): boolean {
    const issueProps = this.issueProperties.get(issueId);
    if (!issueProps) {
      return false;
    }
    return issueProps.delete(key);
  }

  getAllIssueProperties(issueId: string): IssueProperty[] {
    const issueProps = this.issueProperties.get(issueId);
    return issueProps ? Array.from(issueProps.values()) : [];
  }

  // Permissions
  getUserPermissions(accountId: string): Permission[] {
    return this.userPermissions.get(accountId) || [];
  }

  setUserPermissions(accountId: string, permissions: Permission[]): void {
    this.userPermissions.set(accountId, permissions);
  }

  // Worklog Tracking
  updateWorklog(worklogId: string, updates: Partial<Worklog>): Worklog | undefined {
    const worklog = this.worklogs.get(worklogId);
    if (!worklog) {
      return undefined;
    }

    const updated: Worklog = {
      ...worklog,
      ...updates,
      updated: new Date().toISOString(),
    };

    this.worklogs.set(worklogId, updated);

    // Track the update
    this.worklogUpdates.set(worklogId, {
      worklog: updated,
      timestamp: Date.now(),
    });

    // Update in issue index
    const issueWorklogs = this.worklogsByIssue.get(worklog.issueId) || [];
    const index = issueWorklogs.findIndex((w) => w.id === worklogId);
    if (index !== -1) {
      issueWorklogs[index] = updated;
      this.worklogsByIssue.set(worklog.issueId, issueWorklogs);
    }

    return updated;
  }

  deleteWorklogById(worklogId: string): boolean {
    const worklog = this.worklogs.get(worklogId);
    if (!worklog) {
      return false;
    }

    this.worklogs.delete(worklogId);

    // Track the deletion
    this.worklogDeletes.set(worklogId, Date.now());

    // Remove from issue index
    const issueWorklogs = this.worklogsByIssue.get(worklog.issueId) || [];
    this.worklogsByIssue.set(
      worklog.issueId,
      issueWorklogs.filter((w) => w.id !== worklogId)
    );

    return true;
  }

  getUpdatedWorklogs(since: number): Worklog[] {
    const updates: Worklog[] = [];
    for (const [_, entry] of this.worklogUpdates.entries()) {
      if (entry.timestamp >= since) {
        updates.push(entry.worklog);
      }
    }
    return updates;
  }

  getDeletedWorklogIds(since: number): string[] {
    const deleted: string[] = [];
    for (const [id, timestamp] of this.worklogDeletes.entries()) {
      if (timestamp >= since) {
        deleted.push(id);
      }
    }
    return deleted;
  }

  getWorklogsByIds(ids: string[]): Worklog[] {
    const worklogs: Worklog[] = [];
    for (const id of ids) {
      const worklog = this.worklogs.get(id);
      if (worklog) {
        worklogs.push(worklog);
      }
    }
    return worklogs;
  }

  // Version Management
  swapVersionIssues(fromVersionId: string, toVersionId: string): void {
    const fromVersion = this.versions.get(fromVersionId);
    const toVersion = this.versions.get(toVersionId);

    if (!fromVersion || !toVersion) {
      return;
    }

    // Update all issues that have fromVersion
    for (const issue of this.issues.values()) {
      let updated = false;

      // Check fixVersions
      if (issue.fields.fixVersions) {
        const index = issue.fields.fixVersions.findIndex((v) => v.id === fromVersionId);
        if (index !== -1) {
          issue.fields.fixVersions[index] = toVersion;
          updated = true;
        }
      }

      // Check versions (affects versions)
      if (issue.fields.versions) {
        const index = issue.fields.versions.findIndex((v) => v.id === fromVersionId);
        if (index !== -1) {
          issue.fields.versions[index] = toVersion;
          updated = true;
        }
      }

      if (updated) {
        issue.fields.updated = new Date().toISOString();
      }
    }
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
    this.comments.clear();
    this.commentsByIssue.clear();
    this.attachments.clear();
    this.attachmentsByIssue.clear();
    this.issueLinks.clear();
    this.issueLinksByIssue.clear();
    this.issueLinkTypes.clear();
    this.userProperties.clear();
    this.projectProperties.clear();
    this.issueProperties.clear();
    this.userPermissions.clear();
    this.worklogUpdates.clear();
    this.worklogDeletes.clear();
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
      comments: this.comments.size,
      attachments: this.attachments.size,
      issueLinks: this.issueLinks.size,
      issueLinkTypes: this.issueLinkTypes.size,
      userProperties: this.userProperties.size,
      projectProperties: this.projectProperties.size,
      issueProperties: this.issueProperties.size,
      userPermissions: this.userPermissions.size,
    };
  }
}
