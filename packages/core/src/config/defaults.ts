import type {
  ProjectConfig,
  ProjectConfigWithKey,
  StatusDistribution,
  IssueTypesConfig,
  SprintsConfig,
  VersionsConfig,
  WorklogsConfig,
  DataConfig,
} from './types.js';

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
 * Built-in default project configuration
 * These are the baseline defaults that apply if no overrides are specified
 */
export const DEFAULT_PROJECT_CONFIG: Required<Omit<ProjectConfig, 'seed' | 'issueCount'>> = {
  statusDistribution: DEFAULT_STATUS_DISTRIBUTION,
  issueTypes: DEFAULT_ISSUE_TYPES_CONFIG,
  sprints: DEFAULT_SPRINTS_CONFIG,
  versions: DEFAULT_VERSIONS_CONFIG,
  worklogs: DEFAULT_WORKLOGS_CONFIG,
  data: DEFAULT_DATA_CONFIG,
  startIssueNumber: 1,
  startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months ago
  endDate: new Date().toISOString(),
  projectType: 'company-managed',
};

/**
 * Type guard for plain JSON-like objects (excludes arrays and null)
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Deep merge core. Recursively merges `source` into `target`, returning a
 * new object. Preserves legacy semantics: a `null` source value never
 * overwrites an existing object, and source values are copied, never
 * referenced.
 */
function deepMergeValues(target: unknown, source: unknown): unknown {
  if (source === null || source === undefined) {
    return isPlainObject(target) ? { ...target } : source;
  }

  if (!isPlainObject(source)) {
    return source;
  }

  if (!isPlainObject(target)) {
    return { ...source };
  }

  const result: Record<string, unknown> = { ...target };

  for (const [key, sourceValue] of Object.entries(source)) {
    if (sourceValue === undefined) {
      continue;
    }

    const targetValue = result[key];

    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      result[key] = deepMergeValues(targetValue, sourceValue);
    } else if (sourceValue === null && isPlainObject(targetValue)) {
      result[key] = { ...targetValue };
    } else {
      result[key] = sourceValue;
    }
  }

  return result;
}

/**
 * Deep merges `source` into `target`, recursively merging nested objects
 */
function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  return deepMergeValues(target, source) as T;
}

/**
 * Gets the built-in default project configuration
 * @returns Built-in default configuration
 */
export function getBuiltInDefaults(): Required<Omit<ProjectConfig, 'seed' | 'issueCount'>> {
  return DEFAULT_PROJECT_CONFIG;
}

/**
 * Merges project configuration with built-in defaults
 * Performs 2-level merge: built-in defaults → project config
 *
 * @param projectConfig - Project-specific configuration
 * @returns Fully merged project configuration
 */
export function mergeProjectWithDefaults(
  projectConfig: ProjectConfigWithKey
): ProjectConfigWithKey {
  // 1. Start with built-in defaults
  const builtInDefaults = getBuiltInDefaults();

  // 2. Merge with project-specific config (preserve required fields)
  const merged = deepMerge(builtInDefaults, projectConfig);

  // Ensure required fields are preserved
  return {
    ...merged,
    projectKey: projectConfig.projectKey,
    projectName: projectConfig.projectName,
    projectType: projectConfig.projectType || 'company-managed',
  };
}
