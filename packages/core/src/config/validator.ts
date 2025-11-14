import { ZodError } from 'zod';
import { JiraMockConfigSchema } from './schema.js';
import type { JiraMockConfig } from './types.js';

export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public errors: ZodError
  ) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

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

export function isValidConfig(config: unknown): config is JiraMockConfig {
  return JiraMockConfigSchema.safeParse(config).success;
}

export function getConfigErrors(config: unknown): string[] {
  const result = JiraMockConfigSchema.safeParse(config);
  if (result.success) {
    return [];
  }
  return result.error.errors.map(
    (err) => `${err.path.join('.')}: ${err.message}`
  );
}
