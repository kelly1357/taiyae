/**
 * Pacific Northwest Weather Generator
 * Generates deterministic weather based on Horizon season and week number
 * Designed for the Horizon Valley setting (Washington State area, early 1900s)
 * 
 * Each season phase has 28 days = 4 weeks
 * Week labels: "Early Summer Week 1", "Early Summer Week 2", etc.
 */

import { SEASON_PHASES } from './horizonCalendar';

// Seeded random number generator for deterministic results
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

export interface WeatherCondition {
  type: 'clear' | 'partly-cloudy' | 'cloudy' | 'overcast' | 'rain' | 'heavy-rain' | 'drizzle' | 'snow' | 'heavy-snow' | 'sleet' | 'fog' | 'thunderstorm';
  description: string;
  icon: string;
}

export interface DailyWeather {
  date: Date;
  dayOfWeek: string;
  highTemp: number;
  lowTemp: number;
  condition: WeatherCondition;
  windSpeed: number; // mph
  windDirection: string;
  precipitation: number; // percentage chance
  humidity: number;
  description: string;
}

export interface WeeklyWeather {
  weekNumber: number;        // 1-4 within the season phase
  seasonPhase: string;       // e.g., "Early Summer"
  seasonPhaseIndex: number;  // 0-11
  horizonYear: number;
  weekLabel: string;         // e.g., "Early Summer Week 2"
  days: DailyWeather[];
  weekSummary: string;
  moonPhase: MoonPhase;
  // For navigation
  globalWeekIndex: number;   // Weeks since epoch (for unique identification)
}

export interface MoonPhase {
  name: string;
  illumination: number; // 0-100
  icon: string;
  daysUntilFull: number;
  daysUntilNew: number;
}

// Weather conditions by type
const WEATHER_CONDITIONS: Record<string, WeatherCondition> = {
  clear: { type: 'clear', description: 'Clear skies', icon: '☀️' },
  'partly-cloudy': { type: 'partly-cloudy', description: 'Partly cloudy', icon: '⛅' },
  cloudy: { type: 'cloudy', description: 'Cloudy', icon: '☁️' },
  overcast: { type: 'overcast', description: 'Overcast', icon: '🌥️' },
  rain: { type: 'rain', description: 'Rainy', icon: '🌧️' },
  'heavy-rain': { type: 'heavy-rain', description: 'Heavy rain', icon: '⛈️' },
  drizzle: { type: 'drizzle', description: 'Light drizzle', icon: '🌦️' },
  snow: { type: 'snow', description: 'Snowy', icon: '🌨️' },
  'heavy-snow': { type: 'heavy-snow', description: 'Heavy snow', icon: '❄️' },
  sleet: { type: 'sleet', description: 'Sleet', icon: '🌨️' },
  fog: { type: 'fog', description: 'Foggy', icon: '🌫️' },
  thunderstorm: { type: 'thunderstorm', description: 'Thunderstorm', icon: '⛈️' },
};

// Season-based temperature ranges (Fahrenheit) for Pacific Northwest
const SEASON_TEMP_RANGES: Record<string, { high: [number, number]; low: [number, number] }> = {
  'Full Winter': { high: [35, 45], low: [25, 35] },
  'Late Winter': { high: [40, 50], low: [30, 40] },
  'Early Spring': { high: [50, 60], low: [35, 45] },
  'Full Spring': { high: [55, 68], low: [40, 50] },
  'Late Spring': { high: [62, 75], low: [45, 55] },
  'Early Summer': { high: [70, 82], low: [52, 62] },
  'Full Summer': { high: [78, 92], low: [58, 68] },
  'Late Summer': { high: [72, 85], low: [55, 65] },
  'Early Autumn': { high: [60, 72], low: [45, 55] },
  'Full Autumn': { high: [50, 62], low: [38, 48] },
  'Late Autumn': { high: [42, 52], low: [32, 42] },
  'Early Winter': { high: [38, 48], low: [28, 38] },
};

