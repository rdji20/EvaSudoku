'use client';

import React from 'react';

interface NumpadProps {
  onDigit: (d: number) => void;
  onErase: () => void;
  digitCounts: number[]; // index 1-9: how many of each digit are placed
}

export default function Numpad({ onDigit, onErase, digitCounts }: NumpadProps) {
  return (
    <div className="grid grid-cols-5 gap-1.5 w-full max-w-sm mx-auto">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => {
        const remaining = 9 - (digitCounts[d] || 0);
        const isComplete = remaining <= 0;
        return (
          <button
            key={d}
            onClick={() => onDigit(d)}
            disabled={isComplete}
            className={`
              relative flex flex-col items-center justify-center
              h-12 sm:h-14 rounded-lg font-bold text-xl
              transition-all duration-100
              ${isComplete
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                : 'bg-white text-slate-700 hover:bg-blue-50 active:bg-blue-100 border border-slate-200 shadow-sm'
              }
            `}
          >
            {d}
            {!isComplete && (
              <span className="absolute bottom-0.5 text-[9px] text-slate-400">{remaining}</span>
            )}
          </button>
        );
      })}
      <button
        onClick={onErase}
        className="flex items-center justify-center h-12 sm:h-14 rounded-lg font-medium text-sm
          bg-white text-slate-600 hover:bg-red-50 active:bg-red-100 border border-slate-200 shadow-sm"
      >
        Erase
      </button>
    </div>
  );
}
