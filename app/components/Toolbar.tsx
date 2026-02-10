'use client';

import React from 'react';

interface ToolbarProps {
  noteMode: boolean;
  onToggleNotes: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onNewGame: () => void;
  canUndo: boolean;
  canRedo: boolean;
  elapsed: number;
  solved: boolean;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function Toolbar({
  noteMode,
  onToggleNotes,
  onUndo,
  onRedo,
  onNewGame,
  canUndo,
  canRedo,
  elapsed,
  solved,
}: ToolbarProps) {
  return (
    <div className="flex items-center justify-between w-full max-w-sm mx-auto gap-2">
      <div className="flex gap-1.5">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="px-3 py-2 rounded-lg text-sm font-medium
            bg-white border border-slate-200 shadow-sm
            disabled:opacity-30 disabled:cursor-not-allowed
            hover:bg-slate-50 active:bg-slate-100"
          title="Undo (Ctrl+Z)"
        >
          Undo
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="px-3 py-2 rounded-lg text-sm font-medium
            bg-white border border-slate-200 shadow-sm
            disabled:opacity-30 disabled:cursor-not-allowed
            hover:bg-slate-50 active:bg-slate-100"
          title="Redo (Ctrl+Y)"
        >
          Redo
        </button>
      </div>

      <div className="text-lg font-mono text-slate-500 tabular-nums min-w-[60px] text-center">
        {formatTime(elapsed)}
      </div>

      <div className="flex gap-1.5">
        <button
          onClick={onToggleNotes}
          className={`px-3 py-2 rounded-lg text-sm font-medium border shadow-sm
            transition-colors
            ${noteMode
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          title="Toggle Notes (N)"
        >
          Notes
        </button>
        {!solved && (
          <button
            onClick={onNewGame}
            className="px-3 py-2 rounded-lg text-sm font-medium
              bg-white text-slate-700 border border-slate-200 shadow-sm
              hover:bg-slate-50 active:bg-slate-100"
          >
            New
          </button>
        )}
      </div>
    </div>
  );
}