// Weather probability weights by season (higher = more likely)
const SEASON_WEATHER_WEIGHTS: Record<string, Record<string, number>> = {
  'Full Winter': { clear: 10, 'partly-cloudy': 15, cloudy: 20, overcast: 25, rain: 15, snow: 25, 'heavy-snow': 10, fog: 15, sleet: 8 },
  'Late Winter': { clear: 15, 'partly-cloudy': 20, cloudy: 20, overcast: 20, rain: 25, drizzle: 15, snow: 15, fog: 15 },
  'Early Spring': { clear: 20, 'partly-cloudy': 25, cloudy: 20, overcast: 15, rain: 30, drizzle: 20, fog: 10 },
  'Full Spring': { clear: 30, 'partly-cloudy': 30, cloudy: 15, rain: 25, drizzle: 15, thunderstorm: 5 },
  'Late Spring': { clear: 35, 'partly-cloudy': 30, cloudy: 15, rain: 20, drizzle: 10, thunderstorm: 8 },
  'Early Summer': { clear: 45, 'partly-cloudy': 30, cloudy: 10, rain: 10, thunderstorm: 5 },
  'Full Summer': { clear: 55, 'partly-cloudy': 25, cloudy: 8, rain: 5, thunderstorm: 7 },
  'Late Summer': { clear: 45, 'partly-cloudy': 30, cloudy: 12, rain: 10, thunderstorm: 5, fog: 5 },
  'Early Autumn': { clear: 30, 'partly-cloudy': 25, cloudy: 20, overcast: 15, rain: 25, drizzle: 15, fog: 15 },
  'Full Autumn': { clear: 20, 'partly-cloudy': 20, cloudy: 25, overcast: 20, rain: 30, drizzle: 20, fog: 20 },
  'Late Autumn': { clear: 15, 'partly-cloudy': 15, cloudy: 25, overcast: 25, rain: 30, drizzle: 15, fog: 20, sleet: 5 },
  'Early Winter': { clear: 12, 'partly-cloudy': 15, cloudy: 22, overcast: 25, rain: 20, snow: 20, fog: 18, sleet: 8 },
};

// Wind directions
const WIND_DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

// Atmospheric descriptions for flavor
const ATMOSPHERIC_DESCRIPTIONS: Record<string, string[]> = {
  clear: [
    'The sky stretches endlessly blue above the valley.',
    'Sunlight filters golden through the trees.',
    'A perfect day unfolds across the wilderness.',
    'The air is crisp and visibility extends for miles.',
    'Stars will shine brilliantly tonight.',
  ],
  'partly-cloudy': [
    'Clouds drift lazily across an otherwise pleasant sky.',
    'Patches of sunlight play across the landscape.',
    'The sky tells a story of coming change.',
    'Shadows chase light across the meadows.',
  ],
  cloudy: [
    'A blanket of clouds mutes the daylight.',
    'The sky hangs heavy and grey.',
    'Diffused light softens the edges of the world.',
    'The clouds promise nothing, reveal nothing.',
  ],
  overcast: [
    'The sky is a uniform grey canvas.',
    'Low clouds press down upon the valley.',
    'The world feels smaller beneath the heavy sky.',
    'Not a patch of blue to be found today.',
  ],
  rain: [
    'Rain patters steadily against leaf and stone.',
    'The forest drinks deeply of the sky\'s offering.',
    'Puddles form in the familiar hollows.',
    'The scent of wet earth rises from the ground.',
  ],
  'heavy-rain': [
    'Rain sheets down in silver curtains.',
    'The deluge turns paths to streams.',
    'Thunder of rainfall drowns out distant sounds.',
    'Seek shelter—this storm means business.',
  ],
  drizzle: [
    'A fine mist hangs in the air.',
    'The rain is more suggestion than statement.',
    'Droplets cling to fur and leaf alike.',
    'The world is soft and damp.',
  ],
  snow: [
    'Snowflakes drift down like frozen whispers.',
    'The world transforms beneath a white blanket.',
    'Each branch bears its burden of snow.',
    'Tracks tell stories in the fresh powder.',
  ],
  'heavy-snow': [
    'The blizzard howls through the valley.',
    'Snow falls so thick the trees vanish.',
    'The world becomes a white void.',
    'Travel is treacherous in this weather.',
  ],
  fog: [
    'Mist curls between the trees like ghostly rivers.',
    'The fog swallows distance and sound alike.',
    'Familiar landmarks emerge suddenly from the grey.',
    'The world has shrunk to arm\'s reach.',
  ],
  thunderstorm: [
    'Lightning splits the sky above the peaks.',
    'Thunder rolls across the valley like a living thing.',
    'The storm\'s fury is magnificent and terrible.',
    'Rain and wind conspire against all who venture out.',
  ],
  sleet: [
    'Ice and rain mix in a miserable combination.',
    'The sleet stings exposed skin.',
    'Everything becomes slick and treacherous.',
    'Neither snow nor rain, but somehow worse.',
  ],
};

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Horizon calendar constants
const EPOCH_DATE = new Date('2025-08-23T00:00:00');
const DAYS_PER_PHASE = 28;
const DAYS_PER_WEEK = 7;
const PHASES_PER_YEAR = 12;

