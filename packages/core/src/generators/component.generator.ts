import type { Component, User, Project } from '../types/jira-schemas.js';
import type { GenerationContext } from '../types/generator.types.js';
import { generateSelfUrls } from '../utils/response-builder.js';

export class ComponentGenerator {
  generateComponents(project: Project, users: User[], context: GenerationContext): Component[] {
    const count = context.faker.number.int({ min: 2, max: 5 });
    const components: Component[] = [];

    for (let i = 0; i < count; i++) {
      components.push(this.generateComponent(project, users, context));
    }

    return components;
  }

  generateComponent(project: Project, users: User[], context: GenerationContext): Component {
    const id = context.idGenerator.next('component');
    const name = this.generateComponentName(context);
    const lead = users[context.faker.number.int({ min: 0, max: users.length - 1 })];
    const urls = generateSelfUrls();

    return {
      self: urls.component(id),
      id,
      name,
      description: context.faker.lorem.sentence(),
      lead,
      assigneeType: 'PROJECT_DEFAULT',
      project: project.key,
      projectId: parseInt(project.id),
    };
  }

  private generateComponentName(context: GenerationContext): string {
    const names = [
      'Frontend',
      'Backend',
      'API',
      'Database',
      'UI',
      'Authentication',
      'Payment',
      'Notifications',
      'Analytics',
      'Infrastructure',
      'Mobile',
      'Web',
      'Core',
      'Integration',
      'Testing',
    ];

    return context.faker.helpers.arrayElement(names);
  }
}
