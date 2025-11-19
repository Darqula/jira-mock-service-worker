import type {
  JiraMockConfig,
  GeneralConfig,
  StatusDistribution,
  IssueTypesConfig,
  SprintsConfig,
  VersionsConfig,
  WorklogsConfig,
  DataConfig,
} from './types.js';

/**
 * Default general configuration
 */
export const DEFAULT_GENERAL_CONFIG: Required<GeneralConfig> = {
  projectKey: 'PROJ',
  projectType: 'company-managed',
  startIssueNumber: 1,
  startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months ago
  endDate: new Date().toISOString(),
  chunkSize: 0,
};

/**
 * Default status distribution
 */
export const DEFAULT_STATUS_DISTRIBUTION: Required<StatusDistribution> = {
  toDo: 0.4,
  inProgress: 0.3,
  done: 0.3,
};

/**
 * Default issue types configuration
 */
export const DEFAULT_ISSUE_TYPES_CONFIG: Required<IssueTypesConfig> = {
  epic: {
    count: 10,
    childrenPerEpic: 100,
    assignProbability: 0.9,
    labelProbability: 0.8,
    childDistribution: {
      story: 0.5,
      task: 0.3,
      bug: 0.2,
    },
  },
  story: {
    standaloneCount: 0,
    assignProbability: 0.8,
    labelProbability: 0.5,
  },
  task: {
    standaloneCount: 0,
    assignProbability: 0.8,
    labelProbability: 0.5,
  },
  bug: {
    standaloneCount: 0,
    assignProbability: 0.6,
    labelProbability: 0.3,
  },
};

/**
 * Default sprint configuration
 */
export const DEFAULT_SPRINTS_CONFIG: Required<SprintsConfig> = {
  startNumber: 1,
  duration: 14,
  assignProbability: 0.7,
};

/**
 * Default version configuration
 */
export const DEFAULT_VERSIONS_CONFIG: Required<VersionsConfig> = {
  startNumber: 1,
  count: 3,
  assignProbability: 0.6,
};

/**
 * Default worklog configuration
 */
export const DEFAULT_WORKLOGS_CONFIG: Required<WorklogsConfig> = {
  probability: 0.6,
  hoursMin: 1,
  hoursMax: 4,
  countMin: 1,
  countMax: 3,
};

/**
 * Default data configuration
 */
export const DEFAULT_DATA_CONFIG: Required<DataConfig> = {
  assignees: [],
  priorities: ['Low', 'Medium', 'High', 'Highest'],
  labels: ['frontend', 'backend', 'api', 'bug', 'enhancement'],
};

/**
 * Complete default configuration (excluding seed which is optional)
 */
export const DEFAULT_CONFIG = {
  version: '1.0' as const,
  general: DEFAULT_GENERAL_CONFIG,
  statusDistribution: DEFAULT_STATUS_DISTRIBUTION,
  issueTypes: DEFAULT_ISSUE_TYPES_CONFIG,
  sprints: DEFAULT_SPRINTS_CONFIG,
  versions: DEFAULT_VERSIONS_CONFIG,
  worklogs: DEFAULT_WORKLOGS_CONFIG,
  data: DEFAULT_DATA_CONFIG,
};

/**
 * Merges user configuration with default values
 * Performs deep merge for nested objects
 *
 * @param config - User-provided configuration
 * @returns Merged configuration with all defaults applied
 */
export function mergeWithDefaults(config: JiraMockConfig): JiraMockConfig {
  return {
    version: config.version,
    seed: config.seed,

    general: {
      ...DEFAULT_GENERAL_CONFIG,
      ...config.general,
    },

    statusDistribution: {
      ...DEFAULT_STATUS_DISTRIBUTION,
      ...config.statusDistribution,
    },

    issueTypes: {
      epic: {
        ...DEFAULT_ISSUE_TYPES_CONFIG.epic,
        ...config.issueTypes?.epic,
        childDistribution: {
          ...DEFAULT_ISSUE_TYPES_CONFIG.epic.childDistribution,
          ...config.issueTypes?.epic?.childDistribution,
        },
      },
      story: {
        ...DEFAULT_ISSUE_TYPES_CONFIG.story,
        ...config.issueTypes?.story,
      },
      task: {
        ...DEFAULT_ISSUE_TYPES_CONFIG.task,
        ...config.issueTypes?.task,
      },
      bug: {
        ...DEFAULT_ISSUE_TYPES_CONFIG.bug,
        ...config.issueTypes?.bug,
      },
    },

    sprints: {
      ...DEFAULT_SPRINTS_CONFIG,
      ...config.sprints,
    },

    versions: {
      ...DEFAULT_VERSIONS_CONFIG,
      ...config.versions,
    },

    worklogs: {
      ...DEFAULT_WORKLOGS_CONFIG,
      ...config.worklogs,
    },

    data: {
      ...DEFAULT_DATA_CONFIG,
      ...config.data,
    },

    projects: config.projects,
  };
}

/**
 * Gets a specific configuration value with fallback to default
 *
 * @param config - User configuration
 * @param path - Path to configuration value (e.g., 'general.projectKey')
 * @returns Configuration value or default
 */
export function getConfigValue<T>(
  config: JiraMockConfig,
  path: string
): T | undefined {
  const merged = mergeWithDefaults(config);
  const parts = path.split('.');
  let value: any = merged;

  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      return undefined;
    }
  }

  return value as T;
}
