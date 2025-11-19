import type { GenerationContext } from '../types/generator.types.js';
import { generateSelfUrls } from '../utils/response-builder.js';
import { mergeWithDefaults } from '../config/defaults.js';

export interface Sprint {
  id: string;
  self: string;
  state: 'future' | 'active' | 'closed';
  name: string;
  startDate?: string;
  endDate?: string;
  completeDate?: string;
  originBoardId: number;
  goal?: string;
}

export class SprintGenerator {
  /**
   * Generates sprints based on project timeline and config
   */
  generateSprints(
    startDate: Date,
    endDate: Date,
    context: GenerationContext
  ): Sprint[] {
    const mergedConfig = mergeWithDefaults(context.config);
    const sprintConfig = mergedConfig.sprints!;
    const startNumber = sprintConfig.startNumber!;
    const duration = sprintConfig.duration!;

    const sprints: Sprint[] = [];
    const urls = generateSelfUrls();

    // Calculate number of sprints based on date range and duration
    const daysBetween = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const numSprints = Math.ceil(daysBetween / duration);

    // Generate sprints
    for (let i = 0; i < numSprints; i++) {
      const sprintNumber = startNumber + i;
      const sprint = this.generateSprint(
        sprintNumber,
        i,
        startDate,
        duration,
        endDate,
        urls,
        context
      );
      sprints.push(sprint);
    }

    return sprints;
  }

  /**
   * Generates a single sprint
   */
  private generateSprint(
    sprintNumber: number,
    index: number,
    projectStartDate: Date,
    duration: number,
    projectEndDate: Date,
    urls: ReturnType<typeof generateSelfUrls>,
    context: GenerationContext
  ): Sprint {
    const id = context.idGenerator.next('sprint');
    const name = this.generateSprintName(sprintNumber, context);

    // Calculate sprint dates
    const sprintStart = new Date(projectStartDate);
    sprintStart.setDate(sprintStart.getDate() + index * duration);

    const sprintEnd = new Date(sprintStart);
    sprintEnd.setDate(sprintEnd.getDate() + duration - 1);

    // Determine sprint state based on dates
    const now = new Date();
    let state: 'future' | 'active' | 'closed';
    let startDate: string | undefined;
    let endDate: string | undefined;
    let completeDate: string | undefined;

    if (sprintEnd < now && sprintEnd <= projectEndDate) {
      // Sprint is in the past - closed
      state = 'closed';
      startDate = sprintStart.toISOString();
      endDate = sprintEnd.toISOString();
      completeDate = sprintEnd.toISOString();
    } else if (sprintStart <= now && sprintEnd >= now) {
      // Sprint is ongoing - active
      state = 'active';
      startDate = sprintStart.toISOString();
      endDate = sprintEnd.toISOString();
    } else {
      // Sprint is in the future
      state = 'future';
      startDate = sprintStart.toISOString();
      endDate = sprintEnd.toISOString();
    }

    // Generate optional goal
    const goal = context.faker.datatype.boolean({ probability: 0.7 })
      ? this.generateSprintGoal(context)
      : undefined;

    return {
      id,
      self: urls.sprint(id),
      state,
      name,
      startDate,
      endDate,
      completeDate,
      originBoardId: context.faker.number.int({ min: 1, max: 10 }),
      goal,
    };
  }

  /**
   * Generates a sprint name
   */
  private generateSprintName(sprintNumber: number, context: GenerationContext): string {
    // Different naming conventions
    const formats = [
      `Sprint ${sprintNumber}`,
      `Sprint #${sprintNumber}`,
      `S${sprintNumber}`,
      `Sprint ${sprintNumber} - ${context.faker.company.buzzPhrase()}`,
    ];

    return context.faker.helpers.arrayElement(formats);
  }

  /**
   * Generates a sprint goal
   */
  private generateSprintGoal(context: GenerationContext): string {
    const templates = [
      'Complete {feature} implementation',
      'Improve {feature} performance',
      'Fix critical {feature} bugs',
      'Launch {feature} to production',
      'Enhance {feature} user experience',
      'Refactor {feature} codebase',
      'Deliver {feature} MVP',
      'Stabilize {feature} release',
    ];

    const features = [
      'authentication',
      'dashboard',
      'reporting',
      'API',
      'mobile app',
      'search',
      'notifications',
      'user management',
    ];

    const template = context.faker.helpers.arrayElement(templates);
    const feature = context.faker.helpers.arrayElement(features);

    return template.replace('{feature}', feature);
  }

  /**
   * Gets a random sprint from a list based on assignment probability
   */
  getRandomSprint(
    sprints: Sprint[],
    context: GenerationContext,
    probability: number
  ): Sprint | undefined {
    if (sprints.length === 0) {
      return undefined;
    }

    // Check if we should assign a sprint
    if (context.faker.number.float() > probability) {
      return undefined;
    }

    // Only assign to active or closed sprints (not future)
    const validSprints = sprints.filter(
      (s) => s.state === 'active' || s.state === 'closed'
    );

    if (validSprints.length === 0) {
      return undefined;
    }

    return context.faker.helpers.arrayElement(validSprints);
  }
}
