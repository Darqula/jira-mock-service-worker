import { describe, it, expect, beforeEach } from 'vitest';
import { UserGenerator } from '../../src/generators/user.generator.js';
import { IdGenerator } from '../../src/generators/base/id-generator.js';
import { DateGenerator } from '../../src/generators/base/date-generator.js';
import { createFaker } from '../../src/generators/base/faker-config.js';
import type { GenerationContext } from '../../src/types/generator.types.js';

describe('UserGenerator', () => {
  let generator: UserGenerator;
  let context: GenerationContext;

  beforeEach(() => {
    generator = new UserGenerator();
    const faker = createFaker(12345);
    const idGenerator = new IdGenerator();
    const dateGenerator = new DateGenerator(faker);

    context = {
      config: {
        version: '1.0',
        projects: { count: 1, issuesPerProject: 10 },
      },
      faker,
      idGenerator,
      dateGenerator,
      seed: 12345,
    };
  });

  it('should generate a valid user', () => {
    const user = generator.generateUser(context);

    expect(user.accountId).toBeDefined();
    expect(user.accountType).toBe('atlassian');
    expect(user.displayName).toBeDefined();
    expect(user.emailAddress).toBeDefined();
    expect(user.active).toBe(true);
    expect(user.avatarUrls).toBeDefined();
    expect(user.avatarUrls['48x48']).toBeDefined();
  });

  it('should generate multiple users', () => {
    const users = generator.generateUsers(5, context);

    expect(users).toHaveLength(5);
    users.forEach((user) => {
      expect(user.accountId).toBeDefined();
      expect(user.displayName).toBeDefined();
    });
  });

  it('should generate unique account IDs', () => {
    const users = generator.generateUsers(10, context);
    const accountIds = users.map((u) => u.accountId);
    const uniqueIds = new Set(accountIds);

    expect(uniqueIds.size).toBe(10);
  });

  it('should generate consistent users with same seed', () => {
    const user1 = generator.generateUser(context);

    // Reset with same seed
    const faker2 = createFaker(12345);
    const idGenerator2 = new IdGenerator();
    const dateGenerator2 = new DateGenerator(faker2);
    const context2: GenerationContext = {
      ...context,
      faker: faker2,
      idGenerator: idGenerator2,
      dateGenerator: dateGenerator2,
    };

    const user2 = generator.generateUser(context2);

    expect(user1.displayName).toBe(user2.displayName);
    expect(user1.emailAddress).toBe(user2.emailAddress);
  });
});
