import { Grid } from './types';
import { getCandidates, bitCount, bitsToDigits } from './candidates';

// Solve using backtracking with MRV (Minimum Remaining Values) heuristic
// randomize: if true, try candidates in random order (for generation)
export function solve(grid: Grid, randomize = false): Grid | null {
  const g = [...grid];
  if (solveInPlace(g, randomize)) return g;
  return null;
}

function solveInPlace(grid: Grid, randomize: boolean): boolean {
  // Find empty cell with fewest candidates (MRV)
  let minCount = 10;
  let minIdx = -1;
  let minCandidates = 0;

  for (let i = 0; i < 81; i++) {
    if (grid[i] === 0) {
      const cands = getCandidates(grid, i);
      const count = bitCount(cands);
      if (count === 0) return false; // dead end
      if (count < minCount) {
        minCount = count;
        minIdx = i;
        minCandidates = cands;
        if (count === 1) break; // can't do better
      }
    }
  }

  if (minIdx === -1) return true; // all filled = solved

  let digits = bitsToDigits(minCandidates);
  if (randomize) {
    // Fisher-Yates shuffle
    for (let i = digits.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [digits[i], digits[j]] = [digits[j], digits[i]];
    }
  }

  for (const d of digits) {
    grid[minIdx] = d;
    if (solveInPlace(grid, randomize)) return true;
    grid[minIdx] = 0;
  }

  return false;
}

// Count solutions up to limit (for uniqueness checking)
export function countSolutions(grid: Grid, limit = 2): number {
  const g = [...grid];
  let count = 0;

  function search(): boolean {
    // Find empty cell with fewest candidates (MRV)
    let minCount = 10;
    let minIdx = -1;
    let minCandidates = 0;

    for (let i = 0; i < 81; i++) {
      if (g[i] === 0) {
        const cands = getCandidates(g, i);
        const cnt = bitCount(cands);
        if (cnt === 0) return false;
        if (cnt < minCount) {
          minCount = cnt;
          minIdx = i;
          minCandidates = cands;
          if (cnt === 1) break;
        }
      }
    }

    if (minIdx === -1) {
      count++;
      return count >= limit; // stop early if we've found enough
    }

    const digits = bitsToDigits(minCandidates);
    for (const d of digits) {
      g[minIdx] = d;
      if (search()) return true;
      g[minIdx] = 0;
    }

    return false;
  }

  search();
  return count;
}

// Logic-only solver: uses naked singles + hidden singles
// Returns how many cells it can fill without guessing
export function logicOnlySolve(grid: Grid): { solved: boolean; filled: number } {
  const g = [...grid];
  let changed = true;
  let totalFilled = 0;

  while (changed) {
    changed = false;

    // Naked singles: cells with exactly one candidate
    for (let i = 0; i < 81; i++) {
      if (g[i] === 0) {
        const cands = getCandidates(g, i);
        if (bitCount(cands) === 1) {
          g[i] = bitsToDigits(cands)[0];
          totalFilled++;
          changed = true;
        }
      }
    }

    // Hidden singles: digit that can only go in one place in a unit
    for (let unit = 0; unit < 27; unit++) {
      const cells = getUnitCells(unit);
      for (let d = 1; d <= 9; d++) {
        // Check if d is already placed in this unit
        let placed = false;
        let possibleIdx = -1;
        let possibleCount = 0;

        for (const idx of cells) {
          if (g[idx] === d) { placed = true; break; }
          if (g[idx] === 0 && (getCandidates(g, idx) & (1 << d))) {
            possibleCount++;
            possibleIdx = idx;
          }
        }

        if (!placed && possibleCount === 1 && possibleIdx !== -1) {
          g[possibleIdx] = d;
          totalFilled++;
          changed = true;
        }
      }
    }
  }

  const isSolved = g.every(v => v !== 0);
  return { solved: isSolved, filled: totalFilled };
}

// Get cells for unit index (0-8: rows, 9-17: cols, 18-26: boxes)
function getUnitCells(unit: number): number[] {
  const cells: number[] = [];
  if (unit < 9) {
    // Row
    for (let c = 0; c < 9; c++) cells.push(unit * 9 + c);
  } else if (unit < 18) {
    // Col
    const c = unit - 9;
    for (let r = 0; r < 9; r++) cells.push(r * 9 + c);
  } else {
    // Box
    const b = unit - 18;
    const startRow = Math.floor(b / 3) * 3;
    const startCol = (b % 3) * 3;
    for (let r = startRow; r < startRow + 3; r++) {
      for (let c = startCol; c < startCol + 3; c++) {
        cells.push(r * 9 + c);
      }
    }
  }
  return cells;
}
