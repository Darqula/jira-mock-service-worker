import type { Project, User, AvatarUrls } from '../types/jira-schemas.js';
import type { GenerationContext } from '../types/generator.types.js';
import type { ProjectConfigWithKey } from '../config/types.js';
import { generateSelfUrls } from '../utils/response-builder.js';

export class ProjectGenerator {
  /**
   * Generate a project from configuration
   * @param projectConfig - Project-specific configuration with key
   * @param users - Available users for project lead
   * @param context - Generation context
   * @returns Generated project
   */
  generateProject(
    projectConfig: ProjectConfigWithKey,
    users: User[],
    context: GenerationContext
  ): Project {
    const id = context.idGenerator.next('project');
    const key = projectConfig.projectKey;
    const name = projectConfig.projectName || this.generateProjectName(context);
    const lead = users[context.faker.number.int({ min: 0, max: users.length - 1 })];

    // Determine project type based on config
    const projectType = context.faker.helpers.arrayElement([
      'software',
      'software',
      'software',
      'business',
    ] as const);

    // Map config project type to Jira simplified and style
    const isTeamManaged = projectConfig.projectType === 'team-managed';
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
