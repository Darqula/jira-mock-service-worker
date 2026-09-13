import type { User, AvatarUrls } from '../types/jira-schemas.js';
import type { GenerationContext } from '../types/generator.types.js';
import { generateSelfUrls } from '../utils/response-builder.js';
import { getBuiltInDefaults } from '../config/defaults.js';

export class UserGenerator {
  generateUsers(count: number, context: GenerationContext): User[] {
    const projectConfig = context.currentProject || getBuiltInDefaults();
    const customAssignees = projectConfig.data?.assignees || [];
    const users: User[] = [];

    // Generate custom assignee users first
    for (const email of customAssignees) {
      users.push(this.generateUserFromEmail(email, context));
    }

    // Generate random users to fill remaining count
    const remainingCount = Math.max(0, count - customAssignees.length);
    for (let i = 0; i < remainingCount; i++) {
      users.push(this.generateUser(context));
    }

    return users;
  }

  generateUser(context: GenerationContext): User {
    const accountId = context.idGenerator.accountId();
    const firstName = context.faker.person.firstName();
    const lastName = context.faker.person.lastName();
    const displayName = `${firstName} ${lastName}`;
    const emailAddress = context.faker.internet.email({
      firstName,
      lastName,
    });
    const urls = generateSelfUrls();

    return {
      self: urls.user(accountId),
      accountId,
      accountType: 'atlassian',
      emailAddress,
      avatarUrls: this.generateAvatarUrls(),
      displayName,
      active: true,
      timeZone: context.faker.location.timeZone(),
    };
  }

  /**
   * Generates a user from a custom email address
   */
  generateUserFromEmail(email: string, context: GenerationContext): User {
    const accountId = context.idGenerator.accountId();

    // Extract name from email (before @)
    const localPart = email.split('@')[0];
    const nameParts = localPart.split(/[._-]/);

    const firstName = nameParts[0] || 'User';
    const lastName = nameParts[1] || '';
    const displayName = lastName
      ? `${this.capitalize(firstName)} ${this.capitalize(lastName)}`
      : this.capitalize(firstName);

    const urls = generateSelfUrls();

    return {
      self: urls.user(accountId),
      accountId,
      accountType: 'atlassian',
      emailAddress: email,
      avatarUrls: this.generateAvatarUrls(),
      displayName,
      active: true,
      timeZone: context.faker.location.timeZone(),
    };
  }

  /**
   * Capitalizes the first letter of a string
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
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
