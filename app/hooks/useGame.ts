'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Difficulty,
  GameState,
  HistoryState,
  PersistedState,
  generateEasyPuzzle,
  getConflicts,
  isSolved,
  generateHardPuzzle,
  saveGame,
  loadGame,
  clearGame,
  createInitialHistory,
  pushHistory,
  undo as undoHistory,
  redo as redoHistory,
} from '@/lib/sudoku';

export type Screen = 'start' | 'loading' | 'playing';

export interface UseGameReturn {
  screen: Screen;
  player: string;
  difficulty: Difficulty;
  gameState: GameState;
  conflicts: boolean[];
  history: HistoryState;
  digitCounts: number[];
  solution: number[];
  savedGame: { player: string } | null;
  selectCell: (index: number) => void;
  enterDigit: (digit: number) => void;
  erase: () => void;
  toggleNotes: () => void;
  undo: () => void;
  redo: () => void;
  newGame: () => void;
  fillSolution: () => void;
  goHome: () => void;
  startGame: (player: string, difficulty: Difficulty) => void;
  resumeGame: () => void;
}

function computeDigitCounts(given: number[], value: number[]): number[] {
  const counts = new Array(10).fill(0);
  for (let i = 0; i < 81; i++) {
    const v = given[i] || value[i];
    if (v) counts[v]++;
  }
  return counts;
}

const emptyState: GameState = {
  given: new Array(81).fill(0),
  value: new Array(81).fill(0),
  notes: new Array(81).fill(0),
  selected: 40,
  noteMode: false,
  startedAt: Date.now(),
  elapsed: 0,
  solved: false,
};

