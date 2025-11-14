import type { User, AvatarUrls } from '../types/jira-schemas.js';
import type { GenerationContext } from '../types/generator.types.js';
import { generateSelfUrls } from '../utils/response-builder.js';

export class UserGenerator {
  generateUsers(count: number, context: GenerationContext): User[] {
    const users: User[] = [];
    for (let i = 0; i < count; i++) {
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
      locale: 'en_US',
    };
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

  getRandomUser(users: User[], context: GenerationContext): User {
    const index = context.faker.number.int({ min: 0, max: users.length - 1 });
    return users[index];
  }

  getRandomUserOrUndefined(
    users: User[],
    context: GenerationContext,
    probability: number = 0.7
  ): User | undefined {
    if (context.faker.number.float() < probability) {
      return this.getRandomUser(users, context);
    }
    return undefined;
  }
}
