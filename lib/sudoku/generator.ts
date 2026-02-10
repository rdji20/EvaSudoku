import { Grid } from './types';
import { solve, countSolutions, logicOnlySolve } from './solver';

// Generate a complete, valid solved grid
export function generateSolvedGrid(): Grid {
  const empty = new Array(81).fill(0);
  return solve(empty, true)!;
}

// Generate a hard puzzle
// Returns { puzzle, solution } or null if generation fails
export function generateHardPuzzle(
  targetClues = 28,
  maxAttempts = 50
): { puzzle: Grid; solution: Grid } | null {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = tryGeneratePuzzle(targetClues);
    if (result) return result;
  }
  return null;
}

function tryGeneratePuzzle(
  targetClues: number
): { puzzle: Grid; solution: Grid } | null {
  const solution = generateSolvedGrid();
  const puzzle = [...solution];

  // Indices to try removing, in random order
  const indices = Array.from({ length: 81 }, (_, i) => i);
  shuffle(indices);

  let clueCount = 81;

  for (const idx of indices) {
    if (clueCount <= targetClues) break;

    const backup = puzzle[idx];
    puzzle[idx] = 0;

    // Check uniqueness
    if (countSolutions(puzzle, 2) !== 1) {
      puzzle[idx] = backup; // revert
      continue;
    }

    clueCount--;
  }

  // Reject if we couldn't remove enough clues
  if (clueCount > targetClues + 2) return null;

  // Hardness check: reject if logic-only (naked + hidden singles) solves it
  const { solved: tooEasy } = logicOnlySolve(puzzle);
  if (tooEasy) return null;

  return { puzzle, solution };
}

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
