import type { Faker } from '@faker-js/faker';

/**
 * Epic summary templates
 */
export const EPIC_TEMPLATES = [
  'Improve {feature} performance',
  'Redesign {feature} experience',
  'Build {feature} framework',
  'Implement {feature} integration',
  'Migrate {feature} to new platform',
  'Enhance {feature} capabilities',
  'Refactor {feature} architecture',
  'Develop {feature} API',
  'Optimize {feature} workflow',
  '{feature} modernization initiative',
  '{feature} scalability improvements',
  '{feature} user experience overhaul',
  'Launch {feature} v2.0',
  '{feature} infrastructure upgrade',
  'Automate {feature} processes',
];

/**
 * Story summary templates
 */
export const STORY_TEMPLATES = [
  'As a user, I want to {action}',
  'Add {feature} to dashboard',
  'Implement {feature} functionality',
  'Create {feature} page',
  'Display {feature} information',
  'Enable {feature} for users',
  'Support {feature} in {area}',
  'Update {feature} UI',
  'Integrate {feature} with {area}',
  'Build {feature} component',
  'Develop {feature} interface',
  'Design {feature} layout',
  'Add {feature} filters',
  'Implement {feature} search',
  'Create {feature} settings',
];

/**
 * Task summary templates
 */
export const TASK_TEMPLATES = [
  'Update {feature} documentation',
  'Configure {feature} settings',
  'Set up {feature} environment',
  'Create {feature} test data',
  'Review {feature} implementation',
  'Deploy {feature} to {environment}',
  'Update {feature} dependencies',
  'Optimize {feature} queries',
  'Refactor {feature} code',
  'Add {feature} logging',
  'Implement {feature} caching',
  'Update {feature} configuration',
  'Create {feature} migration',
  'Set up {feature} monitoring',
  'Write {feature} tests',
];

/**
 * Bug summary templates
 */
export const BUG_TEMPLATES = [
  '{feature} not working correctly',
  'Fix {feature} error on {area}',
  '{feature} throws exception',
  'Resolve {feature} performance issue',
  '{feature} displays incorrect data',
  'Fix {feature} validation bug',
  '{feature} not responding',
  'Correct {feature} behavior',
  'Fix {feature} crash',
  '{feature} calculation error',
  'Resolve {feature} rendering issue',
  'Fix {feature} timing problem',
  '{feature} memory leak',
  '{feature} security vulnerability',
  'Fix {feature} race condition',
];

/**
 * Feature placeholders for templates
 */
export const FEATURES = [
  'authentication',
  'authorization',
  'dashboard',
  'reporting',
  'analytics',
  'notifications',
  'search',
  'filters',
  'export',
  'import',
  'user management',
  'project management',
  'issue tracking',
  'workflow',
  'comments',
  'attachments',
  'labels',
  'custom fields',
  'permissions',
  'API',
  'integration',
  'webhook',
  'email',
  'mobile',
  'calendar',
  'charts',
  'timeline',
  'board',
  'backlog',
  'sprint',
];

/**
 * Action placeholders for templates
 */
export const ACTIONS = [
  'view details',
  'edit information',
  'delete items',
  'create new entries',
  'filter results',
  'search quickly',
  'export data',
  'import data',
  'receive notifications',
  'customize settings',
  'share with team',
  'collaborate effectively',
  'track progress',
  'generate reports',
  'manage permissions',
];

/**
 * Area placeholders for templates
 */
export const AREAS = [
  'dashboard',
  'settings page',
  'admin panel',
  'mobile app',
  'API',
  'backend',
  'frontend',
  'database',
  'user interface',
  'homepage',
  'profile page',
  'reports section',
  'analytics view',
  'project view',
  'issue view',
];

/**
 * Environment placeholders for templates
 */
export const ENVIRONMENTS = [
  'staging',
  'production',
  'development',
  'testing',
  'QA',
  'UAT',
  'demo',
];