export function useGame(): UseGameReturn {
  const [screen, setScreen] = useState<Screen>('start');
  const [player, setPlayer] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');
  const [gameState, setGameState] = useState<GameState>(emptyState);
  const [solution, setSolution] = useState<number[]>(new Array(81).fill(0));
  const [history, setHistory] = useState<HistoryState>(
    createInitialHistory(new Array(81).fill(0), new Array(81).fill(0))
  );
  const [savedGame, setSavedGame] = useState<{ player: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check for saved game on mount
  useEffect(() => {
    const saved = loadGame();
    if (saved && saved.player) {
      const solved = isSolved(saved.given, saved.value);
      if (!solved) {
        setSavedGame({ player: saved.player });
      }
    }
  }, []);

  // Timer — only runs on 'playing' screen and not solved
  useEffect(() => {
    if (screen !== 'playing' || gameState.solved) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setGameState(prev => {
        if (prev.solved) return prev;
        return { ...prev, elapsed: prev.elapsed + 1 };
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen, gameState.solved]);

  // Persist on changes (only when playing)
  useEffect(() => {
    if (screen !== 'playing') return;
    saveGame({
      given: gameState.given,
      value: gameState.value,
      notes: gameState.notes,
      solution,
      startedAt: gameState.startedAt,
      elapsed: gameState.elapsed,
      history,
      player,
      difficulty,
    });
  }, [screen, gameState.given, gameState.value, gameState.notes, gameState.elapsed, solution, history, player, difficulty]);

  const loadFromSaved = useCallback((saved: PersistedState) => {
    const solved = isSolved(saved.given, saved.value);
    setPlayer(saved.player);
    setDifficulty(saved.difficulty ?? 'hard');
    setGameState({
      given: saved.given,
      value: saved.value,
      notes: saved.notes,
      selected: 40,
      noteMode: false,
      startedAt: saved.startedAt,
      elapsed: saved.elapsed,
      solved,
    });
    setSolution(saved.solution);
    if (saved.history) {
      setHistory(saved.history);
    } else {
      setHistory(createInitialHistory(saved.value, saved.notes));
    }
    setScreen('playing');
  }, []);

  const generateNewGame = useCallback((forPlayer: string, forDifficulty: Difficulty) => {
    setScreen('loading');
    setPlayer(forPlayer);
    setDifficulty(forDifficulty);
    setTimeout(() => {
      const final = forDifficulty === 'easy'
        ? (generateEasyPuzzle(40, 100) || generateEasyPuzzle(42, 200))
        : (generateHardPuzzle(28, 100) || generateHardPuzzle(30, 200));
      if (final) {
        const { puzzle, solution: sol } = final;
        const emptyValue = new Array(81).fill(0);
        const emptyNotes = new Array(81).fill(0);
        setGameState({
          given: puzzle,
          value: emptyValue,
          notes: emptyNotes,
          selected: 40,
          noteMode: false,
          startedAt: Date.now(),
          elapsed: 0,
          solved: false,
        });
        setSolution(sol);
        setHistory(createInitialHistory(emptyValue, emptyNotes));
      }
      setScreen('playing');
    }, 50);
  }, []);

  const goHome = useCallback(() => {
    setScreen('start');
    // Re-check for saved game so the resume button is accurate
    const saved = loadGame();
    if (saved && saved.player && !isSolved(saved.given, saved.value)) {
      setSavedGame({ player: saved.player });
    }
  }, []);

  // Start a fresh game for a player
  const startGame = useCallback((selectedPlayer: string, selectedDifficulty: Difficulty) => {
    clearGame();
    generateNewGame(selectedPlayer, selectedDifficulty);
  }, [generateNewGame]);

  // Resume an existing saved game
  const resumeGame = useCallback(() => {
    const saved = loadGame();
    if (saved) {
      loadFromSaved(saved);
    }
  }, [loadFromSaved]);

  // New game while already playing (keeps current player)
  const newGame = useCallback(() => {
    clearGame();
    generateNewGame(player, difficulty);
  }, [generateNewGame, player, difficulty]);

  const fillSolution = useCallback(() => {
    setGameState(prev => {
      const newValue = solution.map((s, i) => prev.given[i] ? 0 : s);
      setHistory(h => pushHistory(h, newValue, prev.notes));
      return { ...prev, value: newValue, notes: new Array(81).fill(0), solved: true };
    });
  }, [solution]);

  const selectCell = useCallback((index: number) => {
    setGameState(prev => ({ ...prev, selected: index }));
  }, []);

  const enterDigit = useCallback((digit: number) => {
    setGameState(prev => {
      if (prev.solved) return prev;
      const idx = prev.selected;
      if (prev.given[idx] !== 0) return prev;

      if (prev.noteMode) {
        const newNotes = [...prev.notes];
        newNotes[idx] ^= (1 << digit);
        const newValue = [...prev.value];
        newValue[idx] = 0;
        setHistory(h => pushHistory(h, newValue, newNotes));
        return { ...prev, value: newValue, notes: newNotes };
      } else {
        const newValue = [...prev.value];
        if (newValue[idx] === digit) {
          newValue[idx] = 0;
        } else {
          newValue[idx] = digit;
        }
        const newNotes = [...prev.notes];
        newNotes[idx] = 0;
        const solved = isSolved(prev.given, newValue);
        setHistory(h => pushHistory(h, newValue, newNotes));
        return { ...prev, value: newValue, notes: newNotes, solved };
      }
    });
  }, []);

  const erase = useCallback(() => {
    setGameState(prev => {
      if (prev.solved) return prev;
      const idx = prev.selected;
      if (prev.given[idx] !== 0) return prev;

      const newValue = [...prev.value];
      const newNotes = [...prev.notes];
      newValue[idx] = 0;
      newNotes[idx] = 0;
      setHistory(h => pushHistory(h, newValue, newNotes));
      return { ...prev, value: newValue, notes: newNotes };
    });
  }, []);

  const toggleNotes = useCallback(() => {
    setGameState(prev => ({ ...prev, noteMode: !prev.noteMode }));
  }, []);

  const undo = useCallback(() => {
    setHistory(prev => {
      const result = undoHistory(prev);
      if (!result) return prev;
      setGameState(gs => ({
        ...gs,
        value: result.value,
        notes: result.notes,
        solved: isSolved(gs.given, result.value),
      }));
      return result.history;
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(prev => {
      const result = redoHistory(prev);
      if (!result) return prev;
      setGameState(gs => ({
        ...gs,
        value: result.value,
        notes: result.notes,
        solved: isSolved(gs.given, result.value),
      }));
      return result.history;
    });
  }, []);

  const merged = gameState.given.map((g, i) => g || gameState.value[i]);
  const conflicts = getConflicts(merged);
  const digitCounts = computeDigitCounts(gameState.given, gameState.value);

  return {
    screen,
    player,
    difficulty,
    gameState,
    conflicts,
    history,
    digitCounts,
    solution,
    savedGame,
    selectCell,
    enterDigit,
    erase,
    toggleNotes,
    undo,
    redo,
    newGame,
    fillSolution,
    goHome,
    startGame,
    resumeGame,
  };
}
