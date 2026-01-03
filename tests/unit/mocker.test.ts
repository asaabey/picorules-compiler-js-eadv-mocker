import { describe, it, expect } from 'vitest';
import { generateMockData, generateMockDataFromParsed } from '../../src/mocker';
import { RuleType, ParsedRuleblock } from 'picorules-compiler-js-core';

describe('mocker', () => {
  describe('generateMockData', () => {
    it('should generate mock data from ruleblock text', () => {
      const result = generateMockData({
        ruleblocks: [
          {
            name: 'ckd',
            text: 'egfr_last => eadv.lab_bld_egfr.val.last();',
            isActive: true,
          },
        ],
      });

      expect(result.eadv.length).toBeGreaterThan(0);
      expect(result.metadata.attributes).toContain('lab_bld_egfr');
    });

    it('should respect entityCount option', () => {
      const result = generateMockData({
        ruleblocks: [
          {
            name: 'test',
            text: 'x => eadv.lab_bld_egfr.val.last();',
            isActive: true,
          },
        ],
        options: {
          entityCount: 5,
          observationsPerEntity: 1,
        },
      });

      expect(result.metadata.entities.length).toBe(5);
      expect(result.eadv.length).toBe(5); // 5 entities × 1 obs
    });

    it('should use custom value generators', () => {
      const result = generateMockData({
        ruleblocks: [
          {
            name: 'test',
            text: 'x => eadv.lab_bld_egfr.val.last();',
            isActive: true,
          },
        ],
        options: {
          entityCount: 1,
          observationsPerEntity: 3,
          valueGenerators: {
            lab_bld_egfr: () => 42,
          },
        },
      });

      expect(result.eadv.every((row) => row.val === 42)).toBe(true);
    });

    it('should generate reproducible data with seed', () => {
      const options = {
        entityCount: 3,
        observationsPerEntity: 2,
        seed: 12345,
      };

      const result1 = generateMockData({
        ruleblocks: [
          {
            name: 'test',
            text: 'x => eadv.lab_bld_egfr.val.last();',
            isActive: true,
          },
        ],
        options,
      });

      const result2 = generateMockData({
        ruleblocks: [
          {
            name: 'test',
            text: 'x => eadv.lab_bld_egfr.val.last();',
            isActive: true,
          },
        ],
        options,
      });

      // Same seed should produce same data
      expect(result1.eadv).toEqual(result2.eadv);
      expect(result1.metadata).toEqual(result2.metadata);
    });
  });

  describe('generateMockDataFromParsed', () => {
    it('should generate mock data from parsed ruleblocks', () => {
      const parsed: ParsedRuleblock[] = [
        {
          name: 'ckd',
          text: '',
          isActive: true,
          rules: [
            {
              ruleType: RuleType.FETCH_STATEMENT,
              assignedVariable: 'egfr_last',
              table: 'eadv',
              attributeList: ['lab_bld_egfr'],
              property: 'val',
              functionName: 'last',
              references: [],
            },
          ],
        },
      ];

      const result = generateMockDataFromParsed(parsed);

      expect(result.eadv.length).toBe(9); // 3 entities × 1 attr × 3 obs
      expect(result.metadata.attributes).toContain('lab_bld_egfr');
    });

    it('should generate rout tables for bind dependencies', () => {
      const parsed: ParsedRuleblock[] = [
        {
          name: 'monitoring',
          text: '',
          isActive: true,
          rules: [
            {
              ruleType: RuleType.BIND_STATEMENT,
              assignedVariable: 'ckd',
              sourceRuleblock: 'ckd',
              sourceVariable: 'ckd',
              property: 'val',
              references: [],
            },
            {
              ruleType: RuleType.FETCH_STATEMENT,
              assignedVariable: 'egfr',
              table: 'eadv',
              attributeList: ['lab_bld_egfr'],
              property: 'val',
              functionName: 'last',
              references: [],
            },
          ],
        },
      ];

      const result = generateMockDataFromParsed(parsed);

      expect(result.routTables).toHaveProperty('rout_ckd');
      expect(result.routTables['rout_ckd'].length).toBe(3);
      expect(result.routTables['rout_ckd'][0]).toHaveProperty('ckd');
      expect(result.metadata.bindDependencies).toContain('rout_ckd');
    });

    it('should skip rout tables when includeMockBindTables is false', () => {
      const parsed: ParsedRuleblock[] = [
        {
          name: 'test',
          text: '',
          isActive: true,
          rules: [
            {
              ruleType: RuleType.BIND_STATEMENT,
              assignedVariable: 'ckd',
              sourceRuleblock: 'ckd',
              sourceVariable: 'ckd',
              property: 'val',
              references: [],
            },
          ],
        },
      ];

      const result = generateMockDataFromParsed(parsed, {
        includeMockBindTables: false,
      });

      expect(Object.keys(result.routTables).length).toBe(0);
    });

    it('should use custom bind table generators', () => {
      const parsed: ParsedRuleblock[] = [
        {
          name: 'test',
          text: '',
          isActive: true,
          rules: [
            {
              ruleType: RuleType.BIND_STATEMENT,
              assignedVariable: 'ckd',
              sourceRuleblock: 'ckd',
              sourceVariable: 'ckd',
              property: 'val',
              references: [],
            },
          ],
        },
      ];

      const result = generateMockDataFromParsed(parsed, {
        bindTableValues: {
          rout_ckd: {
            ckd: () => 99,
          },
        },
      });

      expect(result.routTables['rout_ckd'].every((r) => r.ckd === 99)).toBe(true);
    });
  });

  describe('metadata', () => {
    it('should include correct entity IDs', () => {
      const result = generateMockData({
        ruleblocks: [
          {
            name: 'test',
            text: 'x => eadv.att1.val.last();',
            isActive: true,
          },
        ],
        options: {
          entityCount: 3,
          entityIdStart: 2000,
        },
      });

      expect(result.metadata.entities).toEqual([2000, 2001, 2002]);
    });

    it('should include all extracted attributes', () => {
      const result = generateMockData({
        ruleblocks: [
          {
            name: 'test',
            text: `
              a => eadv.lab_bld_egfr.val.last();
              b => eadv.lab_bld_hb.val.last();
            `,
            isActive: true,
          },
        ],
      });

      expect(result.metadata.attributes).toContain('lab_bld_egfr');
      expect(result.metadata.attributes).toContain('lab_bld_hb');
    });

    it('should include totalRows count', () => {
      const result = generateMockData({
        ruleblocks: [
          {
            name: 'test',
            text: 'x => eadv.att1.val.last();',
            isActive: true,
          },
        ],
        options: {
          entityCount: 2,
          observationsPerEntity: 4,
        },
      });

      expect(result.metadata.totalRows).toBe(8); // 2 × 1 × 4
    });
  });

  describe('date formatting', () => {
    it('should format dates as ISO by default', () => {
      const result = generateMockData({
        ruleblocks: [
          {
            name: 'test',
            text: 'x => eadv.att1.val.last();',
            isActive: true,
          },
        ],
        options: {
          entityCount: 1,
          observationsPerEntity: 1,
        },
      });

      // ISO format: YYYY-MM-DD
      expect(result.eadv[0].dt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should format dates as Oracle when specified', () => {
      const result = generateMockData({
        ruleblocks: [
          {
            name: 'test',
            text: 'x => eadv.att1.val.last();',
            isActive: true,
          },
        ],
        options: {
          entityCount: 1,
          observationsPerEntity: 1,
          dateFormat: 'oracle',
        },
      });

      // Oracle format: DD-MON-YYYY
      expect(result.eadv[0].dt).toMatch(
        /^\d{2}-(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-\d{4}$/
      );
    });
  });
});
