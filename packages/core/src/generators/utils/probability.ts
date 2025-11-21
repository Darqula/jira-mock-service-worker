import type { Faker } from '@faker-js/faker';

/**
 * Determines whether to apply an action based on a probability
 *
 * @param faker - Faker instance for random number generation
 * @param probability - Probability value between 0 and 1
 * @returns true if action should be applied, false otherwise
 *
 * @example
 * ```typescript
 * if (shouldApply(faker, 0.8)) {
 *   // This will happen 80% of the time
 * }
 * ```
 */
export function shouldApply(faker: Faker, probability: number): boolean {
  if (probability <= 0) return false;
  if (probability >= 1) return true;
  return faker.number.float({ min: 0, max: 1 }) < probability;
}

/**
 * Picks an item from a weighted distribution
 *
 * @param faker - Faker instance for random number generation
 * @param weights - Object mapping items to their weights
 * @returns The selected item key
 *
 * @example
 * ```typescript
 * const type = weightedPick(faker, {
 *   story: 0.5,
 *   task: 0.3,
 *   bug: 0.2
 * });
 * // Returns 'story', 'task', or 'bug' based on weights
 * ```
 */
export function weightedPick<T extends string>(
  faker: Faker,
  weights: Record<T, number>
): T {
  const items = Object.keys(weights) as T[];
  const totalWeight = (Object.values(weights) as number[]).reduce(
    (sum: number, weight: number) => sum + weight,
    0
  );

  if (totalWeight === 0) {
    // If all weights are zero, pick randomly
    return faker.helpers.arrayElement(items);
  }

  const random = faker.number.float({ min: 0, max: totalWeight });
  let cumulative = 0;

  for (const item of items) {
    cumulative += weights[item];
    if (random < cumulative) {
      return item;
    }
  }

  // Fallback to last item (shouldn't happen, but TypeScript needs it)
  return items[items.length - 1];
}

/**
 * Normalizes a distribution so that all weights sum to 1
 *
 * @param weights - Object mapping items to their weights
 * @returns Normalized weights that sum to 1
 *
 * @example
 * ```typescript
 * const normalized = normalizeDistribution({
 *   story: 0.5,
 *   task: 0.3,
 *   bug: 0.3  // Sum is 1.1, not 1.0
 * });
 * // Returns { story: 0.455, task: 0.273, bug: 0.273 }
 * ```
 */
export function normalizeDistribution<T extends string>(
  weights: Record<T, number>
): Record<T, number> {
  const totalWeight = (Object.values(weights) as number[]).reduce(
    (sum: number, weight: number) => sum + weight,
    0
  );

  if (totalWeight === 0) {
    return weights;
  }

  const normalized = {} as Record<T, number>;
  for (const key in weights) {
    normalized[key] = (weights[key] || 0) / totalWeight;
  }

  return normalized;
}

/**
 * Generates a random number within a range (inclusive)
 *
 * @param faker - Faker instance for random number generation
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns Random number between min and max
 *
 * @example
 * ```typescript
 * const hours = randomInRange(faker, 1, 4);
 * // Returns a number between 1 and 4
 * ```
 */
export function randomInRange(
  faker: Faker,
  min: number,
  max: number
): number {
  if (min > max) {
    [min, max] = [max, min]; // Swap if min > max
  }

  // For integer ranges, use integer random
  if (Number.isInteger(min) && Number.isInteger(max)) {
    return faker.number.int({ min, max });
  }

  // For float ranges, use float random
  return faker.number.float({ min, max });
}

/**
 * Picks N random items from an array without replacement
 *
 * @param faker - Faker instance for random selection
 * @param array - Array to pick from
 * @param count - Number of items to pick
 * @returns Array of picked items
 *
 * @example
 * ```typescript
 * const selectedUsers = randomPick(faker, users, 3);
 * // Returns 3 random users from the array
 * ```
 */
export function randomPick<T>(faker: Faker, array: T[], count: number): T[] {
  if (count <= 0) return [];
  if (count >= array.length) return [...array];

  return faker.helpers.arrayElements(array, count);
}

/**
 * Generates a random subset of an array based on a probability
 * Each item has the given probability of being included
 *
 * @param faker - Faker instance for random selection
 * @param array - Array to pick from
 * @param probability - Probability for each item to be included (0-1)
 * @returns Array of picked items
 *
 * @example
 * ```typescript
 * const selectedLabels = randomSubset(faker, allLabels, 0.3);
 * // Each label has a 30% chance of being included
 * ```
 */
export function randomSubset<T>(
  faker: Faker,
  array: T[],
  probability: number
): T[] {
  if (probability <= 0) return [];
  if (probability >= 1) return [...array];

  return array.filter(() => shouldApply(faker, probability));
}