/**
 * Calculate moon phase for a given date
 * Based on a known new moon: January 6, 2000
 */
export function getMoonPhase(date: Date): MoonPhase {
  const LUNAR_CYCLE = 29.53058867; // days
  const KNOWN_NEW_MOON = new Date('2000-01-06T00:00:00Z');
  
  const daysSinceNewMoon = (date.getTime() - KNOWN_NEW_MOON.getTime()) / (24 * 60 * 60 * 1000);
  const currentCycleDay = ((daysSinceNewMoon % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE;
  
  // Calculate illumination (0 at new, 100 at full)
  const illumination = Math.round((1 - Math.cos(2 * Math.PI * currentCycleDay / LUNAR_CYCLE)) / 2 * 100);
  
  // Days until full (around day 14.76) and new (day 0 or 29.53)
  const daysUntilFull = currentCycleDay < LUNAR_CYCLE / 2 
    ? Math.round(LUNAR_CYCLE / 2 - currentCycleDay)
    : Math.round(LUNAR_CYCLE + LUNAR_CYCLE / 2 - currentCycleDay);
  const daysUntilNew = Math.round(LUNAR_CYCLE - currentCycleDay);
  
  // Determine phase name and icon
  let name: string;
  let icon: string;
  
  if (currentCycleDay < 1.85) {
    name = 'New Moon';
    icon = '🌑';
  } else if (currentCycleDay < 7.38) {
    name = 'Waxing Crescent';
    icon = '🌒';
  } else if (currentCycleDay < 9.23) {
    name = 'First Quarter';
    icon = '🌓';
  } else if (currentCycleDay < 14.76) {
    name = 'Waxing Gibbous';
    icon = '🌔';
  } else if (currentCycleDay < 16.61) {
    name = 'Full Moon';
    icon = '🌕';
  } else if (currentCycleDay < 22.14) {
    name = 'Waning Gibbous';
    icon = '🌖';
  } else if (currentCycleDay < 23.99) {
    name = 'Third Quarter';
    icon = '🌗';
  } else {
    name = 'Waning Crescent';
    icon = '🌘';
  }
  
  return { name, illumination, icon, daysUntilFull, daysUntilNew };
}

/**
 * Get the Horizon week info for a given date
 * Returns which season phase and which week (1-4) within that phase
 */
interface HorizonWeekInfo {
  phaseIndex: number;        // 0-11
  phaseName: string;
  weekInPhase: number;       // 1-4
  year: number;
  globalWeekIndex: number;   // Total weeks since epoch
  weekStartDate: Date;       // First day of this Horizon week
}

function getHorizonWeekInfo(date: Date = new Date()): HorizonWeekInfo {
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysSinceEpoch = Math.floor((date.getTime() - EPOCH_DATE.getTime()) / msPerDay);
  
  // Handle dates before epoch
  if (daysSinceEpoch < 0) {
    return {
      phaseIndex: 0,
      phaseName: SEASON_PHASES[0].name,
      weekInPhase: 1,
      year: 0,
      globalWeekIndex: 0,
      weekStartDate: EPOCH_DATE,
    };
  }
  
  // Calculate global week index (weeks since epoch)
  const globalWeekIndex = Math.floor(daysSinceEpoch / DAYS_PER_WEEK);
  
  // Calculate year, phase, and week within phase
  const daysPerYear = DAYS_PER_PHASE * PHASES_PER_YEAR;
  const year = Math.floor(daysSinceEpoch / daysPerYear);
  const dayInYear = daysSinceEpoch % daysPerYear;
  const phaseIndex = Math.floor(dayInYear / DAYS_PER_PHASE);
  const dayInPhase = dayInYear % DAYS_PER_PHASE;
  const weekInPhase = Math.floor(dayInPhase / DAYS_PER_WEEK) + 1; // 1-indexed
  
  // Calculate the start date of this Horizon week
  const weekStartDayInPhase = (weekInPhase - 1) * DAYS_PER_WEEK;
  const weekStartDaysSinceEpoch = year * daysPerYear + phaseIndex * DAYS_PER_PHASE + weekStartDayInPhase;
  const weekStartDate = new Date(EPOCH_DATE.getTime() + weekStartDaysSinceEpoch * msPerDay);
  
  return {
    phaseIndex,
    phaseName: SEASON_PHASES[phaseIndex].name,
    weekInPhase,
    year,
    globalWeekIndex,
    weekStartDate,
  };
}

/**
 * Get Horizon week info by global week index (for going back in history)
 */
function getHorizonWeekByIndex(globalWeekIndex: number): HorizonWeekInfo {
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysSinceEpoch = globalWeekIndex * DAYS_PER_WEEK;
  
  if (daysSinceEpoch < 0) {
    return {
      phaseIndex: 0,
      phaseName: SEASON_PHASES[0].name,
      weekInPhase: 1,
      year: 0,
      globalWeekIndex: 0,
      weekStartDate: EPOCH_DATE,
    };
  }
  
  const daysPerYear = DAYS_PER_PHASE * PHASES_PER_YEAR;
  const year = Math.floor(daysSinceEpoch / daysPerYear);
  const dayInYear = daysSinceEpoch % daysPerYear;
  const phaseIndex = Math.floor(dayInYear / DAYS_PER_PHASE);
  const dayInPhase = dayInYear % DAYS_PER_PHASE;
  const weekInPhase = Math.floor(dayInPhase / DAYS_PER_WEEK) + 1;
  
  const weekStartDayInPhase = (weekInPhase - 1) * DAYS_PER_WEEK;
  const weekStartDaysSinceEpoch = year * daysPerYear + phaseIndex * DAYS_PER_PHASE + weekStartDayInPhase;
  const weekStartDate = new Date(EPOCH_DATE.getTime() + weekStartDaysSinceEpoch * msPerDay);
  
  return {
    phaseIndex,
    phaseName: SEASON_PHASES[phaseIndex].name,
    weekInPhase,
    year,
    globalWeekIndex,
    weekStartDate,
  };
}

/**
 * Select weather type based on weighted probabilities
 */
function selectWeather(rand: () => number, weights: Record<string, number>): string {
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  let random = rand() * totalWeight;
  
  for (const [type, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) return type;
  }
  
  return 'cloudy'; // fallback
}

/**
 * Generate weather for a specific day
 */
function generateDayWeather(date: Date, seasonPhase: string, rand: () => number): DailyWeather {
  const tempRange = SEASON_TEMP_RANGES[seasonPhase] || SEASON_TEMP_RANGES['Full Spring'];
  const weatherWeights = SEASON_WEATHER_WEIGHTS[seasonPhase] || SEASON_WEATHER_WEIGHTS['Full Spring'];
  
  // Generate temperatures with some randomness
  const highBase = tempRange.high[0] + rand() * (tempRange.high[1] - tempRange.high[0]);
  const lowBase = tempRange.low[0] + rand() * (tempRange.low[1] - tempRange.low[0]);
  
  // Add daily variation
  const highTemp = Math.round(highBase + (rand() - 0.5) * 8);
  const lowTemp = Math.round(Math.min(lowBase + (rand() - 0.5) * 6, highTemp - 5));
  
  // Select weather condition
  const weatherType = selectWeather(rand, weatherWeights);
  const condition = WEATHER_CONDITIONS[weatherType] || WEATHER_CONDITIONS.cloudy;
  
  // Wind
  const windSpeed = Math.round(rand() * 15 + (weatherType.includes('storm') ? 15 : 0));
  const windDirection = WIND_DIRECTIONS[Math.floor(rand() * WIND_DIRECTIONS.length)];
  
  // Precipitation chance
  const precipTypes = ['rain', 'heavy-rain', 'drizzle', 'snow', 'heavy-snow', 'sleet', 'thunderstorm'];
  const precipitation = precipTypes.includes(weatherType) 
    ? Math.round(60 + rand() * 40)
    : Math.round(rand() * 20);
  
  // Humidity
  const humidity = Math.round(40 + rand() * 40 + (precipTypes.includes(weatherType) ? 20 : 0));
  
  // Atmospheric description
  const descriptions = ATMOSPHERIC_DESCRIPTIONS[weatherType] || ATMOSPHERIC_DESCRIPTIONS.cloudy;
  const description = descriptions[Math.floor(rand() * descriptions.length)];
  
  return {
    date,
    dayOfWeek: DAYS_OF_WEEK[date.getDay()],
    highTemp,
    lowTemp,
    condition,
    windSpeed,
    windDirection,
    precipitation,
    humidity,
    description,
  };
}

/**
 * Generate weekly weather report based on Horizon week
 */
export function getWeeklyWeather(weekInfo?: HorizonWeekInfo): WeeklyWeather {
  // Get current Horizon week if not provided
  const info = weekInfo || getHorizonWeekInfo();
  
  // Create seeded random generator for this week (using global week index)
  const rand = seededRandom(info.globalWeekIndex * 12345 + 67890);
  
  // Generate 7 days of weather starting from the Horizon week start
  const days: DailyWeather[] = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(info.weekStartDate);
    dayDate.setDate(info.weekStartDate.getDate() + i);
    days.push(generateDayWeather(dayDate, info.phaseName, rand));
  }
  
  // Generate week summary
  const avgHigh = Math.round(days.reduce((sum, d) => sum + d.highTemp, 0) / 7);
  const avgLow = Math.round(days.reduce((sum, d) => sum + d.lowTemp, 0) / 7);
  const rainyDays = days.filter(d => ['rain', 'heavy-rain', 'drizzle', 'snow', 'heavy-snow', 'sleet', 'thunderstorm'].includes(d.condition.type)).length;
  
  let weekSummary = `Expect highs around ${avgHigh}°F and lows near ${avgLow}°F. `;
  if (rainyDays === 0) {
    weekSummary += 'A dry week ahead with no precipitation expected.';
  } else if (rainyDays <= 2) {
    weekSummary += `A mostly dry week with ${rainyDays} day${rainyDays > 1 ? 's' : ''} of precipitation.`;
  } else if (rainyDays <= 4) {
    weekSummary += `Mixed conditions with ${rainyDays} days of precipitation expected.`;
  } else {
    weekSummary += `A wet week ahead with precipitation expected on ${rainyDays} days.`;
  }
  
  // Get moon phase for mid-week
  const midWeek = new Date(info.weekStartDate);
  midWeek.setDate(info.weekStartDate.getDate() + 3);
  const moonPhase = getMoonPhase(midWeek);
  
  const weekLabel = `${info.phaseName} Week ${info.weekInPhase}`;
  
  return {
    weekNumber: info.weekInPhase,
    seasonPhase: info.phaseName,
    seasonPhaseIndex: info.phaseIndex,
    horizonYear: info.year,
    weekLabel,
    days,
    weekSummary,
    moonPhase,
    globalWeekIndex: info.globalWeekIndex,
  };
}

/**
 * Get weather history (past Horizon weeks)
 */
export function getWeatherHistory(weeksBack: number = 4): WeeklyWeather[] {
  const history: WeeklyWeather[] = [];
  const currentWeekInfo = getHorizonWeekInfo();
  
  for (let i = 0; i <= weeksBack; i++) {
    const weekIndex = currentWeekInfo.globalWeekIndex - i;
    if (weekIndex >= 0) {
      const weekInfo = getHorizonWeekByIndex(weekIndex);
      history.push(getWeeklyWeather(weekInfo));
    }
  }
  
  return history;
}
