/**
 * Project type for Jira
 */
export type ProjectType = 'company-managed' | 'team-managed';

/**
 * Status distribution configuration
 */
export interface StatusDistribution {
  /** Probability of "To Do" status (0-1). Default: 0.4 */
  toDo?: number;
  /** Probability of "In Progress" status (0-1). Default: 0.3 */
  inProgress?: number;
  /** Probability of "Done" status (0-1). Default: 0.3 */
  done?: number;
}

/**
 * Child type distribution for epics
 */
export interface ChildDistribution {
  /** Probability of Story type (0-1). Default: 0.5 */
  story?: number;
  /** Probability of Task type (0-1). Default: 0.3 */
  task?: number;
  /** Probability of Bug type (0-1). Default: 0.2 */
  bug?: number;
}

/**
 * Epic configuration
 */
export interface EpicConfig {
  /** Number of epics to generate. Default: 10 */
  count?: number;
  /** Number of children per epic. Default: 100 */
  childrenPerEpic?: number;
  /** Probability of assigning epic to user (0-1). Default: 0.9 */
  assignProbability?: number;
  /** Probability of adding labels to epic (0-1). Default: 0.8 */
  labelProbability?: number;
  /** Distribution of child issue types */
  childDistribution?: ChildDistribution;
}

/**
 * Configuration for Story, Task, or Bug issue types
 */
export interface IssueTypeConfig {
  /** Number of standalone issues (not in epics). Default: 0 */
  standaloneCount?: number;
  /** Probability of assigning to user (0-1). Default: 0.8 (0.6 for bugs) */
  assignProbability?: number;
  /** Probability of adding labels (0-1). Default: 0.5 (0.3 for bugs) */
  labelProbability?: number;
}

/**
 * Issue types configuration
 */
export interface IssueTypesConfig {
  /** Epic configuration */
  epic?: EpicConfig;
  /** Story configuration */
  story?: IssueTypeConfig;
  /** Task configuration */
  task?: IssueTypeConfig;
  /** Bug configuration */
  bug?: IssueTypeConfig;
}

/**
 * Sprint configuration
 */
export interface SprintsConfig {
  /** Starting sprint number. Default: 1 */
  startNumber?: number;
  /** Sprint duration in days. Default: 14 */
  duration?: number;
  /** Probability of assigning issue to sprint (0-1). Default: 0.7 */
  assignProbability?: number;
}

/**
 * Version configuration
 */
export interface VersionsConfig {
  /** Starting version number. Default: 1 */
  startNumber?: number;
  /** Number of versions to generate. Default: 3 */
  count?: number;
  /** Probability of assigning issue to version (0-1). Default: 0.6 */
  assignProbability?: number;
}

/**
 * Worklog configuration
 */
export interface WorklogsConfig {
  /** Probability of adding worklogs to issue (0-1). Default: 0.6 */
  probability?: number;
  /** Minimum hours per worklog entry. Default: 1 */
  hoursMin?: number;
  /** Maximum hours per worklog entry. Default: 4 */
  hoursMax?: number;
  /** Minimum number of worklog entries per issue. Default: 1 */
  countMin?: number;
  /** Maximum number of worklog entries per issue. Default: 3 */
  countMax?: number;
}

/**
 * Data options configuration
 */
export interface DataConfig {
  /** Custom assignee email addresses */
  assignees?: string[];
  /** Priority names to include (filters available priorities) */
  priorities?: string[];
  /** Custom labels to use in issue generation */
  labels?: string[];
}

/**
 * Project-specific configuration
 * Contains all configuration fields that can be applied per-project
 */
export interface ProjectConfig {
  /** Random seed for reproducibility */
  seed?: number;
  /**
   * Exact number of issues to generate for this project (1-10000).
   * When omitted, the count is derived from the issue types configuration
   * (see calculateIssueCount). When set but lower than the epic count,
   * all epics are kept and children are reduced so the total equals
   * max(issueCount, epicCount).
   */
  issueCount?: number;
  /** Status distribution */
  statusDistribution?: StatusDistribution;
  /** Issue types configuration */
  issueTypes?: IssueTypesConfig;
  /** Sprint configuration */
  sprints?: SprintsConfig;
  /** Version configuration */
  versions?: VersionsConfig;
  /** Worklog configuration */
  worklogs?: WorklogsConfig;
  /** Data options */
  data?: DataConfig;
  /** Starting issue number. Default: 1 */
  startIssueNumber?: number;
  /** Start date for issue generation (ISO 8601). Default: 6 months ago */
  startDate?: string;
  /** End date for issue generation (ISO 8601). Default: today */
  endDate?: string;
}

/**
 * Project configuration with required project-specific fields
 * Issue count is taken from `issueCount` when set, otherwise calculated
 * from the issue types configuration
 */
export interface ProjectConfigWithKey extends ProjectConfig {
  /** Project key (e.g., "PROJ", "DEMO") - Required and must be unique */
  projectKey: string;
  /** Project name - Optional display name */
  projectName?: string;
  /** Project type. Default: "company-managed" */
  projectType?: ProjectType;
}

/**
 * Calculates the total issue count for a project based on its issue types configuration
 * @param config - Project configuration
 * @returns Total number of issues that will be generated
 */
export function calculateIssueCount(config: ProjectConfig): number {
  const issueTypes = config.issueTypes;

  if (!issueTypes) {
    // Default configuration: 10 epics with 100 children each
    return 10 * (1 + 100);
  }

  const epicCount = issueTypes.epic?.count ?? 10;
  const childrenPerEpic = issueTypes.epic?.childrenPerEpic ?? 100;
  const storyCount = issueTypes.story?.standaloneCount ?? 0;
  const taskCount = issueTypes.task?.standaloneCount ?? 0;
  const bugCount = issueTypes.bug?.standaloneCount ?? 0;

  // Total = epics + (children per epic * number of epics) + standalone stories + standalone tasks + standalone bugs
  return epicCount + childrenPerEpic * epicCount + storyCount + taskCount + bugCount;
}

/**
 * Main Jira Mock configuration interface with per-project configuration
 * All configuration must be specified at the project level.
 * Built-in defaults apply when project-level configuration is not specified.
 */
export interface JiraMockConfig {
  /** Configuration version */
  version: '1.0';
  /** Array of project-specific configurations (required, min 1 item) */
  projects: ProjectConfigWithKey[];
}
