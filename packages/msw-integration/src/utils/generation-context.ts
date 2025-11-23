import { faker } from '@faker-js/faker';
import { IdGenerator, DateGenerator } from '@jira-mock/core';
import type { GenerationContext } from '@jira-mock/core';

export function createGenerationContext(seed?: number): GenerationContext {
  const actualSeed = seed ?? Date.now();

  if (seed !== undefined) {
    faker.seed(seed);
  }

  return {
    config: {
      version: '1.0',
      projects: [
        {
          projectKey: 'TEST',
          // Configure issue types to generate exactly 1 issue
          issueTypes: {
            epic: { count: 1, childrenPerEpic: 0 },
            story: { standaloneCount: 0 },
            task: { standaloneCount: 0 },
            bug: { standaloneCount: 0 },
          },
        },
      ],
    },
    faker,
    idGenerator: new IdGenerator(),
    dateGenerator: new DateGenerator(faker),
    seed: actualSeed,
  };
}
