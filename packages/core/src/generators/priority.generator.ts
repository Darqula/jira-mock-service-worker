import type { Priority } from '../types/jira-schemas.js';
import type { GenerationContext } from '../types/generator.types.js';
import { generateSelfUrls } from '../utils/response-builder.js';
import { getBuiltInDefaults } from '../config/defaults.js';

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
    const projectConfig = context.currentProject || getBuiltInDefaults();
    const configPriorities = projectConfig.data?.priorities || [];
    const urls = generateSelfUrls();

    // Filter priorities based on config, or use all if none specified
    let prioritiesToGenerate = PRIORITIES;
    if (configPriorities.length > 0) {
      prioritiesToGenerate = PRIORITIES.filter((p) =>
        configPriorities.some(
          (configName) => configName.toLowerCase() === p.name.toLowerCase()
        )
      );

      // If no matches found, fall back to all priorities
      if (prioritiesToGenerate.length === 0) {
        console.warn(
          `No matching priorities found for config: ${configPriorities.join(', ')}. Using all priorities.`
        );
        prioritiesToGenerate = PRIORITIES;
      }
    }

    return prioritiesToGenerate.map((priority) => {
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
