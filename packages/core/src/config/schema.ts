import { z } from 'zod';

export const JiraMockConfigSchema = z.object({
  version: z.literal('1.0'),
  seed: z.number().int().optional(),
  projects: z.object({
    count: z.number().int().min(1).max(100),
    issuesPerProject: z.number().int().min(1).max(10000),
  }),
});

export type JiraMockConfigInput = z.input<typeof JiraMockConfigSchema>;
export type JiraMockConfigOutput = z.output<typeof JiraMockConfigSchema>;