/**
 * Generates a random epic summary
 *
 * @param faker - Faker instance for random selection
 * @returns Epic summary string
 */
export function generateEpicSummary(faker: Faker): string {
  const template = faker.helpers.arrayElement(EPIC_TEMPLATES);
  const feature = faker.helpers.arrayElement(FEATURES);

  return template.replace('{feature}', feature);
}

/**
 * Generates a random story summary
 *
 * @param faker - Faker instance for random selection
 * @returns Story summary string
 */
export function generateStorySummary(faker: Faker): string {
  const template = faker.helpers.arrayElement(STORY_TEMPLATES);
  const feature = faker.helpers.arrayElement(FEATURES);
  const action = faker.helpers.arrayElement(ACTIONS);
  const area = faker.helpers.arrayElement(AREAS);

  return template.replace('{feature}', feature).replace('{action}', action).replace('{area}', area);
}

/**
 * Generates a random task summary
 *
 * @param faker - Faker instance for random selection
 * @returns Task summary string
 */
export function generateTaskSummary(faker: Faker): string {
  const template = faker.helpers.arrayElement(TASK_TEMPLATES);
  const feature = faker.helpers.arrayElement(FEATURES);
  const environment = faker.helpers.arrayElement(ENVIRONMENTS);

  return template.replace('{feature}', feature).replace('{environment}', environment);
}

/**
 * Generates a random bug summary
 *
 * @param faker - Faker instance for random selection
 * @returns Bug summary string
 */
export function generateBugSummary(faker: Faker): string {
  const template = faker.helpers.arrayElement(BUG_TEMPLATES);
  const feature = faker.helpers.arrayElement(FEATURES);
  const area = faker.helpers.arrayElement(AREAS);

  return template.replace('{feature}', feature).replace('{area}', area);
}

/**
 * Generates a summary based on issue type
 *
 * @param faker - Faker instance for random selection
 * @param issueType - Type of issue (Epic, Story, Task, Bug)
 * @returns Issue summary string
 */
export function generateIssueSummary(faker: Faker, issueType: string): string {
  const normalizedType = issueType.toLowerCase();

  switch (normalizedType) {
    case 'epic':
      return generateEpicSummary(faker);
    case 'story':
      return generateStorySummary(faker);
    case 'task':
      return generateTaskSummary(faker);
    case 'bug':
      return generateBugSummary(faker);
    default:
      return generateStorySummary(faker);
  }
}

/**
 * Generates a random description for an issue
 *
 * @param faker - Faker instance for random text generation
 * @param issueType - Type of issue (Epic, Story, Task, Bug)
 * @returns Issue description string
 */
export function generateIssueDescription(faker: Faker, issueType: string): string {
  const normalizedType = issueType.toLowerCase();

  const paragraphs = faker.number.int({ min: 2, max: 4 });
  const description = faker.lorem.paragraphs(paragraphs);

  // Add issue-type specific formatting
  switch (normalizedType) {
    case 'story':
      return `### User Story\n\n${description}\n\n### Acceptance Criteria\n\n- [ ] ${faker.lorem.sentence()}\n- [ ] ${faker.lorem.sentence()}\n- [ ] ${faker.lorem.sentence()}`;

    case 'bug':
      return `### Description\n\n${description}\n\n### Steps to Reproduce\n\n1. ${faker.lorem.sentence()}\n2. ${faker.lorem.sentence()}\n3. ${faker.lorem.sentence()}\n\n### Expected Behavior\n\n${faker.lorem.sentence()}\n\n### Actual Behavior\n\n${faker.lorem.sentence()}`;

    case 'epic':
      return `### Overview\n\n${description}\n\n### Goals\n\n- ${faker.lorem.sentence()}\n- ${faker.lorem.sentence()}\n- ${faker.lorem.sentence()}`;

    case 'task':
    default:
      return description;
  }
}
