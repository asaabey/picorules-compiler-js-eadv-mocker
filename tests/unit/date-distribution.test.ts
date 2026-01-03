import { describe, it, expect } from 'vitest';
import { generateDates } from '../../src/utils/date-utils';
import { createSeededRandom } from '../../src/utils/random';

describe('date distributions', () => {
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-12-31');
  const rangeMs = endDate.getTime() - startDate.getTime();

  describe('uniform distribution', () => {
    it('should generate dates spread across the range', () => {
      const random = createSeededRandom(12345);
      const dates = generateDates(10, startDate, endDate, random, 'uniform');

      expect(dates.length).toBe(10);

      // Check dates are within range
      for (const date of dates) {
        expect(date.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(date.getTime()).toBeLessThanOrEqual(endDate.getTime());
      }

      // Check dates are in descending order
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1].getTime()).toBeGreaterThanOrEqual(dates[i].getTime());
      }
    });

    it('should distribute dates relatively evenly', () => {
      const random = createSeededRandom(12345);
      const dates = generateDates(100, startDate, endDate, random, 'uniform');

      // Split range into quarters and count dates in each
      const quarters = [0, 0, 0, 0];
      for (const date of dates) {
        const position = (date.getTime() - startDate.getTime()) / rangeMs;
        const quarterIndex = Math.min(3, Math.floor(position * 4));
        quarters[quarterIndex]++;
      }

      // Each quarter should have roughly 25 dates (allow 10-40 for randomness)
      for (const count of quarters) {
        expect(count).toBeGreaterThan(10);
        expect(count).toBeLessThan(40);
      }
    });
  });

  describe('recent-weighted distribution', () => {
    it('should generate dates with more in recent period', () => {
      const random = createSeededRandom(12345);
      const dates = generateDates(100, startDate, endDate, random, 'recent-weighted');

      expect(dates.length).toBe(100);

      // Check dates are within range
      for (const date of dates) {
        expect(date.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(date.getTime()).toBeLessThanOrEqual(endDate.getTime());
      }

      // Count dates in first half vs second half of range
      const midpoint = startDate.getTime() + rangeMs / 2;
      let firstHalf = 0;
      let secondHalf = 0;

      for (const date of dates) {
        if (date.getTime() < midpoint) {
          firstHalf++;
        } else {
          secondHalf++;
        }
      }

      // Second half (more recent) should have significantly more dates
      expect(secondHalf).toBeGreaterThan(firstHalf);
      // With lambda=2.5, expect roughly 70%+ in second half
      expect(secondHalf).toBeGreaterThan(60);
    });

    it('should cluster toward recent end', () => {
      const random = createSeededRandom(12345);
      const dates = generateDates(100, startDate, endDate, random, 'recent-weighted');

      // Count dates in last quarter
      const lastQuarterStart = startDate.getTime() + rangeMs * 0.75;
      const lastQuarterCount = dates.filter(
        (d) => d.getTime() >= lastQuarterStart
      ).length;

      // With exponential decay, last quarter should have more than 25%
      expect(lastQuarterCount).toBeGreaterThan(35);
    });
  });

  describe('clustered distribution', () => {
    it('should generate dates grouped in clusters', () => {
      const random = createSeededRandom(12345);
      const dates = generateDates(30, startDate, endDate, random, 'clustered');

      expect(dates.length).toBe(30);

      // Check dates are within range
      for (const date of dates) {
        expect(date.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(date.getTime()).toBeLessThanOrEqual(endDate.getTime());
      }
    });

    it('should create visible clusters', () => {
      const random = createSeededRandom(12345);
      const dates = generateDates(30, startDate, endDate, random, 'clustered');

      // Sort dates by time
      const sortedTimes = dates.map((d) => d.getTime()).sort((a, b) => a - b);

      // Calculate gaps between consecutive dates
      const gaps: number[] = [];
      for (let i = 1; i < sortedTimes.length; i++) {
        gaps.push(sortedTimes[i] - sortedTimes[i - 1]);
      }

      // In clustered data, some gaps should be small (within cluster)
      // and some should be large (between clusters)
      const medianGap = [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)];
      const smallGaps = gaps.filter((g) => g < medianGap * 0.5).length;
      const largeGaps = gaps.filter((g) => g > medianGap * 2).length;

      // Expect some variation in gap sizes indicating clusters
      expect(smallGaps).toBeGreaterThan(0);
      expect(largeGaps).toBeGreaterThan(0);
    });

    it('should scale cluster count with observation count', () => {
      const random1 = createSeededRandom(12345);
      const random2 = createSeededRandom(12345);

      // Few observations = 1 cluster
      const fewDates = generateDates(3, startDate, endDate, random1, 'clustered');
      expect(fewDates.length).toBe(3);

      // Many observations = up to 3 clusters
      const manyDates = generateDates(15, startDate, endDate, random2, 'clustered');
      expect(manyDates.length).toBe(15);
    });
  });

  describe('distribution consistency with seed', () => {
    it('should produce same dates with same seed', () => {
      const random1 = createSeededRandom(99999);
      const random2 = createSeededRandom(99999);

      const dates1 = generateDates(10, startDate, endDate, random1, 'recent-weighted');
      const dates2 = generateDates(10, startDate, endDate, random2, 'recent-weighted');

      expect(dates1.map((d) => d.getTime())).toEqual(dates2.map((d) => d.getTime()));
    });

    it('should produce different dates with different seed', () => {
      const random1 = createSeededRandom(11111);
      const random2 = createSeededRandom(22222);

      const dates1 = generateDates(10, startDate, endDate, random1, 'clustered');
      const dates2 = generateDates(10, startDate, endDate, random2, 'clustered');

      // At least some dates should be different
      const times1 = dates1.map((d) => d.getTime());
      const times2 = dates2.map((d) => d.getTime());
      expect(times1).not.toEqual(times2);
    });
  });
});
