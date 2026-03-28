'use client';

import React, { useEffect, useState } from 'react';
import { fetchBodyPositions, type SkyData, type BodyPosition } from '@/lib/astronomy/api';

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Map altitude/azimuth to x,y on a circular projection
// Center = zenith (90°), edge = horizon (0°)
function skyToXY(body: BodyPosition, size: number): { x: number; y: number } | null {
  if (body.altitude <= 0) return null; // below horizon
  const radius = size / 2;
  const r = radius * (1 - body.altitude / 90); // 90° = center, 0° = edge
  const angle = ((body.azimuth - 90) * Math.PI) / 180; // rotate so 0°(N) is up
  return {
    x: radius + r * Math.cos(angle),
    y: radius + r * Math.sin(angle),
  };
}

function bodySize(body: BodyPosition): number {
  if (body.id === 'moon') return 14;
  if (body.id === 'venus' || body.id === 'jupiter') return 8;
  return 6;
}

function bodyColor(body: BodyPosition): string {
  switch (body.id) {
    case 'moon': return '#F5F5DC';
    case 'venus': return '#FFFACD';
    case 'mars': return '#CD5C5C';
    case 'jupiter': return '#DEB887';
    case 'saturn': return '#F0E68C';
    case 'uranus': return '#AFEEEE';
    case 'neptune': return '#6495ED';
    case 'mercury': return '#D3D3D3';
    case 'pluto': return '#A9A9A9';
    default: return '#FFFFFF';
  }
}

export default function SkyView() {
  const [sky, setSky] = useState<SkyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBodyPositions(todayString())
      .then(setSky)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const size = 360;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-400 text-sm">
        Failed to load sky data
      </div>
    );
  }

  if (!sky) return null;

  const visibleBodies = sky.bodies.filter((b) => b.altitude > 0);

  return (
    <div className="flex flex-col items-center gap-3">
      <h2 className="text-lg font-semibold text-slate-200 tracking-tight">
        Eva&apos;s Sky Tonight
      </h2>
      <p className="text-xs text-slate-400">
        8:00 PM &middot; Monterrey
      </p>

      <div className="relative" style={{ width: size, height: size }}>
        {/* Sky background */}
        <svg width={size} height={size} className="absolute inset-0">
          {/* Outer circle — horizon */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 1}
            fill="#0B1026"
            stroke="#1E293B"
            strokeWidth={1}
          />
          {/* Altitude rings at 30° and 60° */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={(size / 2) * (2 / 3)}
            fill="none"
            stroke="#1E293B"
            strokeWidth={0.5}
            strokeDasharray="4 4"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={(size / 2) * (1 / 3)}
            fill="none"
            stroke="#1E293B"
            strokeWidth={0.5}
            strokeDasharray="4 4"
          />
          {/* Cross hairs */}
          <line x1={size / 2} y1={0} x2={size / 2} y2={size} stroke="#1E293B" strokeWidth={0.5} />
          <line x1={0} y1={size / 2} x2={size} y2={size / 2} stroke="#1E293B" strokeWidth={0.5} />
        </svg>

        {/* Cardinal directions */}
        <span className="absolute top-1 left-1/2 -translate-x-1/2 text-xs text-slate-500 font-medium">N</span>
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-slate-500 font-medium">S</span>
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">W</span>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">E</span>

        {/* Celestial bodies */}
        {visibleBodies.map((body) => {
          const pos = skyToXY(body, size);
          if (!pos) return null;
          const s = bodySize(body);
          const color = bodyColor(body);
          return (
            <div
              key={body.id}
              className="absolute flex flex-col items-center pointer-events-none"
              style={{
                left: pos.x,
                top: pos.y,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                className="rounded-full"
                style={{
                  width: s,
                  height: s,
                  backgroundColor: color,
                  boxShadow: `0 0 ${s}px ${color}80`,
                }}
              />
              <span className="text-[10px] text-slate-300 mt-1 whitespace-nowrap">
                {body.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Body list */}
      <div className="text-xs text-slate-400 space-y-1 w-full max-w-xs">
        {visibleBodies.map((body) => (
          <div key={body.id} className="flex justify-between">
            <span className="text-slate-300">{body.name}</span>
            <span>{body.constellation} &middot; {body.altitude.toFixed(1)}°</span>
          </div>
        ))}
      </div>
    </div>
  );
}
