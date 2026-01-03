/**
 * Rout Table Generator
 *
 * Generates mock rout_* table rows for bind statement dependencies.
 */

import { RoutRow, ResolvedMockerOptions } from '../models/types';

/**
 * Generate rout_* tables for all bind dependencies.
 *
 * @param bindDependencies - Map of table name -> Set of variable names
 * @param entities - Array of entity IDs
 * @param options - Resolved mocker options
 * @param random - Seeded random function
 * @returns Record mapping table names to arrays of rows
 */
export function generateRoutTables(
  bindDependencies: Map<string, Set<string>>,
  entities: number[],
  options: ResolvedMockerOptions,
  random: () => number
): Record<string, RoutRow[]> {
  const result: Record<string, RoutRow[]> = {};

  for (const [tableName, variables] of bindDependencies) {
    // Generate one row per entity for this table
    result[tableName] = entities.map((eid) => {
      const row: RoutRow = { eid };

      // Generate a value for each variable in this table
      for (const varName of variables) {
        // Check for custom generator
        const customGen = options.bindTableValues[tableName]?.[varName];

        if (customGen) {
          row[varName] = customGen(random);
        } else {
          // Default: binary 0 or 1 (common for flag variables)
          row[varName] = random() > 0.5 ? 1 : 0;
        }
      }

      return row;
    });
  }

  return result;
}
