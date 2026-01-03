import { describe, it, expect } from 'vitest';
import {
  extractDependencies,
  extractAttributeList,
  isWildcardAttribute,
  filterConcreteAttributes,
} from '../../src/extractor';
import { RuleType, ParsedRuleblock } from 'picorules-compiler-js-core';

describe('extractor', () => {
  describe('extractDependencies', () => {
    it('should extract attributes from fetch statements', () => {
      const ruleblocks: ParsedRuleblock[] = [
        {
          name: 'test',
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

      const result = extractDependencies(ruleblocks);

      expect(result.eadvAttributes.has('lab_bld_egfr')).toBe(true);
      expect(result.eadvAttributes.size).toBe(1);
      expect(result.bindDependencies.size).toBe(0);
    });

    it('should extract multiple attributes from multi-attribute fetch', () => {
      const ruleblocks: ParsedRuleblock[] = [
        {
          name: 'test',
          text: '',
          isActive: true,
          rules: [
            {
              ruleType: RuleType.FETCH_STATEMENT,
              assignedVariable: 'ua_rbc',
              table: 'eadv',
              attributeList: ['lab_ua_rbc', 'lab_ua_poc_rbc'],
              property: 'val',
              functionName: 'lastdv',
              references: [],
            },
          ],
        },
      ];

      const result = extractDependencies(ruleblocks);

      expect(result.eadvAttributes.has('lab_ua_rbc')).toBe(true);
      expect(result.eadvAttributes.has('lab_ua_poc_rbc')).toBe(true);
      expect(result.eadvAttributes.size).toBe(2);
    });

    it('should extract bind dependencies', () => {
      const ruleblocks: ParsedRuleblock[] = [
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

      const result = extractDependencies(ruleblocks);

      expect(result.bindDependencies.has('rout_ckd')).toBe(true);
      expect(result.bindDependencies.get('rout_ckd')?.has('ckd')).toBe(true);
    });

    it('should extract from multiple ruleblocks', () => {
      const ruleblocks: ParsedRuleblock[] = [
        {
          name: 'rb1',
          text: '',
          isActive: true,
          rules: [
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
        {
          name: 'rb2',
          text: '',
          isActive: true,
          rules: [
            {
              ruleType: RuleType.FETCH_STATEMENT,
              assignedVariable: 'hb',
              table: 'eadv',
              attributeList: ['lab_bld_haemoglobin'],
              property: 'val',
              functionName: 'last',
              references: [],
            },
          ],
        },
      ];

      const result = extractDependencies(ruleblocks);

      expect(result.eadvAttributes.size).toBe(2);
      expect(result.eadvAttributes.has('lab_bld_egfr')).toBe(true);
      expect(result.eadvAttributes.has('lab_bld_haemoglobin')).toBe(true);
    });

    it('should ignore compute statements', () => {
      const ruleblocks: ParsedRuleblock[] = [
        {
          name: 'test',
          text: '',
          isActive: true,
          rules: [
            {
              ruleType: RuleType.COMPUTE_STATEMENT,
              assignedVariable: 'has_ckd',
              conditions: [
                { predicate: 'egfr < 60', returnValue: '1' },
                { returnValue: '0' },
              ],
              references: ['egfr'],
            },
          ],
        },
      ];

      const result = extractDependencies(ruleblocks);

      expect(result.eadvAttributes.size).toBe(0);
      expect(result.bindDependencies.size).toBe(0);
    });
  });

  describe('extractAttributeList', () => {
    it('should return flat array of attributes', () => {
      const ruleblocks: ParsedRuleblock[] = [
        {
          name: 'test',
          text: '',
          isActive: true,
          rules: [
            {
              ruleType: RuleType.FETCH_STATEMENT,
              assignedVariable: 'egfr',
              table: 'eadv',
              attributeList: ['lab_bld_egfr', 'lab_bld_creatinine'],
              property: 'val',
              functionName: 'last',
              references: [],
            },
          ],
        },
      ];

      const result = extractAttributeList(ruleblocks);

      expect(result).toContain('lab_bld_egfr');
      expect(result).toContain('lab_bld_creatinine');
    });
  });

  describe('isWildcardAttribute', () => {
    it('should detect SQL wildcards', () => {
      expect(isWildcardAttribute('lab_%')).toBe(true);
      expect(isWildcardAttribute('icd_%')).toBe(true);
    });

    it('should detect glob wildcards', () => {
      expect(isWildcardAttribute('lab_*')).toBe(true);
    });

    it('should return false for concrete attributes', () => {
      expect(isWildcardAttribute('lab_bld_egfr')).toBe(false);
      expect(isWildcardAttribute('obs_bp_systolic')).toBe(false);
    });
  });

  describe('filterConcreteAttributes', () => {
    it('should filter out wildcard patterns', () => {
      const attributes = new Set(['lab_bld_egfr', 'lab_%', 'icd_%', 'obs_bp']);
      const result = filterConcreteAttributes(attributes);

      expect(result).toContain('lab_bld_egfr');
      expect(result).toContain('obs_bp');
      expect(result).not.toContain('lab_%');
      expect(result).not.toContain('icd_%');
      expect(result.length).toBe(2);
    });

    it('should work with arrays', () => {
      const attributes = ['lab_bld_egfr', 'lab_%'];
      const result = filterConcreteAttributes(attributes);

      expect(result).toContain('lab_bld_egfr');
      expect(result).not.toContain('lab_%');
    });
  });
});
