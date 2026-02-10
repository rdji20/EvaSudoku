'use client';

import React from 'react';

interface CellProps {
  index: number;
  value: number;
  given: number;
  notes: number;
  isSelected: boolean;
  isHighlighted: boolean;
  isSameNumber: boolean;
  isConflict: boolean;
  isPeerOfSelected: boolean;
  onClick: () => void;
}

export default function Cell({
  index,
  value,
  given,
  notes,
  isSelected,
  isHighlighted,
  isSameNumber,
  isConflict,
  isPeerOfSelected,
  onClick,
}: CellProps) {
  const r = Math.floor(index / 9);
  const c = index % 9;

  // Border classes for 3x3 box boundaries
  const borderClasses = [
    c % 3 === 0 && c !== 0 ? 'border-l-2 border-l-slate-700' : '',
    r % 3 === 0 && r !== 0 ? 'border-t-2 border-t-slate-700' : '',
  ].join(' ');

  // Background
  let bg = 'bg-white';
  if (isSelected) bg = 'bg-blue-200';
  else if (isSameNumber && value !== 0) bg = 'bg-blue-100';
  else if (isPeerOfSelected) bg = 'bg-slate-100';

  // Text color
  let textColor = given ? 'text-slate-800' : 'text-blue-600';
  if (isConflict) textColor = 'text-red-500';

  const displayValue = given || value;

  return (
    <button
      className={`
        relative w-full aspect-square flex items-center justify-center
        border border-slate-300 outline-none
        text-lg sm:text-xl md:text-2xl font-medium
        transition-colors duration-75
        ${borderClasses}
        ${bg}
        ${textColor}
        ${given ? 'font-bold' : ''}
        hover:bg-blue-50
        focus:z-10
      `}
      onClick={onClick}
      aria-label={`Cell row ${r + 1} column ${c + 1}${displayValue ? ` value ${displayValue}` : ' empty'}`}
    >
      {displayValue ? (
        <span className={isConflict ? 'animate-pulse' : ''}>{displayValue}</span>
      ) : notes ? (
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
            <span
              key={d}
              className="flex items-center justify-center text-[8px] sm:text-[9px] md:text-[10px] text-slate-400 font-medium leading-none"
            >
              {notes & (1 << d) ? d : ''}
            </span>
          ))}
        </div>
      ) : null}
    </button>
  );
}
