import type { Priority } from '../types/jira-schemas.js';
import type { GenerationContext } from '../types/generator.types.js';
import { generateSelfUrls } from '../utils/response-builder.js';

const PRIORITIES: Omit<Priority, 'self' | 'id'>[] = [
  {
    name: 'Highest',
    iconUrl: 'https://your-domain.atlassian.net/images/icons/priorities/highest.svg',
  },
  {
    name: 'High',
    iconUrl: 'https://your-domain.atlassian.net/images/icons/priorities/high.svg',
  },
  {
    name: 'Medium',
    iconUrl: 'https://your-domain.atlassian.net/images/icons/priorities/medium.svg',
  },
  {
    name: 'Low',
    iconUrl: 'https://your-domain.atlassian.net/images/icons/priorities/low.svg',
  },
  {
    name: 'Lowest',
    iconUrl: 'https://your-domain.atlassian.net/images/icons/priorities/lowest.svg',
  },
];

export class PriorityGenerator {
  generatePriorities(context: GenerationContext): Priority[] {
    const urls = generateSelfUrls();

    return PRIORITIES.map((priority) => {
      const id = context.idGenerator.next('priority');
      return {
        self: urls.priority(id),
        id,
        name: priority.name,
        iconUrl: priority.iconUrl,
      };
    });
  }

  getRandomPriority(priorities: Priority[], context: GenerationContext): Priority {
    return priorities[context.faker.number.int({ min: 0, max: priorities.length - 1 })];
  }
}
