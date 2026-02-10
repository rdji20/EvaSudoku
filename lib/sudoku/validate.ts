import { row, col, box } from './types';

// Returns boolean[81] where true = cell has a conflict
export function getConflicts(grid: number[]): boolean[] {
  const conflicts = new Array(81).fill(false);

  // Check rows, cols, boxes
  for (let i = 0; i < 81; i++) {
    if (grid[i] === 0) continue;
    for (let j = i + 1; j < 81; j++) {
      if (grid[j] === 0) continue;
      if (grid[i] !== grid[j]) continue;
      if (row(i) === row(j) || col(i) === col(j) || box(i) === box(j)) {
        conflicts[i] = true;
        conflicts[j] = true;
      }
    }
  }

  return conflicts;
}

// Check if the grid is completely and correctly filled
export function isSolved(given: number[], value: number[]): boolean {
  const merged = given.map((g, i) => g || value[i]);

  // All cells filled
  if (merged.some(v => v === 0)) return false;

  // No conflicts
  return !getConflicts(merged).some(Boolean);
}
