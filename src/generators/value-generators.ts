/**
 * Built-in Value Generators
 *
 * Pre-configured value generators for common clinical attributes.
 * These produce realistic ranges for typical lab values.
 */

import { ValueGenerator } from '../models/types';
import { randomInt, randomFloat } from '../utils/random';

/**
 * Clinical value generators for common EADV attributes.
 *
 * These generators produce values within typical clinical ranges.
 * Use these as a starting point and customize as needed.
 */
export const clinicalValueGenerators: Record<string, ValueGenerator> = {
  // Renal function
  lab_bld_egfr: (random = Math.random) => randomInt(random, 15, 120),
  lab_bld_creatinine: (random = Math.random) => randomInt(random, 50, 500),
  lab_ua_acr: (random = Math.random) => randomInt(random, 0, 300),
  lab_bld_urea: (random = Math.random) => randomFloat(random, 2.5, 15, 1),

  // Haematology
  lab_bld_haemoglobin: (random = Math.random) => randomInt(random, 80, 180),
  lab_bld_hb: (random = Math.random) => randomInt(random, 80, 180),
  lab_bld_wbc: (random = Math.random) => randomFloat(random, 3, 15, 1),
  lab_bld_platelet: (random = Math.random) => randomInt(random, 100, 400),
  lab_bld_rbc: (random = Math.random) => randomFloat(random, 3.5, 6, 2),

  // Metabolic / Diabetes
  lab_bld_hba1c: (random = Math.random) => randomFloat(random, 4, 12, 1),
  lab_bld_glucose: (random = Math.random) => randomFloat(random, 3, 20, 1),
  lab_bld_glucose_fasting: (random = Math.random) =>
    randomFloat(random, 3.5, 10, 1),

  // Lipids
  lab_bld_cholesterol: (random = Math.random) => randomFloat(random, 3, 8, 1),
  lab_bld_ldl: (random = Math.random) => randomFloat(random, 1.5, 5, 1),
  lab_bld_hdl: (random = Math.random) => randomFloat(random, 0.8, 2.5, 1),
  lab_bld_triglycerides: (random = Math.random) =>
    randomFloat(random, 0.5, 4, 1),

  // Electrolytes
  lab_bld_potassium: (random = Math.random) => randomFloat(random, 3, 6, 1),
  lab_bld_sodium: (random = Math.random) => randomInt(random, 130, 150),
  lab_bld_calcium: (random = Math.random) => randomFloat(random, 2, 3, 2),
  lab_bld_phosphate: (random = Math.random) => randomFloat(random, 0.8, 2, 2),

  // Liver function
  lab_bld_alt: (random = Math.random) => randomInt(random, 10, 100),
  lab_bld_ast: (random = Math.random) => randomInt(random, 10, 80),
  lab_bld_alp: (random = Math.random) => randomInt(random, 30, 150),
  lab_bld_bilirubin: (random = Math.random) => randomInt(random, 5, 30),
  lab_bld_albumin: (random = Math.random) => randomInt(random, 30, 50),

  // Thyroid
  lab_bld_tsh: (random = Math.random) => randomFloat(random, 0.3, 5, 2),
  lab_bld_t4: (random = Math.random) => randomFloat(random, 10, 25, 1),

  // Urine
  lab_ua_rbc: (random = Math.random) => randomInt(random, 0, 50),
  lab_ua_wbc: (random = Math.random) => randomInt(random, 0, 30),
  lab_ua_protein: (random = Math.random) => randomInt(random, 0, 3),

  // Vitals (if stored in EADV)
  obs_bp_systolic: (random = Math.random) => randomInt(random, 90, 200),
  obs_bp_diastolic: (random = Math.random) => randomInt(random, 50, 120),
  obs_hr: (random = Math.random) => randomInt(random, 50, 120),
  obs_weight: (random = Math.random) => randomFloat(random, 40, 150, 1),
  obs_height: (random = Math.random) => randomFloat(random, 140, 200, 1),
  obs_bmi: (random = Math.random) => randomFloat(random, 16, 45, 1),
};

/**
 * Default value generator that produces random numbers 0-100.
 * Used when no specific generator is configured for an attribute.
 */
export const defaultValueGenerator: ValueGenerator = (random = Math.random) =>
  randomFloat(random, 0, 100, 1);

/**
 * Create a custom numeric range generator.
 *
 * @param min - Minimum value
 * @param max - Maximum value
 * @param decimals - Number of decimal places (0 for integers)
 * @returns ValueGenerator function
 */
export function createRangeGenerator(
  min: number,
  max: number,
  decimals: number = 0
): ValueGenerator {
  return (random = Math.random) => {
    if (decimals === 0) {
      return randomInt(random, min, max);
    }
    return randomFloat(random, min, max, decimals);
  };
}

/**
 * Create a generator that picks from a set of discrete values.
 *
 * @param values - Array of possible values
 * @returns ValueGenerator function
 */
export function createDiscreteGenerator(
  values: (number | string | null)[]
): ValueGenerator {
  return (random = Math.random) => {
    const index = Math.floor(random() * values.length);
    return values[index];
  };
}

/**
 * Create a generator that returns null with a given probability.
 *
 * @param nullProbability - Probability of returning null (0-1)
 * @param baseGenerator - Generator to use when not null
 * @returns ValueGenerator function
 */
export function createNullableGenerator(
  nullProbability: number,
  baseGenerator: ValueGenerator
): ValueGenerator {
  return (random = Math.random) => {
    if (random() < nullProbability) {
      return null;
    }
    return baseGenerator(random);
  };
}
