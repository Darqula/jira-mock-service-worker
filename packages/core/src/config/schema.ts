import { z } from 'zod';

/**
 * Project type schema
 */
export const ProjectTypeSchema = z.enum(['company-managed', 'team-managed']);

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
 * Project-specific configuration schema
 */
export const ProjectConfigSchema = z.object({
  seed: z.number().int().optional(),
  statusDistribution: StatusDistributionSchema,
  issueTypes: IssueTypesConfigSchema,
  sprints: SprintsConfigSchema,
  versions: VersionsConfigSchema,
  worklogs: WorklogsConfigSchema,
  data: DataConfigSchema,
  startIssueNumber: z.number().int().min(1).max(999999).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}).optional();

/**
 * Project configuration with key schema
 * Issue count is calculated automatically from issue types configuration
 */
export const ProjectConfigWithKeySchema = z.object({
  projectKey: z
    .string()
    .min(1, 'Project key is required')
    .max(10, 'Project key must be 10 characters or less')
    .regex(
      /^[A-Z][A-Z0-9]*$/,
      'Project key must start with a letter and contain only uppercase letters and numbers'
    ),
  projectName: z.string().optional(),
  projectType: ProjectTypeSchema.optional(),
  seed: z.number().int().optional(),
  statusDistribution: StatusDistributionSchema,
  issueTypes: IssueTypesConfigSchema,
  sprints: SprintsConfigSchema,
  versions: VersionsConfigSchema,
  worklogs: WorklogsConfigSchema,
  data: DataConfigSchema,
  startIssueNumber: z.number().int().min(1).max(999999).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}).refine(
  (project) => {
    // Validate date range if both dates are provided
    if (project.startDate && project.endDate) {
      const startDate = new Date(project.startDate);
      const endDate = new Date(project.endDate);
      return startDate < endDate;
    }
    return true;
  },
  {
    message: 'startDate must be before endDate',
    path: ['startDate'],
  }
).refine(
  (project) => {
    // Validate worklog hours range
    if (project.worklogs?.hoursMin !== undefined && project.worklogs?.hoursMax !== undefined) {
      return project.worklogs.hoursMin <= project.worklogs.hoursMax;
    }
    return true;
  },
  {
    message: 'hoursMin must be less than or equal to hoursMax',
    path: ['worklogs', 'hoursMin'],
  }
).refine(
  (project) => {
    // Validate worklog count range
    if (project.worklogs?.countMin !== undefined && project.worklogs?.countMax !== undefined) {
      return project.worklogs.countMin <= project.worklogs.countMax;
    }
    return true;
  },
  {
    message: 'countMin must be less than or equal to countMax',
    path: ['worklogs', 'countMin'],
  }
);

/**
 * Main Jira Mock configuration schema with per-project configuration
 * All configuration must be specified at the project level.
 */
export const JiraMockConfigSchema = z.object({
  version: z.literal('1.0'),
  projects: z
    .array(ProjectConfigWithKeySchema)
    .min(1, 'At least one project is required')
    .refine(
      (projects) => {
        const keys = projects.map((p) => p.projectKey);
        return keys.length === new Set(keys).size;
      },
      { message: 'Project keys must be unique' }
    ),
});

export type JiraMockConfigInput = z.input<typeof JiraMockConfigSchema>;
export type JiraMockConfigOutput = z.output<typeof JiraMockConfigSchema>;
