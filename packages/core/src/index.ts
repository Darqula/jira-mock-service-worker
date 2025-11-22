import { DataStore } from './store/data-store.js';
import { QueryEngine } from './store/query-engine.js';
import { validateConfig } from './config/validator.js';
import type { GenerationContext, IssueContext } from './types/generator.types.js';
import type { JiraMockConfig } from './config/types.js';
import { createFaker } from './generators/base/faker-config.js';
import { IdGenerator } from './generators/base/id-generator.js';
import { DateGenerator } from './generators/base/date-generator.js';
import {
  StatusGenerator,
  PriorityGenerator,
  IssueTypeGenerator,
  UserGenerator,
  ProjectGenerator,
  ComponentGenerator,
  VersionGenerator,
  FieldGenerator,
  IssueGenerator,
  WorklogGenerator,
  CommentGenerator,
  AttachmentGenerator,
  IssueLinkGenerator,
  IssueLinkTypeGenerator,
  SprintGenerator,
} from './generators/index.js';
import { mergeProjectWithDefaults } from './config/defaults.js';

export interface GenerateMockDataResult {
  dataStore: DataStore;
  queryEngine: QueryEngine;
}

/**
 * Aggregates all assignee emails from all projects
 */
function aggregateAssignees(config: JiraMockConfig): string[] {
  const allAssignees = new Set<string>();

  // Add assignees from global defaults
  if (config.globalDefaults?.data?.assignees) {
    config.globalDefaults.data.assignees.forEach((email) => allAssignees.add(email));
  }

  // Add assignees from each project
  config.projects.forEach((project) => {
    if (project.data?.assignees) {
      project.data.assignees.forEach((email) => allAssignees.add(email));
    }
  });

  return Array.from(allAssignees);
}

