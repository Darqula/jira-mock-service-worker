import { DataStore } from './store/data-store.js';
import { QueryEngine } from './store/query-engine.js';
import { validateConfig } from './config/validator.js';
import type { GenerationContext, IssueContext } from './types/generator.types.js';
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
} from './generators/index.js';

export interface GenerateMockDataResult {
  dataStore: DataStore;
  queryEngine: QueryEngine;
}

export function generateMockData(config: unknown): GenerateMockDataResult {
  // Validate configuration
  const validConfig = validateConfig(config);

  // Initialize data store
  const dataStore = new DataStore();
  const queryEngine = new QueryEngine(dataStore);

  // Setup generation context
  const seed = validConfig.seed || Date.now();
  const faker = createFaker(seed);
  const idGenerator = new IdGenerator();
  const dateGenerator = new DateGenerator(faker);

  const context: GenerationContext = {
    config: validConfig,
    faker,
    idGenerator,
    dateGenerator,
    seed,
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

  // Generate global metadata
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

  // Generate users (10-20 users for all projects)
  const userCount = faker.number.int({ min: 10, max: 20 });
  const users = userGenerator.generateUsers(userCount, context);
  users.forEach((user) => dataStore.addUser(user));

  // Set a current user (first user)
  if (users.length > 0) {
    dataStore.setCurrentUser(users[0]);
  }

  // Generate projects and their issues
  const projectCount = validConfig.projects.count;
  const issuesPerProject = validConfig.projects.issuesPerProject;

  for (let projectIndex = 0; projectIndex < projectCount; projectIndex++) {
    // Generate project
    const project = projectGenerator.generateProject(projectIndex, users, context);
    dataStore.addProject(project);

    // Generate components for this project
    const components = componentGenerator.generateComponents(project, users, context);
    components.forEach((component) => dataStore.addComponent(component));

    // Generate versions for this project
    const versions = versionGenerator.generateVersions(project, context);
    versions.forEach((version) => dataStore.addVersion(version));

    // Generate issues for this project
    const issueContext: IssueContext = {
      ...context,
      project,
      projectIndex,
      issueIndex: 0,
      users,
      issueTypes,
      priorities,
      statuses,
    };

    const issues = issueGenerator.generateIssues(
      project,
      issuesPerProject,
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
      const worklogs = worklogGenerator.generateWorklogs(issue, users, context);
      worklogs.forEach((worklog) => dataStore.addWorklog(worklog));
    });
  }

  return {
    dataStore,
    queryEngine,
  };
}

// Re-export types and utilities
export type { JiraMockConfig } from './config/types.js';
export { validateConfig, isValidConfig, getConfigErrors } from './config/validator.js';
export { DataStore } from './store/data-store.js';
export { QueryEngine } from './store/query-engine.js';
export type * from './types/jira-schemas.js';
export type * from './types/generator.types.js';
