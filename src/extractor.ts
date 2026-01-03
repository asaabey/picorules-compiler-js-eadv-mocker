/**
 * Attribute Extractor
 *
 * Extracts EADV attributes and bind dependencies from parsed ruleblocks.
 */

import {
  ParsedRuleblock,
  ParsedFetchStatement,
  ParsedBindStatement,
  RuleType,
} from 'picorules-compiler-js-core';
import { ExtractedDependencies } from './models/types';

/**
 * Extract all EADV attributes and bind dependencies from parsed ruleblocks.
 *
 * @param ruleblocks - Array of parsed ruleblocks from the compiler
 * @returns Object containing eadvAttributes set and bindDependencies map
 */
export function extractDependencies(
  ruleblocks: ParsedRuleblock[]
): ExtractedDependencies {
  const eadvAttributes = new Set<string>();
  const bindDependencies = new Map<string, Set<string>>();

  for (const rb of ruleblocks) {
    for (const rule of rb.rules) {
      if (rule.ruleType === RuleType.FETCH_STATEMENT) {
        const fetch = rule as ParsedFetchStatement;

        // Add all attributes from the fetch statement
        for (const attr of fetch.attributeList) {
          // Add the attribute (including wildcards like 'lab_%')
          // Wildcard expansion would happen at a higher level if needed
          eadvAttributes.add(attr);
        }
      } else if (rule.ruleType === RuleType.BIND_STATEMENT) {
        const bind = rule as ParsedBindStatement;

        // Build the rout_* table name from the source ruleblock
        const tableName = `rout_${bind.sourceRuleblock}`;

        // Initialize the set if this is the first variable from this table
        if (!bindDependencies.has(tableName)) {
          bindDependencies.set(tableName, new Set());
        }

        // Add the source variable to the set
        bindDependencies.get(tableName)!.add(bind.sourceVariable);
      }
      // Compute statements don't introduce new EADV dependencies
      // (they only reference already-defined variables)
    }
  }

  return { eadvAttributes, bindDependencies };
}

/**
 * Get a flat list of all unique attributes across all ruleblocks.
 *
 * @param ruleblocks - Array of parsed ruleblocks
 * @returns Array of unique attribute names
 */
export function extractAttributeList(ruleblocks: ParsedRuleblock[]): string[] {
  const { eadvAttributes } = extractDependencies(ruleblocks);
  return Array.from(eadvAttributes);
}

/**
 * Check if an attribute name contains a wildcard pattern.
 *
 * @param attribute - Attribute name to check
 * @returns True if the attribute contains wildcards
 */
export function isWildcardAttribute(attribute: string): boolean {
  return attribute.includes('%') || attribute.includes('*');
}

/**
 * Generate a random suffix for wildcard expansion.
 *
 * @param random - Seeded random function
 * @param length - Length of the suffix (default: 2)
 * @returns Random string suffix (lowercase letters)
 */
function generateRandomSuffix(random: () => number, length: number = 2): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let suffix = '';
  for (let i = 0; i < length; i++) {
    suffix += chars[Math.floor(random() * chars.length)];
  }
  return suffix;
}

/**
 * Expand a wildcard attribute into a concrete attribute name.
 * - `icd_c18%` becomes `icd_c18xy` (where xy is random)
 * - `lab_*` becomes `lab_ab` (where ab is random)
 *
 * @param attribute - Attribute name (may contain wildcards)
 * @param random - Seeded random function
 * @returns Concrete attribute name with wildcards replaced
 */
export function expandWildcardAttribute(
  attribute: string,
  random: () => number
): string {
  if (!isWildcardAttribute(attribute)) {
    return attribute;
  }

  // Replace % or * with random suffix
  let expanded = attribute;

  // Replace % with 2 random chars
  while (expanded.includes('%')) {
    expanded = expanded.replace('%', generateRandomSuffix(random, 2));
  }

  // Replace * with 2 random chars
  while (expanded.includes('*')) {
    expanded = expanded.replace('*', generateRandomSuffix(random, 2));
  }

  return expanded;
}

/**
 * Expand all wildcard attributes in a set to concrete attribute names.
 *
 * @param attributes - Set of attribute names (may contain wildcards)
 * @param random - Seeded random function
 * @returns Array of concrete attribute names
 */
export function expandWildcardAttributes(
  attributes: Set<string> | string[],
  random: () => number
): string[] {
  const arr = Array.isArray(attributes) ? attributes : Array.from(attributes);
  return arr.map((attr) => expandWildcardAttribute(attr, random));
}

/**
 * Filter out wildcard attributes (they can't be directly mocked).
 *
 * @param attributes - Set or array of attribute names
 * @returns Array of concrete (non-wildcard) attribute names
 * @deprecated Use expandWildcardAttributes instead for mock data generation
 */
export function filterConcreteAttributes(
  attributes: Set<string> | string[]
): string[] {
  const arr = Array.isArray(attributes) ? attributes : Array.from(attributes);
  return arr.filter((attr) => !isWildcardAttribute(attr));
}
