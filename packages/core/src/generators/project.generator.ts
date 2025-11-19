import type { Project, User, AvatarUrls } from '../types/jira-schemas.js';
import type { GenerationContext } from '../types/generator.types.js';
import { generateSelfUrls } from '../utils/response-builder.js';
import { mergeWithDefaults } from '../config/defaults.js';

export class ProjectGenerator {
  generateProjects(count: number, users: User[], context: GenerationContext): Project[] {
    const projects: Project[] = [];
    for (let i = 0; i < count; i++) {
      projects.push(this.generateProject(i, users, context));
    }
    return projects;
  }

  generateProject(index: number, users: User[], context: GenerationContext): Project {
    const mergedConfig = mergeWithDefaults(context.config);
    const generalConfig = mergedConfig.general!;

    const id = context.idGenerator.next('project');
    // Use custom project key if configured, otherwise use default
    const key = generalConfig.projectKey || context.idGenerator.projectKey(index);
    const name = this.generateProjectName(context);
    const lead = users[context.faker.number.int({ min: 0, max: users.length - 1 })];

    // Determine project type based on config
    const projectType = context.faker.helpers.arrayElement([
      'software',
      'software',
      'software',
      'business',
    ] as const);

    // Map config project type to Jira simplified and style
    const isTeamManaged = generalConfig.projectType === 'team-managed';
    const urls = generateSelfUrls();

    return {
      self: urls.project(key),
      id,
      key,
      name,
      description: context.faker.lorem.sentence(),
      lead,
      projectTypeKey: projectType,
      simplified: isTeamManaged,
      style: isTeamManaged ? 'next-gen' : 'classic',
      avatarUrls: this.generateAvatarUrls(),
    };
  }

  private generateProjectName(context: GenerationContext): string {
    const prefixes = [
      'Project',
      'Product',
      'Platform',
      'Service',
      'Application',
      'System',
      'Infrastructure',
      'Development',
    ];
    const suffixes = [
      'Management',
      'Development',
      'Operations',
      'Portal',
      'Hub',
      'Suite',
      'Platform',
      'Core',
    ];

    const prefix = context.faker.helpers.arrayElement(prefixes);
    const suffix = context.faker.helpers.arrayElement(suffixes);

    return `${prefix} ${suffix}`;
  }

  private generateAvatarUrls(): AvatarUrls {
    const urls = generateSelfUrls();
    return {
      '48x48': urls.avatar('large'),
      '24x24': urls.avatar('medium'),
      '16x16': urls.avatar('small'),
      '32x32': urls.avatar('xsmall'),
    };
  }
}
