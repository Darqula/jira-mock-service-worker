import { describe, it, expect } from 'vitest';
import { validateConfig, isValidConfig } from '../src/config/validator.js';
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
      globalDefaults: {
        seed: 12345,
      },
      projects: [
        {
          projectKey: 'TEST1',
        },
        {
          projectKey: 'TEST2',
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

  // Note: issueCount is no longer a field in the config.
  // It's now calculated automatically from issue types configuration.
});
