import { PersistedState, HistoryState } from './types';

const STORAGE_KEY = 'sudoku-game';

export function saveGame(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage might be full or unavailable
  }
}

export function loadGame(): PersistedState | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    // Basic validation
    if (
      parsed &&
      Array.isArray(parsed.given) &&
      parsed.given.length === 81 &&
      Array.isArray(parsed.value) &&
      parsed.value.length === 81
    ) {
      return parsed as PersistedState;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearGame(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function createInitialHistory(value: number[], notes: number[]): HistoryState {
  return {
    past: [],
    present: { value: [...value], notes: [...notes] },
    future: [],
  };
}

export function pushHistory(history: HistoryState, value: number[], notes: number[]): HistoryState {
  return {
    past: [...history.past, history.present],
    present: { value: [...value], notes: [...notes] },
    future: [],
  };
}

export function undo(history: HistoryState): { history: HistoryState; value: number[]; notes: number[] } | null {
  if (history.past.length === 0) return null;
  const prev = history.past[history.past.length - 1];
  return {
    history: {
      past: history.past.slice(0, -1),
      present: prev,
      future: [history.present, ...history.future],
    },
    value: [...prev.value],
    notes: [...prev.notes],
  };
}

export function redo(history: HistoryState): { history: HistoryState; value: number[]; notes: number[] } | null {
  if (history.future.length === 0) return null;
  const next = history.future[0];
  return {
    history: {
      past: [...history.past, history.present],
      present: next,
      future: history.future.slice(1),
    },
    value: [...next.value],
    notes: [...next.notes],
  };
}
