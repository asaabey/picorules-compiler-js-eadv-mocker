/**
 * EADV Generator
 *
 * Generates mock EADV table rows based on extracted attributes.
 */

import { EadvRow, ResolvedMockerOptions } from '../models/types';
import { generateDates, formatDate } from '../utils/date-utils';
import { expandWildcardAttributes } from '../extractor';

/**
 * Generate entity IDs as an array of numbers.
 *
 * @param count - Number of entities to generate
 * @param startId - Starting ID number
 * @returns Array of entity IDs
 */
export function generateEntityIds(count: number, startId: number): number[] {
  const ids: number[] = [];
  for (let i = 0; i < count; i++) {
    ids.push(startId + i);
  }
  return ids;
}

/**
 * Generate EADV rows for all attributes and entities.
 *
 * @param attributes - Set of attribute names to generate data for
 * @param entities - Array of entity IDs
 * @param options - Resolved mocker options
 * @param random - Seeded random function
 * @returns Array of EADV rows
 */
export function generateEadvRows(
  attributes: Set<string>,
  entities: number[],
  options: ResolvedMockerOptions,
  random: () => number
): EadvRow[] {
  const rows: EadvRow[] = [];

  // Expand wildcard patterns to concrete attribute names
  // e.g., 'icd_c18%' becomes 'icd_c18xy'
  const concreteAttributes = expandWildcardAttributes(attributes, random);

  for (const eid of entities) {
    for (const att of concreteAttributes) {
      // Generate dates for this entity/attribute combination
      const dates = generateDates(
        options.observationsPerEntity,
        options.dateRange.start,
        options.dateRange.end,
        random,
        options.dateDistribution
      );

      // Get the value generator for this attribute
      // Try exact match first, then try pattern match for wildcards
      const valueGen =
        options.valueGenerators[att] || options.defaultValueGenerator;

      // Generate a row for each date
      for (const date of dates) {
        const val = valueGen(random);

        rows.push({
          eid,
          att,
          dt: formatDate(date, options.dateFormat),
          val,
        });
      }
    }
  }

  return rows;
}
