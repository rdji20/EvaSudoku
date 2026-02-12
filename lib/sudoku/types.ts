// Flat 81-length arrays for performance and easy serialization

export type Grid = number[]; // length 81, 0 = empty, 1-9 = filled

export type Notes = number[]; // length 81, bitmask of candidates (bits 1..9)
export type Difficulty = 'easy' | 'hard';

export interface GameState {
  given: number[];    // immutable clues (0 = not a clue)
  value: number[];    // user entries (0 = empty)
  notes: number[];    // bitmask per cell
  selected: number;   // 0..80
  noteMode: boolean;
  startedAt: number;  // epoch ms
  elapsed: number;    // seconds elapsed before current session
  solved: boolean;
}

export interface HistoryState {
  past: Pick<GameState, 'value' | 'notes'>[];
  present: Pick<GameState, 'value' | 'notes'>;
  future: Pick<GameState, 'value' | 'notes'>[];
}

export interface PersistedState {
  given: number[];
  value: number[];
  notes: number[];
  solution: number[];
  startedAt: number;
  elapsed: number;
  history: HistoryState;
  player: string;
  difficulty?: Difficulty;
}

// Index helpers
export const row = (i: number) => Math.floor(i / 9);
export const col = (i: number) => i % 9;
export const box = (i: number) => 3 * Math.floor(row(i) / 3) + Math.floor(col(i) / 3);
export const cellIndex = (r: number, c: number) => r * 9 + c;

// Peers: cells that share row, col, or box with cell i
const peersCache: number[][] = [];
export function peers(i: number): number[] {
  if (peersCache[i]) return peersCache[i];
  const r = row(i), c = col(i), b = box(i);
  const set = new Set<number>();
  for (let j = 0; j < 81; j++) {
    if (j !== i && (row(j) === r || col(j) === c || box(j) === b)) {
      set.add(j);
    }
  }
  peersCache[i] = Array.from(set);
  return peersCache[i];
}

// Units: row units, col units, box units
export function getRowCells(r: number): number[] {
  return Array.from({ length: 9 }, (_, c) => r * 9 + c);
}

export function getColCells(c: number): number[] {
  return Array.from({ length: 9 }, (_, r) => r * 9 + c);
}

export function getBoxCells(b: number): number[] {
  const startRow = Math.floor(b / 3) * 3;
  const startCol = (b % 3) * 3;
  const cells: number[] = [];
  for (let r = startRow; r < startRow + 3; r++) {
    for (let c = startCol; c < startCol + 3; c++) {
      cells.push(r * 9 + c);
    }
  }
  return cells;
}
