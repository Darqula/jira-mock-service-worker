// Core Jira API Types based on OpenAPI specification

export interface User {
  self: string;
  accountId: string;
  accountType: 'atlassian' | 'customer' | 'app';
  emailAddress?: string;
  avatarUrls: AvatarUrls;
  displayName: string;
  active: boolean;
  timeZone?: string;
  locale?: string;
}

export interface AvatarUrls {
  '48x48': string;
  '24x24': string;
  '16x16': string;
  '32x32': string;
}

export interface Project {
  self: string;
  id: string;
  key: string;
  name: string;
  description?: string;
  lead?: User;
  projectTypeKey: 'software' | 'service_desk' | 'business';
  simplified: boolean;
  style: 'classic' | 'next-gen';
  avatarUrls: AvatarUrls;
  issueTypes?: IssueType[];
  versions?: Version[];
  components?: Component[];
}

export interface IssueBean {
  id: string;
  key: string;
  self: string;
  fields: IssueFields;
}

export interface IssueFields {
  summary: string;
  description?: string;
  issuetype: IssueType;
  project: Project;
  reporter?: User;
  assignee?: User;
  priority: Priority;
  status: Status;
  created: string;
  updated: string;
  resolutiondate?: string;
  labels?: string[];
  components?: Component[];
  versions?: Version[];
  fixVersions?: Version[];
  worklog?: WorklogPage;
  [key: string]: any;
}

export interface IssueType {
  self: string;
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  subtask: boolean;
}

export interface Priority {
  self: string;
  id: string;
  name: string;
  iconUrl: string;
}

export interface Status {
  self: string;
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  statusCategory: StatusCategory;
}

export interface StatusCategory {
  self: string;
  id: number;
  key: string;
  name: string;
  colorName: string;
}

export interface Version {
  self: string;
  id: string;
  name: string;
  description?: string;
  archived: boolean;
  released: boolean;
  releaseDate?: string;
  projectId: number;
}

export interface Component {
  self: string;
  id: string;
  name: string;
  description?: string;
  lead?: User;
  assigneeType?: 'PROJECT_DEFAULT' | 'COMPONENT_LEAD' | 'PROJECT_LEAD' | 'UNASSIGNED';
  assignee?: User;
  project?: string;
  projectId?: number;
}

export interface Worklog {
  self: string;
  id: string;
  issueId: string;
  author: User;
  updateAuthor: User;
  comment?: string;
  created: string;
  updated: string;
  started: string;
  timeSpent: string;
  timeSpentSeconds: number;
}

export interface WorklogPage {
  startAt: number;
  maxResults: number;
  total: number;
  worklogs: Worklog[];
}

export interface Field {
  id: string;
  name: string;
  custom: boolean;
  orderable: boolean;
  navigable: boolean;
  searchable: boolean;
  clauseNames?: string[];
  schema?: FieldSchema;
}

export interface FieldSchema {
  type: string;
  system?: string;
  custom?: string;
  customId?: number;
}

export interface SearchResults {
  expand: string;
  startAt: number;
  maxResults: number;
  total: number;
  issues: IssueBean[];
}

export interface PageBeanProject {
  self: string;
  maxResults: number;
  startAt: number;
  total: number;
  isLast: boolean;
  values: Project[];
}

export interface PageBeanUser {
  self: string;
  maxResults: number;
  startAt: number;
  total: number;
  isLast: boolean;
  values: User[];
}

export interface IssuePickerSuggestions {
  sections: IssuePickerSection[];
}

export interface IssuePickerSection {
  label: string;
  sub?: string;
  id: string;
  msg?: string;
  issues: IssuePickerIssue[];
}

export interface IssuePickerIssue {
  id: string;
  key: string;
  keyHtml: string;
  img: string;
  summary: string;
  summaryText: string;
}

export interface Filter {
  self: string;
  id: string;
  name: string;
  description?: string;
  owner: User;
  jql: string;
  viewUrl: string;
  searchUrl: string;
  favourite: boolean;
  sharePermissions: SharePermission[];
  sharedUsers?: PageBeanUser;
  subscriptions?: PageBeanFilterSubscription;
}

export interface SharePermission {
  id: number;
  type: string;
  project?: Project;
  role?: ProjectRole;
  group?: Group;
  user?: User;
}

export interface ProjectRole {
  self: string;
  id: string;
  name: string;
  description?: string;
}

export interface Group {
  name: string;
  self?: string;
}

export interface PageBeanFilterSubscription {
  self: string;
  maxResults: number;
  startAt: number;
  total: number;
  isLast: boolean;
  values: FilterSubscription[];
}

export interface FilterSubscription {
  id: number;
  user: User;
}

export interface CreateIssueInput {
  fields: {
    project: {
      id?: string;
      key?: string;
    };
    summary: string;
    description?: string;
    issuetype: {
      id?: string;
      name?: string;
    };
    assignee?: {
      id?: string;
      accountId?: string;
    };
    priority?: {
      id?: string;
      name?: string;
    };
    labels?: string[];
    components?: Array<{ id?: string; name?: string }>;
    versions?: Array<{ id?: string; name?: string }>;
    [key: string]: any;
  };
}

export interface UpdateIssueInput {
  fields?: {
    summary?: string;
    description?: string;
    assignee?: {
      id?: string;
      accountId?: string;
    };
    priority?: {
      id?: string;
      name?: string;
    };
    labels?: string[];
    [key: string]: any;
  };
}

export interface CreateWorklogInput {
  comment?: string;
  started: string;
  timeSpent?: string;
  timeSpentSeconds: number;
}
