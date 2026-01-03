import { describe, it, expect } from 'vitest';
import {
  generateEntityIds,
  generateEadvRows,
} from '../../src/generators/eadv-generator';
import { generateRoutTables } from '../../src/generators/rout-generator';
import {
  clinicalValueGenerators,
  createRangeGenerator,
  createDiscreteGenerator,
  createNullableGenerator,
} from '../../src/generators/value-generators';
import { createSeededRandom } from '../../src/utils/random';
import { ResolvedMockerOptions } from '../../src/models/types';

describe('generators', () => {
  describe('generateEntityIds', () => {
    it('should generate sequential IDs starting from startId', () => {
      const ids = generateEntityIds(3, 1001);

      expect(ids).toEqual([1001, 1002, 1003]);
    });

    it('should handle different start values', () => {
      const ids = generateEntityIds(2, 5000);

      expect(ids).toEqual([5000, 5001]);
    });

    it('should handle single entity', () => {
      const ids = generateEntityIds(1, 100);

      expect(ids).toEqual([100]);
    });
  });

  describe('generateEadvRows', () => {
    const defaultOptions: ResolvedMockerOptions = {
      entityCount: 3,
      entityIdStart: 1001,
      observationsPerEntity: 2,
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31'),
      },
      dateFormat: 'iso',
      dateDistribution: 'uniform',
      valueGenerators: {},
      defaultValueGenerator: () => 50,
      includeMockBindTables: true,
      bindTableValues: {},
      seed: 12345,
    };

    it('should generate correct number of rows', () => {
      const attributes = new Set(['lab_bld_egfr']);
      const entities = [1001, 1002, 1003];
      const random = createSeededRandom(12345);

      const rows = generateEadvRows(attributes, entities, defaultOptions, random);

      // 3 entities × 1 attribute × 2 observations = 6 rows
      expect(rows.length).toBe(6);
    });

    it('should generate rows for multiple attributes', () => {
      const attributes = new Set(['lab_bld_egfr', 'lab_bld_hb']);
      const entities = [1001, 1002];
      const random = createSeededRandom(12345);

      const rows = generateEadvRows(attributes, entities, defaultOptions, random);

      // 2 entities × 2 attributes × 2 observations = 8 rows
      expect(rows.length).toBe(8);
    });

    it('should use custom value generators', () => {
      const options: ResolvedMockerOptions = {
        ...defaultOptions,
        valueGenerators: {
          lab_bld_egfr: () => 42,
        },
      };
      const attributes = new Set(['lab_bld_egfr']);
      const entities = [1001];
      const random = createSeededRandom(12345);

      const rows = generateEadvRows(attributes, entities, options, random);

      expect(rows.every((row) => row.val === 42)).toBe(true);
    });

    it('should expand wildcard attributes to concrete names', () => {
      const attributes = new Set(['lab_bld_egfr', 'lab_%']);
      const entities = [1001];
      const random = createSeededRandom(12345);

      const rows = generateEadvRows(attributes, entities, defaultOptions, random);

      // Should generate for both: concrete attribute + expanded wildcard
      // 1 entity × 2 attributes × 2 observations = 4 rows
      expect(rows.length).toBe(4);
      // lab_bld_egfr rows should exist
      expect(rows.some((row) => row.att === 'lab_bld_egfr')).toBe(true);
      // Expanded wildcard (lab_% -> lab_xx) should also exist
      const expandedRows = rows.filter((row) => row.att !== 'lab_bld_egfr');
      expect(expandedRows.length).toBe(2);
      expect(expandedRows[0].att.startsWith('lab_')).toBe(true);
    });

    it('should generate dates in descending order', () => {
      const attributes = new Set(['lab_bld_egfr']);
      const entities = [1001];
      const random = createSeededRandom(12345);

      const rows = generateEadvRows(attributes, entities, defaultOptions, random);

      // Check dates are descending
      const dates = rows.map((r) => new Date(r.dt).getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
      }
    });
  });

  describe('generateRoutTables', () => {
    const defaultOptions: ResolvedMockerOptions = {
      entityCount: 3,
      entityIdStart: 1001,
      observationsPerEntity: 2,
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31'),
      },
      dateFormat: 'iso',
      dateDistribution: 'uniform',
      valueGenerators: {},
      defaultValueGenerator: () => 50,
      includeMockBindTables: true,
      bindTableValues: {},
      seed: 12345,
    };

    it('should generate rows for each entity', () => {
      const bindDeps = new Map([['rout_ckd', new Set(['ckd'])]]);
      const entities = [1001, 1002, 1003];
      const random = createSeededRandom(12345);

      const result = generateRoutTables(bindDeps, entities, defaultOptions, random);

      expect(result['rout_ckd'].length).toBe(3);
      expect(result['rout_ckd'].map((r) => r.eid)).toEqual([1001, 1002, 1003]);
    });

    it('should generate all variables for each table', () => {
      const bindDeps = new Map([['rout_ckd', new Set(['ckd', 'stage'])]]);
      const entities = [1001];
      const random = createSeededRandom(12345);

      const result = generateRoutTables(bindDeps, entities, defaultOptions, random);

      expect(result['rout_ckd'][0]).toHaveProperty('ckd');
      expect(result['rout_ckd'][0]).toHaveProperty('stage');
    });

    it('should use custom generators from bindTableValues', () => {
      const options: ResolvedMockerOptions = {
        ...defaultOptions,
        bindTableValues: {
          rout_ckd: {
            ckd: () => 99,
          },
        },
      };
      const bindDeps = new Map([['rout_ckd', new Set(['ckd'])]]);
      const entities = [1001];
      const random = createSeededRandom(12345);

      const result = generateRoutTables(bindDeps, entities, options, random);

      expect(result['rout_ckd'][0].ckd).toBe(99);
    });

    it('should handle multiple tables', () => {
      const bindDeps = new Map([
        ['rout_ckd', new Set(['ckd'])],
        ['rout_dm', new Set(['dm'])],
      ]);
      const entities = [1001];
      const random = createSeededRandom(12345);

      const result = generateRoutTables(bindDeps, entities, defaultOptions, random);

      expect(Object.keys(result)).toContain('rout_ckd');
      expect(Object.keys(result)).toContain('rout_dm');
    });
  });

  describe('value generators', () => {
    describe('clinicalValueGenerators', () => {
      it('should generate eGFR in valid range', () => {
        const random = createSeededRandom(12345);
        for (let i = 0; i < 100; i++) {
          const value = clinicalValueGenerators.lab_bld_egfr(random);
          expect(value).toBeGreaterThanOrEqual(15);
          expect(value).toBeLessThanOrEqual(120);
        }
      });

      it('should generate haemoglobin in valid range', () => {
        const random = createSeededRandom(12345);
        for (let i = 0; i < 100; i++) {
          const value = clinicalValueGenerators.lab_bld_haemoglobin(random);
          expect(value).toBeGreaterThanOrEqual(80);
          expect(value).toBeLessThanOrEqual(180);
        }
      });
    });

    describe('createRangeGenerator', () => {
      it('should generate integers when decimals is 0', () => {
        const gen = createRangeGenerator(10, 20, 0);
        const random = createSeededRandom(12345);

        for (let i = 0; i < 50; i++) {
          const value = gen(random) as number;
          expect(Number.isInteger(value)).toBe(true);
          expect(value).toBeGreaterThanOrEqual(10);
          expect(value).toBeLessThanOrEqual(20);
        }
      });

      it('should generate floats with specified decimals', () => {
        const gen = createRangeGenerator(0, 10, 2);
        const random = createSeededRandom(12345);

        const value = gen(random) as number;
        const decimals = value.toString().split('.')[1]?.length || 0;
        expect(decimals).toBeLessThanOrEqual(2);
      });
    });

    describe('createDiscreteGenerator', () => {
      it('should only return values from the array', () => {
        const values = [1, 2, 3];
        const gen = createDiscreteGenerator(values);
        const random = createSeededRandom(12345);

        for (let i = 0; i < 50; i++) {
          const value = gen(random);
          expect(values).toContain(value);
        }
      });

      it('should work with mixed types', () => {
        const values = [1, 'A', null];
        const gen = createDiscreteGenerator(values);
        const random = createSeededRandom(12345);

        const result = gen(random);
        expect(values).toContain(result);
      });
    });

    describe('createNullableGenerator', () => {
      it('should sometimes return null', () => {
        const baseGen = () => 42;
        const gen = createNullableGenerator(0.5, baseGen);
        const random = createSeededRandom(12345);

        const results = [];
        for (let i = 0; i < 100; i++) {
          results.push(gen(random));
        }

        expect(results.some((r) => r === null)).toBe(true);
        expect(results.some((r) => r === 42)).toBe(true);
      });

      it('should never return null when probability is 0', () => {
        const baseGen = () => 42;
        const gen = createNullableGenerator(0, baseGen);
        const random = createSeededRandom(12345);

        for (let i = 0; i < 50; i++) {
          expect(gen(random)).toBe(42);
        }
      });
    });
  });
});
