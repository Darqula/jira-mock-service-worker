import type { UserProperty, User } from '../types/jira-schemas.js';
import type { GenerationContext } from '../types/generator.types.js';

export class UserPropertyGenerator {
  private static readonly COMMON_PROPERTIES = [
    { key: 'jira.user.locale', getValue: () => 'en_US' },
    { key: 'jira.user.timezone', getValue: () => 'America/New_York' },
    { key: 'jira.user.theme', getValue: () => 'light' },
    { key: 'jira.user.notifications.mimetype', getValue: () => 'html' },
    { key: 'user.notifications.enabled', getValue: () => true },
    { key: 'user.default.share.private', getValue: () => true },
    { key: 'jira.user.keyboard.shortcuts.enabled', getValue: () => true },
    { key: 'user.autowatch.disabled', getValue: () => false },
  ];

  generateUserProperties(
    _user: User,
    context: GenerationContext
  ): UserProperty[] {
    const properties: UserProperty[] = [];

    // Generate 3-6 random properties from common ones
    const count = context.faker.number.int({ min: 3, max: 6 });
    const selectedIndices = new Set<number>();

    while (selectedIndices.size < count && selectedIndices.size < UserPropertyGenerator.COMMON_PROPERTIES.length) {
      const index = context.faker.number.int({
        min: 0,
        max: UserPropertyGenerator.COMMON_PROPERTIES.length - 1
      });
      selectedIndices.add(index);
    }

    Array.from(selectedIndices).forEach(index => {
      const prop = UserPropertyGenerator.COMMON_PROPERTIES[index];
      properties.push({
        key: prop.key,
        value: prop.getValue(),
      });
    });

    return properties;
  }

  generateUserProperty(key: string, context: GenerationContext): UserProperty {
    // Check if it's a known property
    const knownProp = UserPropertyGenerator.COMMON_PROPERTIES.find(p => p.key === key);

    if (knownProp) {
      return {
        key: knownProp.key,
        value: knownProp.getValue(),
      };
    }

    // Generate a random value for unknown properties
    return {
      key,
      value: context.faker.lorem.word(),
    };
  }
}
