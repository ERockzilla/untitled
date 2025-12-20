/**
 * Core utilities for the Library of Babel concept
 * Handles address encoding/decoding and navigation
 */

/**
 * Generate a random address (hex string)
 * @param length - Number of hex characters (default 64 = 256 bits)
 */
export function randomAddress(length: number = 64): string {
  const bytes = new Uint8Array(length / 2);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Increment an address by 1
 */
export function incrementAddress(address: string): string {
  const bigint = BigInt('0x' + address) + 1n;
  return bigint.toString(16).padStart(address.length, '0');
}

/**
 * Decrement an address by 1
 */
export function decrementAddress(address: string): string {
  const bigint = BigInt('0x' + address);
  if (bigint === 0n) {
    // Wrap to max value
    return 'f'.repeat(address.length);
  }
  return (bigint - 1n).toString(16).padStart(address.length, '0');
}

/**
 * Jump to a nearby address (add offset)
 */
export function offsetAddress(address: string, offset: bigint): string {
  const bigint = BigInt('0x' + address) + offset;
  const max = (1n << BigInt(address.length * 4)) - 1n;
  const wrapped = ((bigint % (max + 1n)) + (max + 1n)) % (max + 1n);
  return wrapped.toString(16).padStart(address.length, '0');
}

/**
 * Validate an address string
 */
export function isValidAddress(address: string): boolean {
  return /^[0-9a-fA-F]+$/.test(address);
}

/**
 * Normalize an address (lowercase, pad to length)
 */
export function normalizeAddress(address: string, length: number = 64): string {
  const clean = address.toLowerCase().replace(/[^0-9a-f]/g, '');
  if (clean.length > length) {
    return clean.slice(-length);
  }
  return clean.padStart(length, '0');
}

/**
 * Format address for display (with ellipsis for long addresses)
 */
export function formatAddress(address: string, maxLength: number = 16): string {
  if (address.length <= maxLength) {
    return address;
  }
  const half = Math.floor((maxLength - 3) / 2);
  return `${address.slice(0, half)}...${address.slice(-half)}`;
}

/**
 * Calculate the "distance" between two addresses
 */
export function addressDistance(a: string, b: string): bigint {
  const bigA = BigInt('0x' + a);
  const bigB = BigInt('0x' + b);
  const diff = bigA > bigB ? bigA - bigB : bigB - bigA;
  return diff;
}

/**
 * Interpolate between two addresses
 * @param t - Value from 0 to 1
 */
export function interpolateAddress(from: string, to: string, t: number): string {
  const bigFrom = BigInt('0x' + from);
  const bigTo = BigInt('0x' + to);
  const diff = bigTo - bigFrom;
  const scaled = BigInt(Math.floor(Number(diff) * t));
  const result = bigFrom + scaled;
  return result.toString(16).padStart(from.length, '0');
}

/**
 * Address space statistics
 */
export function getAddressSpaceInfo(addressLength: number) {
  const bits = addressLength * 4;
  const totalCombinations = 2n ** BigInt(bits);
  
  return {
    bits,
    hexLength: addressLength,
    totalCombinations,
    // Approximate as string for display
    totalDisplay: totalCombinations > 10n ** 20n 
      ? `~10^${Math.floor(Math.log10(Number(totalCombinations)))}` 
      : totalCombinations.toString(),
  };
}

