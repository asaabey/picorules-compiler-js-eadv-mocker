/**
 * Date Utilities
 *
 * Functions for generating and formatting dates for mock data.
 * Supports multiple distribution modes for realistic clinical patterns.
 */

import { DateDistribution } from '../models/types';

/**
 * Generate an array of dates within a range using the specified distribution.
 * Dates are returned in descending order (most recent first) to match
 * typical clinical data patterns and support last()/first() functions.
 *
 * @param count - Number of dates to generate
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @param random - Random function for reproducibility
 * @param distribution - Distribution mode: 'uniform', 'recent-weighted', or 'clustered'
 * @returns Array of Date objects in descending order
 */
export function generateDates(
  count: number,
  startDate: Date,
  endDate: Date,
  random: () => number,
  distribution: DateDistribution = 'uniform'
): Date[] {
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();

  let dates: Date[];

  switch (distribution) {
    case 'recent-weighted':
      dates = generateRecentWeightedDates(count, startMs, endMs, random);
      break;
    case 'clustered':
      dates = generateClusteredDates(count, startMs, endMs, random);
      break;
    case 'uniform':
    default:
      dates = generateUniformDates(count, startMs, endMs, random);
      break;
  }

  // Sort descending (most recent first)
  dates.sort((a, b) => b.getTime() - a.getTime());

  return dates;
}

/**
 * Uniform distribution: evenly spread across the date range with jitter.
 */
function generateUniformDates(
  count: number,
  startMs: number,
  endMs: number,
  random: () => number
): Date[] {
  const dates: Date[] = [];
  const rangeMs = endMs - startMs;

  if (count === 1) {
    const ms = startMs + random() * rangeMs;
    dates.push(new Date(ms));
  } else {
    const segmentSize = rangeMs / count;

    for (let i = 0; i < count; i++) {
      const segmentStart = startMs + i * segmentSize;
      const jitter = random() * segmentSize * 0.8;
      const ms = segmentStart + jitter;
      dates.push(new Date(ms));
    }
  }

  return dates;
}

/**
 * Recent-weighted distribution: exponential decay favoring recent dates.
 *
 * Uses inverse exponential sampling so more observations fall in recent months.
 * Formula: date = start + range * random^(1/lambda)
 * where lambda controls the decay (higher = more recent-weighted)
 */
function generateRecentWeightedDates(
  count: number,
  startMs: number,
  endMs: number,
  random: () => number
): Date[] {
  const dates: Date[] = [];
  const rangeMs = endMs - startMs;

  // Lambda controls decay strength (2.5 gives good clinical realism)
  // Higher values = more clustered toward recent
  const lambda = 2.5;

  for (let i = 0; i < count; i++) {
    // Inverse power transform: maps uniform [0,1] to recent-weighted
    // u^(1/lambda) concentrates values toward 1 (recent end)
    const u = random();
    const weighted = Math.pow(u, 1 / lambda);

    // Map to date range (weighted is 0-1, where 1 = most recent)
    const ms = startMs + weighted * rangeMs;
    dates.push(new Date(ms));
  }

  return dates;
}

/**
 * Clustered distribution: observations grouped into episodes.
 *
 * Simulates clinical patterns where tests are ordered in clusters
 * (e.g., during hospital stays, illness episodes, or regular checkups).
 *
 * Algorithm:
 * 1. Determine number of clusters (1-3 based on observation count)
 * 2. Place cluster centers randomly across the range
 * 3. Generate observations around each cluster with Gaussian-like spread
 */
function generateClusteredDates(
  count: number,
  startMs: number,
  endMs: number,
  random: () => number
): Date[] {
  const dates: Date[] = [];
  const rangeMs = endMs - startMs;

  // Number of clusters: 1 for few obs, up to 3 for many
  const numClusters = Math.min(3, Math.max(1, Math.ceil(count / 3)));

  // Generate cluster centers
  const clusterCenters: number[] = [];
  for (let i = 0; i < numClusters; i++) {
    // Spread clusters across the range, but not too close to edges
    const margin = rangeMs * 0.1;
    const center = startMs + margin + random() * (rangeMs - 2 * margin);
    clusterCenters.push(center);
  }

  // Cluster spread (standard deviation in ms) - roughly 2-4 weeks
  const clusterSpread = rangeMs * 0.05; // 5% of range

  // Distribute observations across clusters
  for (let i = 0; i < count; i++) {
    // Pick a cluster
    const clusterIndex = Math.floor(random() * numClusters);
    const center = clusterCenters[clusterIndex];

    // Generate date with Gaussian-like distribution around center
    // Using Box-Muller approximation with uniform random
    const offset = gaussianRandom(random) * clusterSpread;
    let ms = center + offset;

    // Clamp to valid range
    ms = Math.max(startMs, Math.min(endMs, ms));
    dates.push(new Date(ms));
  }

  return dates;
}

/**
 * Generate a Gaussian-distributed random number (mean=0, stddev=1)
 * using the Box-Muller transform.
 */
function gaussianRandom(random: () => number): number {
  let u1 = random();
  let u2 = random();

  // Avoid log(0)
  while (u1 === 0) u1 = random();

  // Box-Muller transform
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z;
}

/**
 * Format a date according to the specified format.
 *
 * @param date - Date to format
 * @param format - Output format: 'iso', 'oracle', or 'mssql'
 * @returns Formatted date string
 */
export function formatDate(
  date: Date,
  format: 'iso' | 'oracle' | 'mssql'
): string {
  switch (format) {
    case 'iso':
      // ISO 8601 format: YYYY-MM-DD
      return date.toISOString().split('T')[0];

    case 'oracle':
      // Oracle DATE format: DD-MON-YYYY (e.g., 15-JAN-2024)
      const months = [
        'JAN',
        'FEB',
        'MAR',
        'APR',
        'MAY',
        'JUN',
        'JUL',
        'AUG',
        'SEP',
        'OCT',
        'NOV',
        'DEC',
      ];
      const day = String(date.getDate()).padStart(2, '0');
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;

    case 'mssql':
      // SQL Server format: YYYY-MM-DD HH:MM:SS
      const pad = (n: number) => String(n).padStart(2, '0');
      return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
      );

    default:
      return date.toISOString().split('T')[0];
  }
}

/**
 * Parse a date string or Date object to a Date object.
 *
 * @param input - Date string or Date object
 * @returns Date object
 */
export function parseDate(input: string | Date): Date {
  if (input instanceof Date) {
    return input;
  }
  return new Date(input);
}
