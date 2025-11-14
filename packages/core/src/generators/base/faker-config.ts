import { faker, Faker } from '@faker-js/faker';

export function createFaker(seed?: number): Faker {
  const fakerInstance = faker;
  if (seed !== undefined) {
    fakerInstance.seed(seed);
  }
  return fakerInstance;
}

export function createSeededFaker(seed: number): Faker {
  const fakerInstance = faker;
  fakerInstance.seed(seed);
  return fakerInstance;
}