export function generateMockData(config: unknown): GenerateMockDataResult {
  // Validate configuration
  const validConfig = validateConfig(config);

  // Initialize data store
  const dataStore = new DataStore();
  const queryEngine = new QueryEngine(dataStore);

  // Setup generation context with global seed
  const globalSeed = validConfig.globalDefaults?.seed || Date.now();
  const faker = createFaker(globalSeed);
  const idGenerator = new IdGenerator();
  const dateGenerator = new DateGenerator(faker);

  const context: GenerationContext = {
    config: validConfig,
    faker,
    idGenerator,
    dateGenerator,
    seed: globalSeed,
  };

  // Initialize generators
  const statusGenerator = new StatusGenerator();
  const priorityGenerator = new PriorityGenerator();
  const issueTypeGenerator = new IssueTypeGenerator();
  const userGenerator = new UserGenerator();
  const projectGenerator = new ProjectGenerator();
  const componentGenerator = new ComponentGenerator();
  const versionGenerator = new VersionGenerator();
  const fieldGenerator = new FieldGenerator();
  const issueGenerator = new IssueGenerator();
  const worklogGenerator = new WorklogGenerator();
  const commentGenerator = new CommentGenerator();
  const attachmentGenerator = new AttachmentGenerator();
  const issueLinkGenerator = new IssueLinkGenerator();
  const issueLinkTypeGenerator = new IssueLinkTypeGenerator();
  const sprintGenerator = new SprintGenerator();

  // Generate global metadata (shared across all projects)
  const statusCategories = statusGenerator.generateStatusCategories(context);
  statusCategories.forEach((cat) => dataStore.addStatusCategory(cat));

  const statuses = statusGenerator.generateStatuses(context, statusCategories);
  statuses.forEach((status) => dataStore.addStatus(status));

  const priorities = priorityGenerator.generatePriorities(context);
  priorities.forEach((priority) => dataStore.addPriority(priority));

  const issueTypes = issueTypeGenerator.generateIssueTypes(context);
  issueTypes.forEach((type) => dataStore.addIssueType(type));

  const fields = fieldGenerator.generateFields(context);
  fields.forEach((field) => dataStore.addField(field));

  // Generate issue link types
  const issueLinkTypes = issueLinkTypeGenerator.generateIssueLinkTypes(context);
  issueLinkTypes.forEach((linkType) => dataStore.addIssueLinkType(linkType));

  // Aggregate user emails from all projects
  const customAssignees = aggregateAssignees(validConfig);
  const userCount = customAssignees.length > 0 ? customAssignees.length : faker.number.int({ min: 10, max: 20 });
  const users = userGenerator.generateUsers(userCount, context);
  users.forEach((user) => dataStore.addUser(user));

  // Set a current user (first user)
  if (users.length > 0) {
    dataStore.setCurrentUser(users[0]);
  }

  // Generate projects and their issues
  for (let projectIndex = 0; projectIndex < validConfig.projects.length; projectIndex++) {
    const projectConfig = validConfig.projects[projectIndex];

    // Merge project config with global defaults
    const mergedProjectConfig = mergeProjectWithDefaults(
      projectConfig,
      validConfig.globalDefaults
    );

    // Create project-specific context
    const projectSeed = mergedProjectConfig.seed || globalSeed;
    const projectFaker = createFaker(projectSeed);
    const projectContext: GenerationContext = {
      ...context,
      faker: projectFaker,
      seed: projectSeed,
      currentProject: mergedProjectConfig,
      projectIndex,
    };

    // Generate project
    const project = projectGenerator.generateProject(projectConfig, users, projectContext);
    dataStore.addProject(project);

    // Generate components for this project
    const components = componentGenerator.generateComponents(project, users, projectContext);
    components.forEach((component) => dataStore.addComponent(component));

    // Generate versions for this project
    const versions = versionGenerator.generateVersions(project, projectContext);
    versions.forEach((version) => dataStore.addVersion(version));

    // Generate sprints for this project based on configured date range
    const startDate = mergedProjectConfig.startDate
      ? new Date(mergedProjectConfig.startDate)
      : new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const endDate = mergedProjectConfig.endDate
      ? new Date(mergedProjectConfig.endDate)
      : new Date();

    const sprints = sprintGenerator.generateSprints(startDate, endDate, projectContext);

    // Generate issues for this project
    const issueContext: IssueContext = {
      ...projectContext,
      project,
      projectIndex,
      issueIndex: 0,
      users,
      issueTypes,
      priorities,
      statuses,
      sprints,
    };

    const issues = issueGenerator.generateIssues(
      project,
      projectConfig.issueCount,
      users,
      issueTypes,
      priorities,
      statuses,
      components,
      versions,
      issueContext
    );

    issues.forEach((issue) => {
      dataStore.addIssue(issue);

      // Generate worklogs for this issue
      const worklogs = worklogGenerator.generateWorklogs(issue, users, projectContext);
      worklogs.forEach((worklog) => dataStore.addWorklog(worklog));

      // Generate comments for this issue
      const comments = commentGenerator.generateComments(issue, users, projectContext);
      comments.forEach((comment) => dataStore.addComment(comment, issue.key));

      // Generate attachments for this issue
      const attachments = attachmentGenerator.generateAttachments(issue, users, projectContext);
      attachments.forEach((attachment) => dataStore.addAttachment(attachment, issue.key));
    });
  }

  // Generate issue links (after all issues are created)
  const allIssues = dataStore.getAllIssues();
  allIssues.forEach((issue) => {
    const links = issueLinkGenerator.generateIssueLinks(
      issue,
      allIssues,
      issueLinkTypes,
      context
    );
    links.forEach((link) => dataStore.addIssueLink(link));
  });

  return {
    dataStore,
    queryEngine,
  };
}

// Re-export types and utilities
export type {
  JiraMockConfig,
  ProjectType,
  ProjectConfig,
  ProjectConfigWithKey,
  StatusDistribution,
  ChildDistribution,
  EpicConfig,
  IssueTypeConfig,
  IssueTypesConfig,
  SprintsConfig,
  VersionsConfig,
  WorklogsConfig,
  DataConfig,
} from './config/types.js';

export {
  validateConfig,
  validateConfigWithWarnings,
  isValidConfig,
  getConfigErrors,
  getHumanReadableErrors,
  ConfigValidationError,
} from './config/validator.js';

export type { ConfigWarning, ValidationResult } from './config/validator.js';

export {
  DEFAULT_CONFIG,
  DEFAULT_PROJECT_CONFIG,
  DEFAULT_STATUS_DISTRIBUTION,
  DEFAULT_ISSUE_TYPES_CONFIG,
  DEFAULT_SPRINTS_CONFIG,
  DEFAULT_VERSIONS_CONFIG,
  DEFAULT_WORKLOGS_CONFIG,
  DEFAULT_DATA_CONFIG,
  getBuiltInDefaults,
  mergeProjectWithDefaults,
  mergeWithDefaults,
  getConfigValue,
} from './config/defaults.js';

export { DataStore } from './store/data-store.js';
export { QueryEngine } from './store/query-engine.js';
export type * from './types/jira-schemas.js';
export type * from './types/generator.types.js';

// Re-export generators
export { IdGenerator } from './generators/base/id-generator.js';
export { DateGenerator } from './generators/base/date-generator.js';
export * from './generators/index.js';
