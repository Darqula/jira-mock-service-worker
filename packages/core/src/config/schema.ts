import { z } from 'zod';

/**
 * Project type schema
 */
export const ProjectTypeSchema = z.enum(['company-managed', 'team-managed']);

/**
 * General configuration schema
 */
export const GeneralConfigSchema = z.object({
  projectKey: z.string().min(1).max(10).optional(),
  projectType: ProjectTypeSchema.optional(),
  startIssueNumber: z.number().int().min(1).max(999999).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  chunkSize: z.number().int().min(0).max(10000).optional(),
}).optional();

/**
 * Status distribution schema
 */
export const StatusDistributionSchema = z.object({
  toDo: z.number().min(0).max(1).optional(),
  inProgress: z.number().min(0).max(1).optional(),
  done: z.number().min(0).max(1).optional(),
}).optional();

/**
 * Child distribution schema
 */
export const ChildDistributionSchema = z.object({
  story: z.number().min(0).max(1).optional(),
  task: z.number().min(0).max(1).optional(),
  bug: z.number().min(0).max(1).optional(),
}).optional();

/**
 * Epic configuration schema
 */
export const EpicConfigSchema = z.object({
  count: z.number().int().min(0).max(1000).optional(),
  childrenPerEpic: z.number().int().min(0).max(10000).optional(),
  assignProbability: z.number().min(0).max(1).optional(),
  labelProbability: z.number().min(0).max(1).optional(),
  childDistribution: ChildDistributionSchema,
}).optional();

/**
 * Issue type configuration schema (for Story, Task, Bug)
 */
export const IssueTypeConfigSchema = z.object({
  standaloneCount: z.number().int().min(0).max(10000).optional(),
  assignProbability: z.number().min(0).max(1).optional(),
  labelProbability: z.number().min(0).max(1).optional(),
}).optional();

/**
 * Issue types configuration schema
 */
export const IssueTypesConfigSchema = z.object({
  epic: EpicConfigSchema,
  story: IssueTypeConfigSchema,
  task: IssueTypeConfigSchema,
  bug: IssueTypeConfigSchema,
}).optional();

/**
 * Sprint configuration schema
 */
export const SprintsConfigSchema = z.object({
  startNumber: z.number().int().min(1).max(999).optional(),
  duration: z.number().int().min(1).max(30).optional(),
  assignProbability: z.number().min(0).max(1).optional(),
}).optional();

/**
 * Version configuration schema
 */
export const VersionsConfigSchema = z.object({
  startNumber: z.number().int().min(1).max(999).optional(),
  count: z.number().int().min(0).max(20).optional(),
  assignProbability: z.number().min(0).max(1).optional(),
}).optional();

/**
 * Worklog configuration schema
 */
export const WorklogsConfigSchema = z.object({
  probability: z.number().min(0).max(1).optional(),
  hoursMin: z.number().min(0.5).max(24).optional(),
  hoursMax: z.number().min(0.5).max(24).optional(),
  countMin: z.number().int().min(0).max(100).optional(),
  countMax: z.number().int().min(0).max(100).optional(),
}).optional();

/**
 * Data configuration schema
 */
export const DataConfigSchema = z.object({
  assignees: z.array(z.string().email()).optional(),
  priorities: z.array(z.string()).optional(),
  labels: z.array(z.string()).optional(),
}).optional();

/**
 * Main Jira Mock configuration schema
 */
export const JiraMockConfigSchema = z.object({
  version: z.literal('1.0'),
  seed: z.number().int().optional(),
  general: GeneralConfigSchema,
  statusDistribution: StatusDistributionSchema,
  issueTypes: IssueTypesConfigSchema,
  sprints: SprintsConfigSchema,
  versions: VersionsConfigSchema,
  worklogs: WorklogsConfigSchema,
  data: DataConfigSchema,
  projects: z.object({
    count: z.number().int().min(1).max(100),
    issuesPerProject: z.number().int().min(1).max(10000),
  }),
}).refine(
  (config) => {
    // Validate date range if both dates are provided
    if (config.general?.startDate && config.general?.endDate) {
      const startDate = new Date(config.general.startDate);
      const endDate = new Date(config.general.endDate);
      return startDate < endDate;
    }
    return true;
  },
  {
    message: 'startDate must be before endDate',
    path: ['general', 'startDate'],
  }
).refine(
  (config) => {
    // Validate worklog hours range
    if (config.worklogs?.hoursMin !== undefined && config.worklogs?.hoursMax !== undefined) {
      return config.worklogs.hoursMin <= config.worklogs.hoursMax;
    }
    return true;
  },
  {
    message: 'hoursMin must be less than or equal to hoursMax',
    path: ['worklogs', 'hoursMin'],
  }
).refine(
  (config) => {
    // Validate worklog count range
    if (config.worklogs?.countMin !== undefined && config.worklogs?.countMax !== undefined) {
      return config.worklogs.countMin <= config.worklogs.countMax;
    }
    return true;
  },
  {
    message: 'countMin must be less than or equal to countMax',
    path: ['worklogs', 'countMin'],
  }
);

export type JiraMockConfigInput = z.input<typeof JiraMockConfigSchema>;
export type JiraMockConfigOutput = z.output<typeof JiraMockConfigSchema>;
