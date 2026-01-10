/**
 * Horizon Calendar System
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

export interface SeasonPhase {
  name: string;
  image: string;
  weather: string;
  temperature: string;
}

export const SEASON_PHASES: SeasonPhase[] = [
  { name: 'Full Winter', image: 'https://taiyaefiles.blob.core.windows.net/web/Full%20Winter.jpg', weather: 'Snowy', temperature: '25°F / -4°C' },
  { name: 'Late Winter', image: 'https://taiyaefiles.blob.core.windows.net/web/Late%20Winter.jpg', weather: 'Cold', temperature: '35°F / 2°C' },
  { name: 'Early Spring', image: 'https://taiyaefiles.blob.core.windows.net/web/Early%20Spring.jpg', weather: 'Cool', temperature: '50°F / 10°C' },
  { name: 'Full Spring', image: 'https://taiyaefiles.blob.core.windows.net/web/Full%20Spring.jpg', weather: 'Mild', temperature: '60°F / 16°C' },
  { name: 'Late Spring', image: 'https://taiyaefiles.blob.core.windows.net/web/Late%20Spring.jpg', weather: 'Warm', temperature: '70°F / 21°C' },
  { name: 'Early Summer', image: 'https://taiyaefiles.blob.core.windows.net/web/Early%20Summer.jpg', weather: 'Sunny', temperature: '80°F / 27°C' },
  { name: 'Full Summer', image: 'https://taiyaefiles.blob.core.windows.net/web/Full%20Summer.jpg', weather: 'Hot', temperature: '90°F / 32°C' },
  { name: 'Late Summer', image: 'https://taiyaefiles.blob.core.windows.net/web/Late%20Summer.jpg', weather: 'Warm', temperature: '85°F / 29°C' },
  { name: 'Early Autumn', image: 'https://taiyaefiles.blob.core.windows.net/web/Early%20Autumn.jpg', weather: 'Cool', temperature: '65°F / 18°C' },
  { name: 'Full Autumn', image: 'https://taiyaefiles.blob.core.windows.net/web/Full%20Autumn.jpg', weather: 'Crisp', temperature: '55°F / 13°C' },
  { name: 'Late Autumn', image: 'https://taiyaefiles.blob.core.windows.net/web/Late%20Autumn.jpg', weather: 'Cold', temperature: '40°F / 4°C' },
  { name: 'Early Winter', image: 'https://taiyaefiles.blob.core.windows.net/web/Early%20Winter.jpg', weather: 'Freezing', temperature: '30°F / -1°C' },
];

// The epoch: The start date of HY0, Early Summer (phase index 5)
// Set this to the real-world date when Early Summer HY0 began
// January 10, 2026 is currently Early Summer HY0
// Working backwards: Early Summer is phase 5, so phase 0 (Full Winter) of HY0 would have been 5*28 = 140 days earlier
// But we want HY0 to start at Full Winter, and currently be Early Summer
// Let's say Early Summer HY0 started on January 10, 2026
// That means Full Winter HY0 started 140 days before = August 23, 2025
const EPOCH_DATE = new Date('2025-08-23T00:00:00');
const DAYS_PER_PHASE = 28;
const PHASES_PER_YEAR = 12;
const DAYS_PER_YEAR = DAYS_PER_PHASE * PHASES_PER_YEAR; // 336 days

export interface HorizonDate {
  year: number;           // HY number (0, 1, 2, ...)
  phaseIndex: number;     // 0-11
  phase: SeasonPhase;     // Current season phase
  dayInPhase: number;     // 1-28
  daysUntilNextPhase: number;
  nextPhase: SeasonPhase;
}

/**
 * Get the current Horizon date based on the real-world date
 */
export function getHorizonDate(realDate: Date = new Date()): HorizonDate {
  // Calculate days since epoch
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysSinceEpoch = Math.floor((realDate.getTime() - EPOCH_DATE.getTime()) / msPerDay);
  
  // If before epoch, return early state
  if (daysSinceEpoch < 0) {
    return {
      year: 0,
      phaseIndex: 0,
      phase: SEASON_PHASES[0],
      dayInPhase: 1,
      daysUntilNextPhase: DAYS_PER_PHASE,
      nextPhase: SEASON_PHASES[1],
    };
  }
  
  // Calculate year and day within year
  const year = Math.floor(daysSinceEpoch / DAYS_PER_YEAR);
  const dayInYear = daysSinceEpoch % DAYS_PER_YEAR;
  
  // Calculate phase index and day within phase
  const phaseIndex = Math.floor(dayInYear / DAYS_PER_PHASE);
  const dayInPhase = (dayInYear % DAYS_PER_PHASE) + 1; // 1-indexed
  
  // Calculate days until next phase
  const daysUntilNextPhase = DAYS_PER_PHASE - dayInPhase + 1;
  
  // Get next phase (wraps around)
  const nextPhaseIndex = (phaseIndex + 1) % PHASES_PER_YEAR;
  
  return {
    year,
    phaseIndex,
    phase: SEASON_PHASES[phaseIndex],
    dayInPhase,
    daysUntilNextPhase,
    nextPhase: SEASON_PHASES[nextPhaseIndex],
  };
}

/**
 * Format the Horizon year string (e.g., "HY0", "HY1")
 */
export function formatHorizonYear(year: number): string {
  return `HY${year}`;
}

/**
 * Get a weather icon based on the weather description
 */
export function getWeatherIcon(weather: string): 'sun' | 'cloud' | 'snow' | 'leaf' | 'wind' {
  const w = weather.toLowerCase();
  if (w.includes('snow') || w.includes('freez')) return 'snow';
  if (w.includes('hot') || w.includes('sunny')) return 'sun';
  if (w.includes('cold') || w.includes('cool') || w.includes('crisp')) return 'wind';
  if (w.includes('mild') || w.includes('warm')) return 'sun';
  return 'cloud';
}
