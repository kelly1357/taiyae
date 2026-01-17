/**
 * Horizon Calendar System (Server-side)
 * 
 * Each season phase lasts 28 real calendar days.
 * The year increments when Full Winter begins.
 * 
 * Season order (12 phases, 336 days per Horizon Year):
 * 1. Full Winter (Jan start - year increments here)
 * 2. Late Winter
 * 3. Early Spring
 * 4. Full Spring
 * 5. Late Spring
 * 6. Early Summer
 * 7. Full Summer
 * 8. Late Summer
 * 9. Early Autumn
 * 10. Full Autumn
 * 11. Late Autumn
 * 12. Early Winter
 */

const SEASON_PHASE_NAMES = [
  'Full Winter',
  'Late Winter',
  'Early Spring',
  'Full Spring',
  'Late Spring',
  'Early Summer',
  'Full Summer',
  'Late Summer',
  'Early Autumn',
  'Full Autumn',
  'Late Autumn',
  'Early Winter',
];

// The epoch: Full Winter HY0 started on August 23, 2025
const EPOCH_DATE = new Date('2025-08-23T00:00:00');
const DAYS_PER_PHASE = 28;
const PHASES_PER_YEAR = 12;
const DAYS_PER_YEAR = DAYS_PER_PHASE * PHASES_PER_YEAR; // 336 days

export interface HorizonDate {
  year: number;
  phaseIndex: number;
  phaseName: string;
}

/**
 * Get the Horizon date based on a real-world date
 */
export function getHorizonDate(realDate: Date = new Date()): HorizonDate {
  // Calculate days since epoch
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysSinceEpoch = Math.floor((realDate.getTime() - EPOCH_DATE.getTime()) / msPerDay);
  
  // If before epoch, return year 0 phase 0
  if (daysSinceEpoch < 0) {
    return {
      year: 0,
      phaseIndex: 0,
      phaseName: SEASON_PHASE_NAMES[0],
    };
  }
  
  // Calculate year and day within year
  const year = Math.floor(daysSinceEpoch / DAYS_PER_YEAR);
  const dayInYear = daysSinceEpoch % DAYS_PER_YEAR;
  
  // Calculate phase index
  const phaseIndex = Math.floor(dayInYear / DAYS_PER_PHASE);
  
  return {
    year,
    phaseIndex,
    phaseName: SEASON_PHASE_NAMES[phaseIndex],
  };
}

/**
 * Format a Horizon date as a string like "HY0, Early Summer"
 */
export function formatHorizonDateString(realDate: Date = new Date()): string {
  const hDate = getHorizonDate(realDate);
  return `HY${hDate.year}, ${hDate.phaseName}`;
}
