/**
 * Seeded Pseudo-Random Number Generator
 * Uses a simple but effective mulberry32 algorithm
 * Deterministic: same seed always produces same sequence
 */

export type PRNG = () => number;

/**
 * Create a seeded random number generator
 * @param seed - Can be number, bigint, or hex string
 * @returns Function that returns random numbers between 0 and 1
 */
export function seededRandom(seed: number | bigint | string): PRNG {
  // Convert seed to a 32-bit integer
  let numSeed: number;
  
  if (typeof seed === 'string') {
    // Hash the string to a number
    numSeed = hashString(seed);
  } else if (typeof seed === 'bigint') {
    // Use lower 32 bits of bigint
    numSeed = Number(seed & BigInt(0xFFFFFFFF));
  } else {
    numSeed = Math.floor(seed);
  }
  
  // Mulberry32 PRNG
  return function() {
    numSeed |= 0;
    numSeed = (numSeed + 0x6D2B79F5) | 0;
    let t = Math.imul(numSeed ^ (numSeed >>> 15), 1 | numSeed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Hash a string to a 32-bit integer
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Generate a random integer in range [min, max] inclusive
 */
export function randomInt(prng: PRNG, min: number, max: number): number {
  return Math.floor(prng() * (max - min + 1)) + min;
}

/**
 * Pick a random element from an array
 */
export function randomPick<T>(prng: PRNG, array: T[]): T {
  return array[Math.floor(prng() * array.length)];
}

/**
 * Shuffle an array in place using Fisher-Yates
 */
export function shuffle<T>(prng: PRNG, array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generate a random hex color
 */
export function randomColor(prng: PRNG): string {
  const r = Math.floor(prng() * 256);
  const g = Math.floor(prng() * 256);
  const b = Math.floor(prng() * 256);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Generate a random color from a palette
 */
export function randomPaletteColor(prng: PRNG, palette: string[]): string {
  return palette[Math.floor(prng() * palette.length)];
}

