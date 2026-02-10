# Architecture

## Overview

The app is split into two layers: a pure logic engine (`lib/sudoku/`) and a React UI (`app/`). The engine has zero React dependencies and can be tested or used independently.

## Project Structure

```
lib/sudoku/          # Pure game logic (no React)
  types.ts           # Grid types, index helpers, peer/unit lookups
  candidates.ts      # Candidate computation (bitmask-based)
  solver.ts          # Backtracking solver, solution counter, logic-only solver
  generator.ts       # Puzzle generation pipeline
  validate.ts        # Conflict detection, solved-state check
  serialize.ts       # localStorage persistence, undo/redo history

app/
  page.tsx           # Main page — routes between start/loading/playing screens
  hooks/useGame.ts   # All game state, actions, and side effects
  components/
    StartScreen.tsx   # Player selection + Eva password gate
    SudokuBoard.tsx   # 9x9 grid rendering
    Cell.tsx          # Individual cell (value, notes, highlighting)
    Numpad.tsx        # Digit buttons with remaining counts
    Toolbar.tsx       # Undo/redo, notes toggle, timer, new game
    Celebration.tsx   # Win screen (tulip for Eva, emojis for Guest)
```

## Key Decisions

### Data Model: Flat 81-length arrays

All grids are `number[]` of length 81. Index `i` maps to row `Math.floor(i/9)`, column `i % 9`. This is fast, serializable, and makes undo/redo trivial (just snapshot the array).

Notes use a **bitmask per cell** — bit `d` (1-9) is set if digit `d` is penciled in. Toggle is `notes[i] ^= (1 << d)`, check is `notes[i] & (1 << d)`.

### Solver: Backtracking with MRV

The solver picks the empty cell with the **fewest candidates** (Minimum Remaining Values heuristic), which dramatically prunes the search tree. For generation, candidates are shuffled randomly so each solve of an empty grid produces a different valid solution.

### Uniqueness Check

`countSolutions(grid, limit=2)` runs the same backtracking solver but counts solutions instead of returning the first one. It bails as soon as it finds 2. This runs after every clue removal during generation.

### Puzzle Generation Pipeline

1. **Generate a solved grid** — solve an empty 81-cell grid with randomized candidate order
2. **Remove clues** — shuffle all 81 indices, try removing each one; revert if uniqueness breaks
3. **Hardness filter** — run a logic-only solver (naked singles + hidden singles only); if it solves the puzzle completely, reject it as too easy
4. Target ~28 clues. Fallback to ~30 if generation is struggling.

This produces puzzles that require techniques beyond basic singles (pairs, box/line interactions, etc.) without needing a full human-strategy engine.

### State Management: Single `useGame` Hook

All game state lives in one hook (`useGame.ts`) that manages:
- `screen` — which view is active (`start` | `loading` | `playing`)
- `gameState` — the current board, selection, notes, timer, solved flag
- `history` — past/present/future snapshots for undo/redo
- `solution` — stored at generation time for the reveal easter egg

Every user action (digit entry, erase, note toggle) is a pure function that produces a new state snapshot, which gets pushed onto the history stack.

### Persistence

A `PersistedState` object (given, value, notes, solution, elapsed, history, player) is saved to `localStorage` on every change. On load, the start screen checks for a saved game and offers a "Continue" option.

### Player System

Two modes: **Eva** (password-protected with hardcoded password) and **Guest**. The player name is:
- Stored in the persisted save
- Shown in the game header
- Used to determine the celebration screen style
- Required for resume (resuming Eva's game requires the password)

### Easter Egg

The "Reveal solution" mini-grid at the bottom of the game screen is secretly clickable. Clicking it 5 times auto-fills the board with the solution. No visual hint — no cursor change, no tooltip.
