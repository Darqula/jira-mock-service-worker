import { describe, it, expect } from 'vitest';
import { validateConfig, isValidConfig, ConfigValidationError } from '../src/config/validator.js';
import type { JiraMockConfig } from '../src/config/types.js';

describe('Config Validation', () => {
  it('should validate a valid config', () => {
    const config: JiraMockConfig = {
      version: '1.0',
      projects: [
        {
          projectKey: 'TEST',
        },
      ],
    };

    expect(() => validateConfig(config)).not.toThrow();
    expect(isValidConfig(config)).toBe(true);
  });

  it('should validate config with seed', () => {
    const config: JiraMockConfig = {
      version: '1.0',
      projects: [
        {
          projectKey: 'TEST1',
          seed: 12345,
        },
        {
          projectKey: 'TEST2',
          seed: 54321,
        },
      ],
    };

    expect(() => validateConfig(config)).not.toThrow();
    expect(isValidConfig(config)).toBe(true);
  });

  it('should reject invalid version', () => {
    const config = {
      version: '2.0',
      projects: [
        {
          projectKey: 'TEST',
        },
      ],
    };

    expect(() => validateConfig(config)).toThrow();
    expect(isValidConfig(config)).toBe(false);
  });

  it('should reject empty projects array', () => {
    const config = {
      version: '1.0',
      projects: [],
    };

    expect(() => validateConfig(config)).toThrow();
    expect(isValidConfig(config)).toBe(false);
  });

  it('should reject duplicate project keys', () => {
    const config = {
      version: '1.0',
      projects: [
        {
          projectKey: 'TEST',
        },
        {
          projectKey: 'TEST',
        },
      ],
    };

    expect(() => validateConfig(config)).toThrow();
    expect(isValidConfig(config)).toBe(false);
  });

  // issueCount is an optional per-project field. When omitted, the issue
  // count is calculated automatically from the issue types configuration.

  it('should validate config with issueCount', () => {
    const config = {
      version: '1.0',
      projects: [
        {
          projectKey: 'P',
          projectName: 'P',
          issueCount: 50,
        },
      ],
    };

    expect(() => validateConfig(config)).not.toThrow();

    const validated = validateConfig(config);
    expect(validated.projects[0].issueCount).toBe(50);
  });

  it('should reject issueCount below 1', () => {
    const config = {
      version: '1.0',
      projects: [
        {
          projectKey: 'TEST',
          issueCount: 0,
        },
      ],
    };

    expect(() => validateConfig(config)).toThrow(ConfigValidationError);
  });

  it('should reject issueCount above 10000', () => {
    const config = {
      version: '1.0',
      projects: [
        {
          projectKey: 'TEST',
          issueCount: 10001,
        },
      ],
    };

    expect(() => validateConfig(config)).toThrow(ConfigValidationError);
  });

  it('should reject non-integer issueCount', () => {
    const config = {
      version: '1.0',
      projects: [
        {
          projectKey: 'TEST',
          issueCount: 10.5,
        },
      ],
    };

    expect(() => validateConfig(config)).toThrow(ConfigValidationError);
  });
});
