import { describe, it, expect } from 'vitest';
import { SprintGenerator } from '../../src/generators/sprint.generator.js';
import { createFaker } from '../../src/generators/base/faker-config.js';
import { IdGenerator } from '../../src/generators/base/id-generator.js';
import { DateGenerator } from '../../src/generators/base/date-generator.js';
import type { GenerationContext } from '../../src/types/generator.types.js';

describe('SprintGenerator', () => {
  let generator: SprintGenerator;
  let context: GenerationContext;

  beforeEach(() => {
    generator = new SprintGenerator();
    const faker = createFaker(12345);
    context = {
      config: {
        version: '1.0',
        projects: [],
      },
      faker,
      idGenerator: new IdGenerator(),
      dateGenerator: new DateGenerator(faker),
      seed: 12345,
      currentProject: {
        sprints: {
          startNumber: 1,
          duration: 14,
          assignProbability: 0.7,
        },
      } as any,
    };
  });

  describe('generateSprints', () => {
    it('should generate sprints based on date range', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-03-31'); // ~90 days = ~6 sprints of 14 days

      const sprints = generator.generateSprints(startDate, endDate, context);

      expect(sprints.length).toBeGreaterThan(0);
      expect(sprints.length).toBeLessThanOrEqual(7); // ~6-7 sprints for 90 days
    });

    it('should generate sequential sprint names with start number', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-02-28');

      context.currentProject!.sprints!.startNumber = 5;
      const sprints = generator.generateSprints(startDate, endDate, context);

      // Sprint names should contain the sprint number starting from 5
      sprints.forEach((sprint, index) => {
        const expectedNumber = 5 + index;
        expect(sprint.name).toMatch(new RegExp(`${expectedNumber}`));
      });
    });

    it('should respect custom sprint duration', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-29'); // 28 days

      context.currentProject!.sprints!.duration = 7; // 1 week sprints
      const sprints = generator.generateSprints(startDate, endDate, context);

      expect(sprints.length).toBe(4); // 28 days / 7 days = 4 sprints
    });

    it('should set sprint states based on dates', () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
      const futureDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days future

      const sprints = generator.generateSprints(pastDate, futureDate, context);

      const closedSprints = sprints.filter((s) => s.state === 'closed');
      const activeSprints = sprints.filter((s) => s.state === 'active');
      const futureSprints = sprints.filter((s) => s.state === 'future');

      // Should have sprints in all three states
      expect(closedSprints.length).toBeGreaterThan(0);
      expect(activeSprints.length).toBeGreaterThan(0);
      expect(futureSprints.length).toBeGreaterThan(0);
    });

    it('should include start and end dates for all sprints', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-02-28');

      const sprints = generator.generateSprints(startDate, endDate, context);

      sprints.forEach((sprint) => {
        expect(sprint.startDate).toBeDefined();
        expect(sprint.endDate).toBeDefined();
      });
    });

    it('should include complete date only for closed sprints', () => {
      const pastDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const now = new Date();

      const sprints = generator.generateSprints(pastDate, now, context);

      const closedSprints = sprints.filter((s) => s.state === 'closed');
      const otherSprints = sprints.filter((s) => s.state !== 'closed');

      closedSprints.forEach((sprint) => {
        expect(sprint.completeDate).toBeDefined();
      });

      otherSprints.forEach((sprint) => {
        expect(sprint.completeDate).toBeUndefined();
      });
    });

    it('should generate unique sprint IDs', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-03-31');

      const sprints = generator.generateSprints(startDate, endDate, context);

      const ids = sprints.map((s) => s.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should include self URLs', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-02-28');

      const sprints = generator.generateSprints(startDate, endDate, context);

      sprints.forEach((sprint) => {
        expect(sprint.self).toBeDefined();
        expect(sprint.self).toContain(sprint.id);
      });
    });

    it('should assign origin board IDs', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-02-28');

      const sprints = generator.generateSprints(startDate, endDate, context);

      sprints.forEach((sprint) => {
        expect(sprint.originBoardId).toBeGreaterThanOrEqual(1);
        expect(sprint.originBoardId).toBeLessThanOrEqual(10);
      });
    });

    it('should optionally include sprint goals', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-02-28');

      const sprints = generator.generateSprints(startDate, endDate, context);

      // Not all sprints will have goals, but some should
      const sprintsWithGoals = sprints.filter((s) => s.goal);
      expect(sprintsWithGoals.length).toBeGreaterThan(0);
    });
  });

  describe('getRandomSprint', () => {
    it('should return undefined for empty sprint list', () => {
      const result = generator.getRandomSprint([], context, 1.0);
      expect(result).toBeUndefined();
    });

    it('should return undefined when probability check fails', () => {
      const now = new Date();
      const sprints = generator.generateSprints(
        new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
        context
      );

      // With probability 0, should always return undefined
      const result = generator.getRandomSprint(sprints, context, 0);
      expect(result).toBeUndefined();
    });

    it('should only return active or closed sprints', () => {
      const now = new Date();
      const sprints = generator.generateSprints(
        new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
        context
      );

      // Try multiple times with high probability
      for (let i = 0; i < 50; i++) {
        const result = generator.getRandomSprint(sprints, context, 1.0);
        if (result) {
          expect(['active', 'closed']).toContain(result.state);
        }
      }
    });

    it('should return undefined when only future sprints exist', () => {
      const futureStart = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const futureEnd = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

      const sprints = generator.generateSprints(futureStart, futureEnd, context);

      const result = generator.getRandomSprint(sprints, context, 1.0);
      expect(result).toBeUndefined();
    });

    it('should return a sprint when valid sprints exist and probability passes', () => {
      const now = new Date();
      const sprints = generator.generateSprints(
        new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        now,
        context
      );

      // With probability 1.0, should return a sprint
      const result = generator.getRandomSprint(sprints, context, 1.0);
      expect(result).toBeDefined();
      expect(['active', 'closed']).toContain(result!.state);
    });
  });

  describe('Sprint naming', () => {
    it('should generate varied sprint names', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-03-31');

      const sprints = generator.generateSprints(startDate, endDate, context);

      // All names should include the sprint number
      sprints.forEach((sprint, index) => {
        const sprintNumber = 1 + index;
        expect(sprint.name).toMatch(new RegExp(sprintNumber.toString()));
      });
    });
  });

  describe('Sprint goals', () => {
    it('should generate meaningful sprint goals', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-03-31');

      const sprints = generator.generateSprints(startDate, endDate, context);
      const sprintsWithGoals = sprints.filter((s) => s.goal);

      sprintsWithGoals.forEach((sprint) => {
        expect(sprint.goal!.length).toBeGreaterThan(10);
        // Goals should contain action words
        const hasAction = ['Complete', 'Improve', 'Fix', 'Launch', 'Enhance', 'Refactor', 'Deliver', 'Stabilize'].some(
          (word) => sprint.goal!.includes(word)
        );
        expect(hasAction).toBe(true);
      });
    });
  });
});
