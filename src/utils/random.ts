/**
 * Seeded Random Number Generator
 *
 * Provides reproducible random number generation using a simple
 * Linear Congruential Generator (LCG) algorithm.
 */

/**
 * Create a seeded random number generator.
 *
 * Uses a Linear Congruential Generator (LCG) for reproducible randomness.
 * Same seed will always produce the same sequence of numbers.
 *
 * @param seed - Seed value for the generator
 * @returns Function that returns random numbers between 0 and 1
 */
export function createSeededRandom(seed: number): () => number {
  // LCG parameters (same as glibc)
  const a = 1103515245;
  const c = 12345;
  const m = 2 ** 31;

  let state = seed % m;

  return () => {
    state = (a * state + c) % m;
    return state / m;
  };
}

/**
 * Generate a random integer between min and max (inclusive).
 *
 * @param random - Random function (0-1)
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns Random integer in range [min, max]
 */
export function randomInt(
  random: () => number,
  min: number,
  max: number
): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

/**
 * Generate a random float between min and max.
 *
 * @param random - Random function (0-1)
 * @param min - Minimum value
 * @param max - Maximum value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Random float in range [min, max]
 */
export function randomFloat(
  random: () => number,
  min: number,
  max: number,
  decimals: number = 1
): number {
  const value = random() * (max - min) + min;
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Pick a random element from an array.
 *
 * @param random - Random function (0-1)
 * @param array - Array to pick from
 * @returns Random element from the array
 */
export function randomPick<T>(random: () => number, array: T[]): T {
  const index = Math.floor(random() * array.length);
  return array[index];
}
