import { describe, it, expect } from 'vitest';
import {
  shouldApply,
  weightedPick,
  normalizeDistribution,
  randomInRange,
  randomPick,
  randomSubset,
} from '../../../src/generators/utils/probability.js';
import { createFaker } from '../../../src/generators/base/faker-config.js';

describe('Probability Utils', () => {
  describe('shouldApply', () => {
    const faker = createFaker(12345);

    it('should always return false for probability = 0', () => {
      for (let i = 0; i < 100; i++) {
        expect(shouldApply(faker, 0)).toBe(false);
      }
    });

    it('should always return true for probability = 1', () => {
      for (let i = 0; i < 100; i++) {
        expect(shouldApply(faker, 1)).toBe(true);
      }
    });

    it('should return false for negative probability', () => {
      expect(shouldApply(faker, -0.5)).toBe(false);
    });

    it('should return true for probability > 1', () => {
      expect(shouldApply(faker, 1.5)).toBe(true);
    });

    it('should return a mix of true and false for 0.5 probability', () => {
      const results = new Array(1000).fill(0).map(() => shouldApply(faker, 0.5));
      const trueCount = results.filter((r) => r === true).length;

      // With 1000 samples at 0.5 probability, we expect roughly 400-600 true values
      expect(trueCount).toBeGreaterThan(400);
      expect(trueCount).toBeLessThan(600);
    });
  });

  describe('weightedPick', () => {
    it('should pick items according to weights', () => {
      const faker = createFaker(12345);
      const weights = {
        story: 0.5,
        task: 0.3,
        bug: 0.2,
      };

      const picks: Record<string, number> = { story: 0, task: 0, bug: 0 };
      const iterations = 10000;

      for (let i = 0; i < iterations; i++) {
        const result = weightedPick(faker, weights);
        picks[result]++;
      }

      // Check that the distribution is roughly correct (within 5%)
      expect(picks.story / iterations).toBeCloseTo(0.5, 1);
      expect(picks.task / iterations).toBeCloseTo(0.3, 1);
      expect(picks.bug / iterations).toBeCloseTo(0.2, 1);
    });

    it('should handle equal weights', () => {
      const faker = createFaker(12345);
      const weights = { a: 1, b: 1, c: 1 };

      const picks: Record<string, number> = { a: 0, b: 0, c: 0 };
      const iterations = 3000;

      for (let i = 0; i < iterations; i++) {
        const result = weightedPick(faker, weights);
        picks[result]++;
      }

      // Each should be roughly 1/3 (within reasonable variance)
      expect(picks.a / iterations).toBeCloseTo(0.33, 1);
      expect(picks.b / iterations).toBeCloseTo(0.33, 1);
      expect(picks.c / iterations).toBeCloseTo(0.33, 1);
    });

    it('should handle all zero weights by picking randomly', () => {
      const faker = createFaker(12345);
      const weights = { a: 0, b: 0, c: 0 };

      const result = weightedPick(faker, weights);
      expect(['a', 'b', 'c']).toContain(result);
    });

    it('should handle single item', () => {
      const faker = createFaker(12345);
      const weights = { only: 1 };

      const result = weightedPick(faker, weights);
      expect(result).toBe('only');
    });
  });

  describe('normalizeDistribution', () => {
    it('should normalize weights to sum to 1', () => {
      const weights = {
        story: 0.5,
        task: 0.3,
        bug: 0.3,
      };

      const normalized = normalizeDistribution(weights);

      const sum = Object.values(normalized).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 10);
    });

    it('should maintain proportions', () => {
      const weights = {
        story: 50,
        task: 30,
        bug: 20,
      };

      const normalized = normalizeDistribution(weights);

      expect(normalized.story).toBeCloseTo(0.5, 10);
      expect(normalized.task).toBeCloseTo(0.3, 10);
      expect(normalized.bug).toBeCloseTo(0.2, 10);
    });

    it('should handle already normalized weights', () => {
      const weights = {
        story: 0.5,
        task: 0.3,
        bug: 0.2,
      };

      const normalized = normalizeDistribution(weights);

      expect(normalized.story).toBeCloseTo(0.5, 10);
      expect(normalized.task).toBeCloseTo(0.3, 10);
      expect(normalized.bug).toBeCloseTo(0.2, 10);
    });

    it('should handle zero total weight', () => {
      const weights = {
        story: 0,
        task: 0,
        bug: 0,
      };

      const normalized = normalizeDistribution(weights);

      expect(normalized).toEqual(weights);
    });
  });

  describe('randomInRange', () => {
    const faker = createFaker(12345);

    it('should return value within integer range', () => {
      for (let i = 0; i < 100; i++) {
        const result = randomInRange(faker, 1, 10);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(10);
        expect(Number.isInteger(result)).toBe(true);
      }
    });

    it('should return value within float range', () => {
      for (let i = 0; i < 100; i++) {
        const result = randomInRange(faker, 1.5, 5.5);
        expect(result).toBeGreaterThanOrEqual(1.5);
        expect(result).toBeLessThanOrEqual(5.5);
      }
    });

    it('should swap min and max if reversed', () => {
      const result = randomInRange(faker, 10, 1);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
    });

    it('should handle equal min and max', () => {
      const result = randomInRange(faker, 5, 5);
      expect(result).toBe(5);
    });
  });

  describe('randomPick', () => {
    const faker = createFaker(12345);
    const items = ['a', 'b', 'c', 'd', 'e'];

    it('should pick requested number of items', () => {
      const result = randomPick(faker, items, 3);
      expect(result.length).toBe(3);
    });

    it('should pick unique items', () => {
      const result = randomPick(faker, items, 3);
      const unique = new Set(result);
      expect(unique.size).toBe(3);
    });

    it('should return all items when count >= array length', () => {
      const result = randomPick(faker, items, 10);
      expect(result.length).toBe(items.length);
      expect(new Set(result).size).toBe(items.length);
    });

    it('should return empty array for count = 0', () => {
      const result = randomPick(faker, items, 0);
      expect(result).toEqual([]);
    });

    it('should return empty array for negative count', () => {
      const result = randomPick(faker, items, -5);
      expect(result).toEqual([]);
    });

    it('should handle empty array', () => {
      const result = randomPick(faker, [], 5);
      expect(result).toEqual([]);
    });
  });

  describe('randomSubset', () => {
    const faker = createFaker(12345);
    const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

    it('should return empty array for probability = 0', () => {
      const result = randomSubset(faker, items, 0);
      expect(result).toEqual([]);
    });

    it('should return all items for probability = 1', () => {
      const result = randomSubset(faker, items, 1);
      expect(result.length).toBe(items.length);
      expect(result).toEqual(items);
    });

    it('should return empty array for negative probability', () => {
      const result = randomSubset(faker, items, -0.5);
      expect(result).toEqual([]);
    });

    it('should return all items for probability > 1', () => {
      const result = randomSubset(faker, items, 1.5);
      expect(result.length).toBe(items.length);
    });

    it('should return roughly expected number of items for 0.5 probability', () => {
      // Run multiple times to get average
      let totalCount = 0;
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const result = randomSubset(faker, items, 0.5);
        totalCount += result.length;
      }

      const avgCount = totalCount / iterations;
      // With probability 0.5 and 10 items, we expect roughly 5 items on average
      expect(avgCount).toBeGreaterThan(3);
      expect(avgCount).toBeLessThan(7);
    });

    it('should return subset of original array', () => {
      const result = randomSubset(faker, items, 0.5);
      result.forEach((item) => {
        expect(items).toContain(item);
      });
    });

    it('should handle empty array', () => {
      const result = randomSubset(faker, [], 0.5);
      expect(result).toEqual([]);
    });
  });
});
