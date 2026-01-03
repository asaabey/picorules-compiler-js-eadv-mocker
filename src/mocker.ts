/**
 * EADV Mocker
 *
 * Main module for generating mock EADV data from Picorules ruleblocks.
 */

import { parse, RuleblockInput, ParsedRuleblock } from 'picorules-compiler-js-core';
import { extractDependencies } from './extractor';
import { generateEntityIds, generateEadvRows } from './generators/eadv-generator';
import { generateRoutTables } from './generators/rout-generator';
import { defaultValueGenerator } from './generators/value-generators';
import { createSeededRandom } from './utils/random';
import { parseDate } from './utils/date-utils';
import {
  MockerOptions,
  MockDataResult,
  ResolvedMockerOptions,
} from './models/types';

/**
 * Apply default values to mocker options.
 *
 * @param options - User-provided options (partial)
 * @returns Fully resolved options with defaults applied
 */
function resolveOptions(options: MockerOptions = {}): ResolvedMockerOptions {
  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  return {
    entityCount: options.entityCount ?? 3,
    entityIdStart: options.entityIdStart ?? 1001,
    observationsPerEntity: options.observationsPerEntity ?? 3,
    dateRange: {
      start: options.dateRange?.start
        ? parseDate(options.dateRange.start)
        : oneYearAgo,
      end: options.dateRange?.end ? parseDate(options.dateRange.end) : now,
    },
    dateFormat: options.dateFormat ?? 'iso',
    dateDistribution: options.dateDistribution ?? 'uniform',
    valueGenerators: options.valueGenerators ?? {},
    defaultValueGenerator: options.defaultValueGenerator ?? defaultValueGenerator,
    includeMockBindTables: options.includeMockBindTables ?? true,
    bindTableValues: options.bindTableValues ?? {},
    seed: options.seed ?? Date.now(),
  };
}

/**
 * Generate mock EADV data from raw ruleblock inputs.
 *
 * This is the main entry point. It parses the ruleblocks first,
 * then generates mock data based on the extracted dependencies.
 *
 * @param input - Object containing ruleblocks and options
 * @returns MockDataResult with EADV rows, rout tables, and metadata
 *
 * @example
 * ```typescript
 * const result = generateMockData({
 *   ruleblocks: [
 *     {
 *       name: 'ckd',
 *       text: `
 *         egfr_last => eadv.lab_bld_egfr.val.last();
 *         has_ckd : {egfr_last < 60 => 1}, {=> 0};
 *       `,
 *       isActive: true,
 *     }
 *   ],
 *   options: {
 *     entityCount: 5,
 *     valueGenerators: {
 *       'lab_bld_egfr': () => Math.floor(Math.random() * 105) + 15,
 *     },
 *   }
 * });
 * ```
 */
export function generateMockData(input: {
  ruleblocks: RuleblockInput[];
  options?: MockerOptions;
}): MockDataResult {
  // Parse the ruleblocks using the core compiler
  const parsed = parse(input.ruleblocks);

  // Delegate to the parsed version
  return generateMockDataFromParsed(parsed, input.options);
}

/**
 * Generate mock EADV data from already-parsed ruleblocks.
 *
 * Use this if you've already parsed the ruleblocks and want to
 * skip the parsing step.
 *
 * @param parsed - Array of parsed ruleblocks from the compiler
 * @param options - Mocker options
 * @returns MockDataResult with EADV rows, rout tables, and metadata
 *
 * @example
 * ```typescript
 * import { parse } from 'picorules-compiler-js-core';
 *
 * const parsed = parse(ruleblocks);
 * const mockData = generateMockDataFromParsed(parsed, {
 *   entityCount: 10,
 *   seed: 12345, // Reproducible
 * });
 * ```
 */
export function generateMockDataFromParsed(
  parsed: ParsedRuleblock[],
  options: MockerOptions = {}
): MockDataResult {
  // Resolve options with defaults
  const opts = resolveOptions(options);

  // Create seeded random generator
  const random = createSeededRandom(opts.seed);

  // Extract dependencies from the parsed ruleblocks
  const { eadvAttributes, bindDependencies } = extractDependencies(parsed);

  // Generate entity IDs
  const entities = generateEntityIds(opts.entityCount, opts.entityIdStart);

  // Generate EADV rows
  const eadv = generateEadvRows(eadvAttributes, entities, opts, random);

  // Generate rout tables for bind dependencies (if enabled)
  const routTables = opts.includeMockBindTables
    ? generateRoutTables(bindDependencies, entities, opts, random)
    : {};

  // Build metadata
  const metadata = {
    entities,
    attributes: Array.from(eadvAttributes),
    bindDependencies: Array.from(bindDependencies.keys()),
    totalRows: eadv.length,
  };

  return {
    eadv,
    routTables,
    metadata,
  };
}
