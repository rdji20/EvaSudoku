# Eva Sudoku

A Sudoku puzzle game built with Next.js. Puzzles are algorithmically generated with a guaranteed unique solution, with selectable easy or hard difficulty.

## Features

- **Difficulty selection** — choose Easy or Hard before starting a game
- **Unique solution guarantee** — verified via solution counting (stops at 2)
- **Two player modes** — Eva (password-protected) and Guest
- **Notes mode** — toggle with N key, pencil marks as mini-grid
- **Conflict detection** — highlights row/col/box duplicates in red
- **Undo/Redo** — full history with Ctrl+Z / Ctrl+Shift+Z
- **Persistence** — auto-saves to localStorage, resume where you left off
- **Timer** — tracks solve time, pauses on completion
- **Celebration** — custom completion screen (Eva gets the tulip)
- **Keyboard support** — arrow keys, digits 1-9, Delete/Backspace

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Deployed on GitHub Pages. Push to `main` and GitHub updates the live site automatically.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- No external dependencies for game logic — solver, generator, and validation are all custom
