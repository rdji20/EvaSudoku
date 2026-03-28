'use client';

import React, { useState } from 'react';
import { Difficulty } from '@/lib/sudoku';
import SkyView from '../astronomy/components/SkyView';

interface StartScreenProps {
  hasSavedGame: boolean;
  savedPlayer: string | null;
  onStart: (player: string, difficulty: Difficulty) => void;
  onResume: () => void;
}

export default function StartScreen({ hasSavedGame, savedPlayer, onStart, onResume }: StartScreenProps) {
  const [showPassword, setShowPassword] = useState<false | 'new' | 'resume'>(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  function handleEvaClick() {
    setShowPassword('new');
    setPassword('');
    setError(false);
  }

  function handleResumeClick() {
    if (savedPlayer === 'Eva') {
      setShowPassword('resume');
      setPassword('');
      setError(false);
    } else {
      onResume();
    }
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.toLowerCase().trim() === 'tulip') {
      if (showPassword === 'resume') {
        onResume();
      } else {
        onStart('Eva', difficulty);
      }
    } else {
      setError(true);
    }
  }

  return (
    <div className="min-h-screen w-full overflow-hidden flex flex-col md:flex-row select-none">
      {/* Left panel — Sky View */}
      <div className="md:w-[60%] bg-slate-50 flex items-center justify-center min-h-[50vh] md:min-h-screen p-4">
        <div id="sky-container" className="w-full h-[92vh] bg-[#0f1535] rounded-2xl border border-slate-700/50 overflow-hidden p-6">
          <SkyView />
        </div>
      </div>

      {/* Right panel — Sudoku start */}
      <div className="md:w-[40%] bg-slate-50 flex flex-col items-center justify-center px-4 py-12 md:py-0">
        <div className="w-full max-w-xs flex flex-col items-center gap-8">
          {/* Title */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-800 tracking-tight">Sudoku</h1>
            <p className="text-sm text-slate-400 mt-1 tracking-wide uppercase">
              {difficulty === 'easy' ? 'Easy mode' : difficulty === 'medium' ? 'Medium mode' : 'Hard mode'}
            </p>
          </div>

          {/* Mini decorative grid */}
          <div className="grid grid-cols-3 gap-0.5 w-16 h-16 opacity-20">
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className="bg-slate-800 rounded-sm" />
            ))}
          </div>

          {/* Player buttons / password prompt */}
          <div className="w-full flex flex-col gap-3">
            <p className="text-center text-xs text-slate-400 font-medium tracking-wide uppercase">Difficulty</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                aria-pressed={difficulty === 'easy'}
                onClick={() => setDifficulty('easy')}
                className="w-full py-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none"
                style={difficulty === 'easy'
                  ? { backgroundColor: '#8b5cf6', color: '#ffffff' }
                  : { backgroundColor: '#e2e8f0', color: '#334155' }}
              >
                Easy
              </button>
              <button
                type="button"
                aria-pressed={difficulty === 'medium'}
                onClick={() => setDifficulty('medium')}
                className="w-full py-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none"
                style={difficulty === 'medium'
                  ? { backgroundColor: '#8b5cf6', color: '#ffffff' }
                  : { backgroundColor: '#e2e8f0', color: '#334155' }}
              >
                Medium
              </button>
              <button
                type="button"
                aria-pressed={difficulty === 'hard'}
                onClick={() => setDifficulty('hard')}
                className="w-full py-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none"
                style={difficulty === 'hard'
                  ? { backgroundColor: '#8b5cf6', color: '#ffffff' }
                  : { backgroundColor: '#e2e8f0', color: '#334155' }}
              >
                Hard
              </button>
            </div>
            <p className="text-center text-sm text-slate-500 font-medium">Who&apos;s playing?</p>

            {!showPassword ? (
              <>
                <button
                  onClick={handleEvaClick}
                  className="w-full py-4 px-6 rounded-xl font-semibold text-lg text-white
                    bg-gradient-to-r from-purple-500 to-pink-500
                    hover:from-purple-600 hover:to-pink-600
                    active:from-purple-700 active:to-pink-700
                    transition-all shadow-lg shadow-purple-500/25"
                >
                  I&apos;m Eva
                </button>

                <button
                  onClick={() => onStart('Guest', difficulty)}
                  className="w-full py-4 px-6 rounded-xl font-semibold text-lg
                    text-slate-700 bg-white border border-slate-200
                    hover:bg-slate-50 active:bg-slate-100
                    transition-all shadow-sm"
                >
                  Guest
                </button>
              </>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
                <label className="text-center text-sm text-slate-500">
                  What&apos;s the magic word?
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(false); }}
                  autoFocus
                  placeholder="Enter password"
                  className={`w-full py-3 px-4 rounded-xl text-center text-lg border outline-none transition-colors
                    ${error
                      ? 'border-red-300 bg-red-50 text-red-600 placeholder-red-300'
                      : 'border-slate-200 bg-white text-slate-800 placeholder-slate-300 focus:border-purple-400'
                    }`}
                />
                {error && (
                  <p className="text-xs text-red-400 text-center">Nope, try again</p>
                )}
                <button
                  type="submit"
                  className="w-full py-3 px-6 rounded-xl font-semibold text-white
                    bg-gradient-to-r from-purple-500 to-pink-500
                    hover:from-purple-600 hover:to-pink-600
                    transition-all shadow-lg shadow-purple-500/25"
                >
                  Enter
                </button>
                <button
                  type="button"
                  onClick={() => setShowPassword(false)}
                  className="text-xs text-slate-400 hover:text-slate-500 transition-colors"
                >
                  &larr; Back
                </button>
              </form>
            )}
          </div>

          {/* Resume option */}
          {hasSavedGame && !showPassword && (
            <button
              onClick={handleResumeClick}
              className="text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors"
            >
              Continue {savedPlayer}&apos;s game
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
