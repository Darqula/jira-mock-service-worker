import { describe, it, expect } from 'vitest';
import { validateConfig, isValidConfig, getConfigErrors } from '../src/config/validator.js';
import type { JiraMockConfig } from '../src/config/types.js';

describe('Config Validation', () => {
  it('should validate a valid config', () => {
    const config: JiraMockConfig = {
      version: '1.0',
      projects: {
        count: 5,
        issuesPerProject: 100,
      },
    };

    expect(() => validateConfig(config)).not.toThrow();
    expect(isValidConfig(config)).toBe(true);
  });

  it('should validate config with seed', () => {
    const config: JiraMockConfig = {
      version: '1.0',
      seed: 12345,
      projects: {
        count: 3,
        issuesPerProject: 50,
      },
    };

    expect(() => validateConfig(config)).not.toThrow();
    expect(isValidConfig(config)).toBe(true);
  });

  it('should reject invalid version', () => {
    const config = {
      version: '2.0',
      projects: {
        count: 5,
        issuesPerProject: 100,
      },
    };

    expect(() => validateConfig(config)).toThrow();
    expect(isValidConfig(config)).toBe(false);
  });

  it('should reject project count < 1', () => {
    const config = {
      version: '1.0',
      projects: {
        count: 0,
        issuesPerProject: 100,
      },
    };

    expect(() => validateConfig(config)).toThrow();
    expect(isValidConfig(config)).toBe(false);
  });

  it('should reject project count > 100', () => {
    const config = {
      version: '1.0',
      projects: {
        count: 101,
        issuesPerProject: 100,
      },
    };

    expect(() => validateConfig(config)).toThrow();
    expect(isValidConfig(config)).toBe(false);
  });

  it('should reject issues per project < 1', () => {
    const config = {
      version: '1.0',
      projects: {
        count: 5,
        issuesPerProject: 0,
      },
    };

    expect(() => validateConfig(config)).toThrow();
    expect(isValidConfig(config)).toBe(false);
  });

  it('should reject issues per project > 10000', () => {
    const config = {
      version: '1.0',
      projects: {
        count: 5,
        issuesPerProject: 10001,
      },
    };

    expect(() => validateConfig(config)).toThrow();
    expect(isValidConfig(config)).toBe(false);
  });

  it('should return error messages for invalid config', () => {
    const config = {
      version: '1.0',
      projects: {
        count: 0,
        issuesPerProject: 0,
      },
    };

    const errors = getConfigErrors(config);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes('count'))).toBe(true);
    expect(errors.some((e) => e.includes('issuesPerProject'))).toBe(true);
  });
});
