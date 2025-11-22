import { describe, it, expect } from 'vitest';
import { validateConfig, isValidConfig, getConfigErrors } from '../src/config/validator.js';
import type { JiraMockConfig } from '../src/config/types.js';

describe('Config Validation', () => {
  it('should validate a valid config', () => {
    const config: JiraMockConfig = {
      version: '1.0',
      projects: [
        {
          projectKey: 'TEST',
          issueCount: 100,
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
          issueCount: 50,
        },
        {
          projectKey: 'TEST2',
          issueCount: 50,
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
          issueCount: 100,
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
          issueCount: 100,
        },
        {
          projectKey: 'TEST',
          issueCount: 50,
        },
      ],
    };

    expect(() => validateConfig(config)).toThrow();
    expect(isValidConfig(config)).toBe(false);
  });

  it('should reject issue count < 1', () => {
    const config = {
      version: '1.0',
      projects: [
        {
          projectKey: 'TEST',
          issueCount: 0,
        },
      ],
    };

    expect(() => validateConfig(config)).toThrow();
    expect(isValidConfig(config)).toBe(false);
  });

  it('should reject issue count > 10000', () => {
    const config = {
      version: '1.0',
      projects: [
        {
          projectKey: 'TEST',
          issueCount: 10001,
        },
      ],
    };

    expect(() => validateConfig(config)).toThrow();
    expect(isValidConfig(config)).toBe(false);
  });

  it('should return error messages for invalid config', () => {
    const config = {
      version: '1.0',
      projects: [
        {
          projectKey: 'TEST',
          issueCount: 0,
        },
      ],
    };

    const errors = getConfigErrors(config);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes('issueCount'))).toBe(true);
  });
});
