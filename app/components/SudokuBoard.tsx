'use client';

import React from 'react';
import Cell from './Cell';
import { row, col, box, peers } from '@/lib/sudoku';

interface SudokuBoardProps {
  given: number[];
  value: number[];
  notes: number[];
  selected: number;
  conflicts: boolean[];
  onSelect: (index: number) => void;
}

export default function SudokuBoard({
  given,
  value,
  notes,
  selected,
  conflicts,
  onSelect,
}: SudokuBoardProps) {
  const selectedValue = given[selected] || value[selected];
  const selectedPeers = new Set(peers(selected));

  return (
    <div className="w-full max-w-sm mx-auto">
      <div
        className="grid grid-cols-9 border-2 border-slate-700 rounded-lg overflow-hidden"
        role="grid"
        aria-label="Sudoku board"
      >
        {Array.from({ length: 81 }, (_, i) => {
          const cellValue = given[i] || value[i];
          return (
            <Cell
              key={i}
              index={i}
              value={value[i]}
              given={given[i]}
              notes={notes[i]}
              isSelected={i === selected}
              isPeerOfSelected={selectedPeers.has(i)}
              isSameNumber={selectedValue !== 0 && cellValue === selectedValue}
              isHighlighted={
                row(i) === row(selected) ||
                col(i) === col(selected) ||
                box(i) === box(selected)
              }
              isConflict={conflicts[i]}
              onClick={() => onSelect(i)}
            />
          );
        })}
      </div>
    </div>
  );
}
