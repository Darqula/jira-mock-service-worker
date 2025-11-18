import type { ProjectProperty, Project } from '../types/jira-schemas.js';
import type { GenerationContext } from '../types/generator.types.js';

export class ProjectPropertyGenerator {
  generateProjectProperties(
    project: Project,
    context: GenerationContext
  ): ProjectProperty[] {
    const properties: ProjectProperty[] = [];

    // Add milestone properties (common pattern in Jira)
    const milestoneCount = context.faker.number.int({ min: 0, max: 3 });
    for (let i = 0; i < milestoneCount; i++) {
      properties.push({
        key: 'pwMilestone',
        value: {
          id: context.idGenerator.next('milestone'),
          name: `Milestone ${i + 1}`,
          dueDate: context.faker.date.future().toISOString().split('T')[0],
          description: context.faker.lorem.sentence(),
        },
      });
    }

    // Add other common project properties
    if (context.faker.datatype.boolean({ probability: 0.6 })) {
      properties.push({
        key: 'project.config.defaultAssignee',
        value: project.lead?.accountId || 'PROJECT_LEAD',
      });
    }

    if (context.faker.datatype.boolean({ probability: 0.5 })) {
      properties.push({
        key: 'project.config.issueSecurityScheme',
        value: context.idGenerator.next('securityScheme'),
      });
    }

    if (context.faker.datatype.boolean({ probability: 0.7 })) {
      properties.push({
        key: 'project.config.notificationScheme',
        value: context.idGenerator.next('notificationScheme'),
      });
    }

    if (context.faker.datatype.boolean({ probability: 0.4 })) {
      properties.push({
        key: 'project.insights.enabled',
        value: true,
      });
    }

    return properties;
  }

  generateProjectProperty(key: string, project: Project, context: GenerationContext): ProjectProperty {
    // Handle known property types
    if (key === 'pwMilestone') {
      return {
        key,
        value: {
          id: context.idGenerator.next('milestone'),
          name: context.faker.lorem.words(2),
          dueDate: context.faker.date.future().toISOString().split('T')[0],
          description: context.faker.lorem.sentence(),
        },
      };
    }

    if (key === 'project.config.defaultAssignee') {
      return {
        key,
        value: project.lead?.accountId || 'PROJECT_LEAD',
      };
    }

    // Generic property generation
    return {
      key,
      value: context.faker.lorem.word(),
    };
  }
}
