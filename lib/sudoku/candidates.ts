import { Grid, peers } from './types';

// Returns bitmask of candidates for cell i in the grid
export function getCandidates(grid: Grid, i: number): number {
  if (grid[i] !== 0) return 0;
  let used = 0;
  for (const p of peers(i)) {
    if (grid[p] !== 0) {
      used |= (1 << grid[p]);
    }
  }
  // Return bits 1-9 that are NOT used
  let candidates = 0;
  for (let d = 1; d <= 9; d++) {
    if (!(used & (1 << d))) {
      candidates |= (1 << d);
    }
  }
  return candidates;
}

// Count bits set in a bitmask
export function bitCount(mask: number): number {
  let count = 0;
  while (mask) {
    count += mask & 1;
    mask >>= 1;
  }
  return count;
}

// Extract digits from bitmask
export function bitsToDigits(mask: number): number[] {
  const digits: number[] = [];
  for (let d = 1; d <= 9; d++) {
    if (mask & (1 << d)) digits.push(d);
  }
  return digits;
}
