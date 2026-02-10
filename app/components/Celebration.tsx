'use client';

import React, { useEffect, useState } from 'react';

interface CelebrationProps {
  elapsed: number;
  onNewGame: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  delay: number;
  size: number;
}

export default function Celebration({ elapsed, onNewGame }: CelebrationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
    const newParticles: Particle[] = [];
    for (let i = 0; i < 40; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        size: 4 + Math.random() * 8,
      });
    }
    setParticles(newParticles);
  }, []);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Confetti particles */}
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full animate-confetti"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Card */}
      <div className={`relative bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-sm w-full text-center
        transition-all duration-500 ${visible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-4'}`}>
        <div className="text-5xl mb-4">
          {elapsed < 300 ? '🔥' : elapsed < 600 ? '🎉' : '✨'}
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Puzzle Complete!
        </h2>
        <p className="text-slate-500 mb-1">
          Hard difficulty
        </p>
        <p className="text-3xl font-mono font-bold text-blue-600 mb-6">
          {formatTime(elapsed)}
        </p>
        <button
          onClick={onNewGame}
          className="w-full py-3 px-6 rounded-xl font-semibold text-white
            bg-gradient-to-r from-blue-500 to-purple-500
            hover:from-blue-600 hover:to-purple-600
            active:from-blue-700 active:to-purple-700
            transition-all shadow-lg shadow-blue-500/25"
        >
          New Puzzle
        </button>
      </div>
    </div>
  );
}
