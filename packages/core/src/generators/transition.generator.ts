import type { Transition, Status, TransitionField } from '../types/jira-schemas.js';
import type { GenerationContext } from '../types/generator.types.js';

export class TransitionGenerator {
  /**
   * Generate available transitions for an issue based on its current status
   */
  generateTransitions(
    currentStatus: Status,
    allStatuses: Status[],
    context: GenerationContext
  ): Transition[] {
    const transitions: Transition[] = [];

    // Generate transitions to all other statuses
    for (const targetStatus of allStatuses) {
      if (targetStatus.id === currentStatus.id) {
        continue; // Skip transition to same status
      }

      transitions.push(this.createTransition(currentStatus, targetStatus, context));
    }

    return transitions;
  }

  private createTransition(
    fromStatus: Status,
    toStatus: Status,
    context: GenerationContext
  ): Transition {
    const id = context.idGenerator.next('transition');
    const transitionName = this.generateTransitionName(fromStatus, toStatus, context);

    // Determine if this transition requires additional fields
    const hasScreen = context.faker.datatype.boolean({ probability: 0.3 });
    const fields = hasScreen ? this.generateTransitionFields(context) : undefined;

    return {
      id,
      name: transitionName,
      to: toStatus,
      hasScreen,
      isGlobal: context.faker.datatype.boolean({ probability: 0.5 }),
      isInitial: fromStatus.statusCategory.key === 'new',
      isConditional: context.faker.datatype.boolean({ probability: 0.2 }),
      fields,
    };
  }

  private generateTransitionName(
    fromStatus: Status,
    toStatus: Status,
    context: GenerationContext
  ): string {
    const fromCategory = fromStatus.statusCategory.key;
    const toCategory = toStatus.statusCategory.key;

    // Common transition names based on status categories
    if (fromCategory === 'new' && toCategory === 'indeterminate') {
      return context.faker.helpers.arrayElement(['Start Progress', 'Begin Work', 'Start']);
    }
    if (fromCategory === 'indeterminate' && toCategory === 'done') {
      return context.faker.helpers.arrayElement(['Done', 'Complete', 'Resolve', 'Close']);
    }
    if (fromCategory === 'done' && toCategory === 'new') {
      return context.faker.helpers.arrayElement(['Reopen', 'Reactivate']);
    }
    if (fromCategory === 'done' && toCategory === 'indeterminate') {
      return context.faker.helpers.arrayElement(['Reopen', 'Resume Work']);
    }
    if (fromCategory === 'indeterminate' && toCategory === 'new') {
      return context.faker.helpers.arrayElement(['Stop Progress', 'To Do']);
    }

    // Default: use target status name
    return toStatus.name;
  }

  private generateTransitionFields(context: GenerationContext): Record<string, TransitionField> {
    const fields: Record<string, TransitionField> = {};

    // Randomly add some common transition fields
    if (context.faker.datatype.boolean({ probability: 0.5 })) {
      fields.resolution = {
        required: true,
        schema: { type: 'resolution', system: 'resolution' },
        name: 'Resolution',
        key: 'resolution',
        operations: ['set'],
      };
    }

    if (context.faker.datatype.boolean({ probability: 0.3 })) {
      fields.comment = {
        required: false,
        schema: { type: 'string', system: 'comment' },
        name: 'Comment',
        key: 'comment',
        operations: ['add'],
      };
    }

    if (context.faker.datatype.boolean({ probability: 0.2 })) {
      fields.assignee = {
        required: false,
        schema: { type: 'user', system: 'assignee' },
        name: 'Assignee',
        key: 'assignee',
        operations: ['set'],
      };
    }

    return fields;
  }
}
