'use client';

import React, { useEffect, useCallback, useState } from 'react';
import StartScreen from './components/StartScreen';
import SudokuBoard from './components/SudokuBoard';
import Numpad from './components/Numpad';
import Toolbar from './components/Toolbar';
import Celebration from './components/Celebration';
import { useGame } from './hooks/useGame';
import { row, col } from '@/lib/sudoku';

export default function Home() {
  const {
    screen,
    player,
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
  } = useGame();

  // Keyboard input (only when playing)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (screen !== 'playing' || gameState.solved) return;

    if (e.key >= '1' && e.key <= '9') {
      e.preventDefault();
      enterDigit(parseInt(e.key));
      return;
    }

    const r = row(gameState.selected);
    const c = col(gameState.selected);
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (r > 0) selectCell(gameState.selected - 9);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (r < 8) selectCell(gameState.selected + 9);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (c > 0) selectCell(gameState.selected - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (c < 8) selectCell(gameState.selected + 1);
        break;
      case 'Backspace':
      case 'Delete':
        e.preventDefault();
        erase();
        break;
      case 'n':
      case 'N':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          toggleNotes();
        }
        break;
      case 'z':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (e.shiftKey) redo();
          else undo();
        }
        break;
      case 'y':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          redo();
        }
        break;
    }
  }, [screen, gameState.selected, gameState.solved, enterDigit, selectCell, erase, toggleNotes, undo, redo]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const [showSolution, setShowSolution] = useState(false);
  const [solutionClicks, setSolutionClicks] = useState(0);

  // Start screen
  if (screen === 'start') {
    return (
      <StartScreen
        hasSavedGame={!!savedGame}
        savedPlayer={savedGame?.player ?? null}
        onStart={startGame}
        onResume={resumeGame}
      />
    );
  }

  // Loading screen
  if (screen === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm font-medium">Generating puzzle...</p>
      </div>
    );
  }

  // Game screen
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-6 px-4 select-none">
      <header className="mb-6 text-center relative w-full max-w-sm mx-auto">
        <button
          onClick={goHome}
          className="absolute left-0 top-1 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          title="Back to home"
        >
          &larr; Home
        </button>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Sudoku</h1>
        <p className="text-xs text-slate-400 mt-0.5 tracking-wide uppercase">
          Hard &middot; {player}
        </p>
      </header>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Toolbar
          noteMode={gameState.noteMode}
          onToggleNotes={toggleNotes}
          onUndo={undo}
          onRedo={redo}
          onNewGame={newGame}
          canUndo={history.past.length > 0}
          canRedo={history.future.length > 0}
          elapsed={gameState.elapsed}
          solved={gameState.solved}
        />

        <SudokuBoard
          given={gameState.given}
          value={gameState.value}
          notes={gameState.notes}
          selected={gameState.selected}
          conflicts={conflicts}
          onSelect={selectCell}
        />

        <Numpad
          onDigit={enterDigit}
          onErase={erase}
          digitCounts={digitCounts}
        />
      </div>

      <footer className="mt-6 text-xs text-slate-400">
        Arrow keys to navigate &middot; N for notes &middot; Ctrl+Z undo
      </footer>

      {!gameState.solved && (
        <div className="mt-4">
          {!showSolution ? (
            <button
              onClick={() => setShowSolution(true)}
              className="text-xs text-slate-300 hover:text-slate-400 transition-colors"
            >
              Reveal solution
            </button>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="grid grid-cols-9 gap-0 border border-slate-300 rounded text-[10px] font-mono"
                onClick={() => {
                  const next = solutionClicks + 1;
                  if (next >= 5) {
                    fillSolution();
                    setSolutionClicks(0);
                  } else {
                    setSolutionClicks(next);
                  }
                }}
              >
                {solution.map((v, i) => (
                  <div
                    key={i}
                    className={`w-5 h-5 flex items-center justify-center text-slate-500
                      ${i % 3 === 0 && i % 9 !== 0 ? 'border-l border-slate-300' : ''}
                      ${Math.floor(i / 9) % 3 === 0 && i >= 9 ? 'border-t border-slate-300' : ''}
                    `}
                  >
                    {v}
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setShowSolution(false); setSolutionClicks(0); }}
                className="text-xs text-slate-300 hover:text-slate-400 transition-colors"
              >
                Hide
              </button>
            </div>
          )}
        </div>
      )}

      {gameState.solved && (
        <Celebration elapsed={gameState.elapsed} player={player} onNewGame={newGame} />
      )}
    </div>
  );
}
