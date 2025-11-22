import type {
  JiraMockConfig,
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
export const DEFAULT_PROJECT_CONFIG: Required<Omit<ProjectConfig, 'seed'>> = {
  statusDistribution: DEFAULT_STATUS_DISTRIBUTION,
  issueTypes: DEFAULT_ISSUE_TYPES_CONFIG,
  sprints: DEFAULT_SPRINTS_CONFIG,
  versions: DEFAULT_VERSIONS_CONFIG,
  worklogs: DEFAULT_WORKLOGS_CONFIG,
  data: DEFAULT_DATA_CONFIG,
  startIssueNumber: 1,
  startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months ago
  endDate: new Date().toISOString(),
};

/**
 * Complete default configuration (for backward compatibility)
 * @deprecated Use getBuiltInDefaults() instead
 */
export const DEFAULT_CONFIG = {
  version: '1.0' as const,
  statusDistribution: DEFAULT_STATUS_DISTRIBUTION,
  issueTypes: DEFAULT_ISSUE_TYPES_CONFIG,
  sprints: DEFAULT_SPRINTS_CONFIG,
  versions: DEFAULT_VERSIONS_CONFIG,
  worklogs: DEFAULT_WORKLOGS_CONFIG,
  data: DEFAULT_DATA_CONFIG,
};

/**
 * Deep merge helper function
 * Merges source into target, recursively merging nested objects
 */
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target } as any;

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        sourceValue !== undefined &&
        targetValue !== undefined &&
        typeof sourceValue === 'object' &&
        typeof targetValue === 'object' &&
        !Array.isArray(sourceValue) &&
        !Array.isArray(targetValue)
      ) {
        // Recursively merge nested objects
        result[key] = deepMerge(targetValue, sourceValue);
      } else if (sourceValue !== undefined) {
        // Override with source value
        result[key] = sourceValue;
      }
    }
  }

  return result as T;
}

/**
 * Gets the built-in default project configuration
 * @returns Built-in default configuration
 */
export function getBuiltInDefaults(): Required<Omit<ProjectConfig, 'seed'>> {
  return DEFAULT_PROJECT_CONFIG;
}

/**
 * Merges project configuration with global defaults and built-in defaults
 * Performs 3-level merge: built-in defaults → global defaults → project config
 *
 * @param projectConfig - Project-specific configuration
 * @param globalDefaults - Global default configuration (optional)
 * @returns Fully merged project configuration
 */
export function mergeProjectWithDefaults(
  projectConfig: ProjectConfigWithKey,
  globalDefaults?: ProjectConfig
): ProjectConfigWithKey {
  // 1. Start with built-in defaults
  const builtInDefaults = getBuiltInDefaults();

  // 2. Merge with global defaults if provided
  const baseConfig = globalDefaults
    ? deepMerge(builtInDefaults, globalDefaults)
    : builtInDefaults;

  // 3. Merge with project-specific config (preserve required fields)
  const merged = deepMerge(baseConfig, projectConfig);

  // Ensure required fields are preserved
  return {
    ...merged,
    projectKey: projectConfig.projectKey,
    issueCount: projectConfig.issueCount,
    projectName: projectConfig.projectName,
    projectType: projectConfig.projectType || 'company-managed',
  };
}

/**
 * Merges user configuration with default values (for backward compatibility)
 * @deprecated This function is deprecated and will be removed in the next version
 * @param config - User-provided configuration
 * @returns Merged configuration with all defaults applied
 */
export function mergeWithDefaults(config: JiraMockConfig): JiraMockConfig {
  return config;
}

/**
 * Gets a specific configuration value with fallback to default
 *
 * @param projectConfig - Project configuration
 * @param globalDefaults - Global defaults (optional)
 * @param path - Path to configuration value (e.g., 'statusDistribution.toDo')
 * @returns Configuration value or default
 */
export function getConfigValue<T>(
  projectConfig: ProjectConfigWithKey,
  globalDefaults: ProjectConfig | undefined,
  path: string
): T | undefined {
  const merged = mergeProjectWithDefaults(projectConfig, globalDefaults);
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
