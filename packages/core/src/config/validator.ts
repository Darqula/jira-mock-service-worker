import { ZodError } from 'zod';
import { JiraMockConfigSchema } from './schema.js';
import type { JiraMockConfig } from './types.js';
import { calculateIssueCount } from './types.js';

export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public errors: ZodError
  ) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

export interface ConfigWarning {
  path: string;
  message: string;
  severity: 'warning' | 'info';
}

export interface ValidationResult {
  valid: boolean;
  config?: JiraMockConfig;
  errors: string[];
  warnings: ConfigWarning[];
}

/**
 * Validates configuration and throws on error
 */
export function validateConfig(config: unknown): JiraMockConfig {
  try {
    return JiraMockConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ConfigValidationError('Invalid configuration', error);
    }
    throw error;
  }
}

/**
 * Validates configuration and returns detailed result with warnings
 */
export function validateConfigWithWarnings(config: unknown): ValidationResult {
  const result = JiraMockConfigSchema.safeParse(config);

  if (!result.success) {
    return {
      valid: false,
      errors: result.error.errors.map(
        (err) => `${err.path.join('.')}: ${err.message}`
      ),
      warnings: [],
    };
  }

  const warnings: ConfigWarning[] = [];
  const validConfig = result.data;

  // Check for large issue counts across all projects
  const totalIssues = validConfig.projects.reduce((sum, p) => sum + calculateIssueCount(p), 0);
  if (totalIssues > 1000) {
    warnings.push({
      path: 'projects',
      message: `Total issue count across all projects (${totalIssues}) is large. Generation may take some time.`,
      severity: 'warning',
    });
  }

  if (totalIssues > 10000) {
    warnings.push({
      path: 'projects',
      message: `Total issue count across all projects (${totalIssues}) is very large. Generation may take significant time.`,
      severity: 'warning',
    });
  }

  // Check each project's configuration
  validConfig.projects.forEach((project, index) => {
    // Check epic child distribution sums close to 1
    const epicConfig = project.issueTypes?.epic;
    if (epicConfig?.childDistribution) {
      const { story = 0.5, task = 0.3, bug = 0.2 } = epicConfig.childDistribution;
      const sum = story + task + bug;
      if (Math.abs(sum - 1.0) > 0.01) {
        warnings.push({
          path: `projects[${index}].issueTypes.epic.childDistribution`,
          message: `Child distribution probabilities sum to ${sum.toFixed(2)}, expected ~1.0. Values will be normalized.`,
          severity: 'info',
        });
      }
    }

    // Check status distribution sums close to 1
    if (project.statusDistribution) {
      const { toDo = 0.4, inProgress = 0.3, done = 0.3 } = project.statusDistribution;
      const sum = toDo + inProgress + done;
      if (Math.abs(sum - 1.0) > 0.01) {
        warnings.push({
          path: `projects[${index}].statusDistribution`,
          message: `Status distribution probabilities sum to ${sum.toFixed(2)}, expected ~1.0. Values will be normalized.`,
          severity: 'info',
        });
      }
    }
  });

  return {
    valid: true,
    config: validConfig,
    errors: [],
    warnings,
  };
}

/**
 * Type guard for config validation
 */
export function isValidConfig(config: unknown): config is JiraMockConfig {
  return JiraMockConfigSchema.safeParse(config).success;
}

/**
 * Gets validation errors as string array
 */
export function getConfigErrors(config: unknown): string[] {
  const result = JiraMockConfigSchema.safeParse(config);
  if (result.success) {
    return [];
  }
  return result.error.errors.map(
    (err) => `${err.path.join('.')}: ${err.message}`
  );
}

/**
 * Gets human-readable error messages
 */
export function getHumanReadableErrors(config: unknown): string[] {
  const result = JiraMockConfigSchema.safeParse(config);
  if (result.success) {
    return [];
  }

  return result.error.errors.map((err) => {
    const path = err.path.join('.');

    switch (err.code) {
      case 'invalid_type':
        return `${path}: Expected ${err.expected}, but got ${err.received}`;
      case 'too_small':
        if (err.type === 'number') {
          return `${path}: Value must be at least ${err.minimum}`;
        }
        if (err.type === 'string') {
          return `${path}: String must be at least ${err.minimum} characters`;
        }
        return `${path}: ${err.message}`;
      case 'too_big':
        if (err.type === 'number') {
          return `${path}: Value must be at most ${err.maximum}`;
        }
        if (err.type === 'string') {
          return `${path}: String must be at most ${err.maximum} characters`;
        }
        return `${path}: ${err.message}`;
      case 'invalid_string':
        if (err.validation === 'email') {
          return `${path}: Must be a valid email address`;
        }
        if (err.validation === 'datetime') {
          return `${path}: Must be a valid ISO 8601 date-time string`;
        }
        return `${path}: ${err.message}`;
      default:
        return `${path}: ${err.message}`;
    }
  });
}
