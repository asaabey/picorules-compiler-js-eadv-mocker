/**
 * EADV Mocker Types
 *
 * Type definitions for the EADV mock data generator.
 */

/**
 * A single row in the EADV table
 */
export interface EadvRow {
  eid: number;
  att: string;
  dt: string;
  val: number | string | null;
}

/**
 * A single row in a rout_* output table (for bind dependencies)
 */
export interface RoutRow {
  eid: number;
  [variableName: string]: number | string | null;
}

/**
 * Value generator function type
 * Takes an optional random function for seeded generation
 */
export type ValueGenerator = (random?: () => number) => number | string | null;

/**
 * Date distribution mode for generating observation dates.
 *
 * - 'uniform': Evenly distributed across the date range (default)
 * - 'recent-weighted': More observations cluster toward recent dates (exponential decay)
 * - 'clustered': Observations cluster in episodes (simulates illness/visit patterns)
 */
export type DateDistribution = 'uniform' | 'recent-weighted' | 'clustered';

/**
 * Configuration options for the mocker
 */
export interface MockerOptions {
  /**
   * Number of entities (patients) to generate
   * @default 3
   */
  entityCount?: number;

  /**
   * Starting entity ID number
   * @default 1001
   */
  entityIdStart?: number;

  /**
   * Number of observations per entity per attribute
   * @default 3
   */
  observationsPerEntity?: number;

  /**
   * Date range for generated observations
   */
  dateRange?: {
    start: string | Date;
    end: string | Date;
  };

  /**
   * Date output format
   * @default 'iso'
   */
  dateFormat?: 'iso' | 'oracle' | 'mssql';

  /**
   * Date distribution mode
   * - 'uniform': Evenly distributed (default)
   * - 'recent-weighted': More recent observations
   * - 'clustered': Observations in episodes
   * @default 'uniform'
   */
  dateDistribution?: DateDistribution;

  /**
   * Custom value generators per attribute name
   * Key is the attribute name (e.g., 'lab_bld_egfr')
   */
  valueGenerators?: {
    [attributeName: string]: ValueGenerator;
  };

  /**
   * Default value generator for attributes without custom generators
   */
  defaultValueGenerator?: ValueGenerator;

  /**
   * Whether to generate mock rout_* tables for bind dependencies
   * @default true
   */
  includeMockBindTables?: boolean;

  /**
   * Custom value generators for bind table variables
   * Key is table name (e.g., 'rout_ckd'), value is map of variable -> generator
   */
  bindTableValues?: {
    [tableName: string]: {
      [variableName: string]: ValueGenerator;
    };
  };

  /**
   * Random seed for reproducible generation
   * If not provided, uses Date.now()
   */
  seed?: number;
}

/**
 * Result of mock data generation
 */
export interface MockDataResult {
  /**
   * Generated EADV table rows
   */
  eadv: EadvRow[];

  /**
   * Generated rout_* table rows (for bind dependencies)
   */
  routTables: {
    [tableName: string]: RoutRow[];
  };

  /**
   * Metadata about what was generated
   */
  metadata: {
    entities: number[];
    attributes: string[];
    bindDependencies: string[];
    totalRows: number;
  };
}

/**
 * Extracted dependencies from parsed ruleblocks
 */
export interface ExtractedDependencies {
  /**
   * Set of unique EADV attribute names needed
   */
  eadvAttributes: Set<string>;

  /**
   * Map of rout_table name -> Set of variable names
   */
  bindDependencies: Map<string, Set<string>>;
}

/**
 * Internal resolved options with all defaults applied
 */
export interface ResolvedMockerOptions {
  entityCount: number;
  entityIdStart: number;
  observationsPerEntity: number;
  dateRange: {
    start: Date;
    end: Date;
  };
  dateFormat: 'iso' | 'oracle' | 'mssql';
  dateDistribution: DateDistribution;
  valueGenerators: {
    [attributeName: string]: ValueGenerator;
  };
  defaultValueGenerator: ValueGenerator;
  includeMockBindTables: boolean;
  bindTableValues: {
    [tableName: string]: {
      [variableName: string]: ValueGenerator;
    };
  };
  seed: number;
}
