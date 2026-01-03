/**
 * picorules-compiler-js-eadv-mocker
 *
 * Mock EADV data generator for Picorules testing.
 * Generates synthetic clinical data based on compiled ruleblocks.
 *
 * @packageDocumentation
 */

// Main API
export { generateMockData, generateMockDataFromParsed } from './mocker';

// Extractor utilities
export {
  extractDependencies,
  extractAttributeList,
  isWildcardAttribute,
  filterConcreteAttributes,
  expandWildcardAttribute,
  expandWildcardAttributes,
} from './extractor';

// Generators
export { generateEntityIds, generateEadvRows } from './generators/eadv-generator';
export { generateRoutTables } from './generators/rout-generator';
export {
  clinicalValueGenerators,
  defaultValueGenerator,
  createRangeGenerator,
  createDiscreteGenerator,
  createNullableGenerator,
} from './generators/value-generators';

// Types
export type {
  EadvRow,
  RoutRow,
  ValueGenerator,
  DateDistribution,
  MockerOptions,
  MockDataResult,
  ExtractedDependencies,
} from './models/types';

// Utilities
export { createSeededRandom, randomInt, randomFloat, randomPick } from './utils/random';
export { generateDates, formatDate, parseDate } from './utils/date-utils';
