'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { fetchBodyPositions, type SkyData, type BodyPosition, EVA_LOCATION, DEFAULT_TIME } from '@/lib/astronomy/api';
import { computeSky, EVA_VIEW, type SkyResult, type SkyObject } from '@/lib/astronomy/stars';

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function tomorrowString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDate(nextDay = false): string {
  const d = new Date();
  if (nextDay) d.setDate(d.getDate() + 1);
  const day = d.toLocaleDateString('en-US', { weekday: 'long' });
  const month = d.toLocaleDateString('en-US', { month: 'long' });
  const date = d.getDate();
  return `${day}, ${month} ${date}`;
}

// --- Planets tab: hemisphere projection ---

const FACING_AZIMUTH = EVA_VIEW.azimuth_deg;

function skyToXY(body: BodyPosition, size: number): { x: number; y: number } | null {
  if (body.altitude <= 0) return null;
  const radius = size / 2;
  const r = radius * (1 - body.altitude / 90);
  // No E/W mirror — consistent with the view cone (left of facing = left on screen)
  const angle = ((body.azimuth - FACING_AZIMUTH) - 90) * Math.PI / 180;
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

// --- Stars tab: view cone rendering ---

function objectDotSize(mag: number): number {
  if (mag < -1) return 6;
  if (mag < -1) return 8;
  if (mag < 0) return 7;
  if (mag < 1) return 6;
  if (mag < 2) return 5;
  if (mag < 3) return 4;
  if (mag < 5) return 3.5;
  if (mag < 8) return 3;
  return 2.5; // very faint telescopic
}

type Tab = 'planets' | 'stars';

export default function SkyView() {
  const [tab, setTab] = useState<Tab>('stars');
  const [sky, setSky] = useState<SkyData | null>(null);
  const [skyResult, setSkyResult] = useState<SkyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brightnessRange, setBrightnessRange] = useState(100);
  const [hour, setHour] = useState(20); // 20=8PM, 22=10PM, 24=12AM

  const timeString = hour >= 24 ? `${String(hour - 24).padStart(2, '0')}:00:00` : `${hour}:00:00`;
  const hourLabel = hour === 20 ? '8 PM' : hour === 22 ? '10 PM' : hour === 24 ? '12 AM' : '2 AM';
  const isNextDay = hour >= 24;

  useEffect(() => {
    const date = isNextDay ? tomorrowString() : todayString();
    setLoading(true);

    fetchBodyPositions(date, timeString)
      .then(setSky)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    const result = computeSky(
      date, timeString,
      EVA_LOCATION.latitude, EVA_LOCATION.longitude,
      { ...EVA_VIEW, magnitude_limit: 20 }
    );
    setSkyResult(result);
  }, [hour]);

  // Magnitude limit: 0% = mag -2 (brightest), 100% = mag 6 (naked eye limit), 200% = mag 20 (telescopic)
  const magLimit = brightnessRange <= 100
    ? -2 + (brightnessRange / 100) * 8    // 0→-2, 100→6
    : 6 + ((brightnessRange - 100) / 100) * 14; // 100→6, 200→20

  const halfH = EVA_VIEW.fov_horizontal_deg / 2;
  const halfV = EVA_VIEW.fov_vertical_deg / 2;

  // Merge planets + stars, filtered by view cone and brightness
  const viewObjects = useMemo(() => {
    if (!skyResult || !sky) return skyResult?.objects.filter((o) => o.in_view) ?? [];

    const starsInView = skyResult.objects
      .filter((o) => o.in_view && o.magnitude <= magLimit);

    // Add planets (always visible regardless of magnitude slider)
    const planetObjects: SkyObject[] = sky.bodies
      .filter((b) => b.altitude > 0 && b.id !== 'earth')
      .map((b) => {
        const relAz = angleDiff(b.azimuth, EVA_VIEW.azimuth_deg);
        const relAlt = b.altitude - EVA_VIEW.altitude_deg;
        const in_view = Math.abs(relAz) <= halfH && Math.abs(relAlt) <= halfV;
        return {
          name: b.name,
          type: 'planet' as const,
          altitude: b.altitude,
          azimuth: b.azimuth,
          magnitude: b.magnitude ?? 0,
          in_view,
          view_x: relAz / halfH,
          view_y: relAlt / halfV,
        };
      });

    return [
      ...starsInView,
      ...planetObjects.filter((o) => o.in_view),
    ];
  }, [skyResult, sky, magLimit]);

  const [containerWidth, setContainerWidth] = useState(440);

  useEffect(() => {
    const el = document.getElementById('sky-container');
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const w = el.clientWidth - 48; // subtract p-6 padding (24px each side)
      if (w > 100) setContainerWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Reserve space for title(60) + tabs(40) + slider(50) + diagram(80) + list(140) + gaps(30) = ~400px
  const reservedHeight = 400;
  const containerHeight = typeof window !== 'undefined' ? window.innerHeight * 0.92 : 700;
  const maxChartHeight = containerHeight - reservedHeight;
  const chartWidth = containerWidth - 20;
  const chartHeight = Math.min(
    Math.round(chartWidth * (EVA_VIEW.fov_vertical_deg / EVA_VIEW.fov_horizontal_deg)),
    maxChartHeight
  );
  const size = Math.min(chartWidth, chartHeight); // planets tab uses square
  const viewWidth = chartWidth;
  const viewHeight = chartHeight;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !sky) {
    return (
      <div className="flex items-center justify-center h-full text-red-400 text-sm">
        Failed to load sky data
      </div>
    );
  }

  const visibleBodies = sky?.bodies.filter((b) => b.altitude > 0) ?? [];

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <h2 className="text-lg font-semibold text-slate-200 tracking-tight">
        Eva&apos;s Sky Tonight
      </h2>
      <p className="text-xs text-slate-400">
        {formatDate(isNextDay)} &middot; {hourLabel} &middot; Monterrey
      </p>

      {/* Hour selector */}
      <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
        {([20, 22, 24, 26] as const).map((h) => {
          const label = h === 20 ? '8 PM' : h === 22 ? '10 PM' : h === 24 ? '12 AM' : '2 AM';
          return (
            <button
              key={h}
              onClick={() => setHour(h)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                hour === h
                  ? 'bg-slate-700 text-slate-200'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
        <button
          onClick={() => setTab('planets')}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
            tab === 'planets'
              ? 'bg-slate-700 text-slate-200'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Planets
        </button>
        <button
          onClick={() => setTab('stars')}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
            tab === 'stars'
              ? 'bg-slate-700 text-slate-200'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Stars
        </button>
      </div>

      {/* Planets tab — full hemisphere */}
      {tab === 'planets' && (
        <>
          <div className="relative mx-auto" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="absolute inset-0">
              <circle cx={size / 2} cy={size / 2} r={size / 2 - 1} fill="#0B1026" stroke="#1E293B" strokeWidth={1} />
              <circle cx={size / 2} cy={size / 2} r={(size / 2) * (2 / 3)} fill="none" stroke="#1E293B" strokeWidth={0.5} strokeDasharray="4 4" />
              <circle cx={size / 2} cy={size / 2} r={(size / 2) * (1 / 3)} fill="none" stroke="#1E293B" strokeWidth={0.5} strokeDasharray="4 4" />
              <line x1={size / 2} y1={0} x2={size / 2} y2={size} stroke="#1E293B" strokeWidth={0.5} />
              <line x1={0} y1={size / 2} x2={size} y2={size / 2} stroke="#1E293B" strokeWidth={0.5} />
            </svg>

            <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-lg" title="Cerro de la Silla">&#x26F0;&#xFE0F;</span>
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-lg" title="Pizza">&#x1F355;</span>
            <span className="absolute left-1 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">WSW</span>
            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">ENE</span>

            {visibleBodies.map((body) => {
              const pos = skyToXY(body, size);
              if (!pos) return null;
              const s = bodySize(body);
              const color = bodyColor(body);
              return (
                <div key={body.id} className="absolute flex flex-col items-center pointer-events-none"
                  style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}>
                  <div className="rounded-full" style={{ width: s, height: s, backgroundColor: color, boxShadow: `0 0 ${s}px ${color}80` }} />
                  <span className="text-[10px] text-slate-300 mt-1 whitespace-nowrap">{body.name}</span>
                </div>
              );
            })}
          </div>

          <div className="text-xs text-slate-400 space-y-1 w-full max-w-full max-h-32 overflow-y-auto pr-1">
            {visibleBodies.map((body) => (
              <div key={body.id} className="flex justify-between">
                <span className="text-slate-300">{body.name}</span>
                <span>{body.constellation} &middot; {body.altitude.toFixed(1)}°</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Stars tab — view cone window */}
      {tab === 'stars' && skyResult && (
        <>
          <div className="relative overflow-hidden rounded-lg border border-slate-700/50 mx-auto"
            style={{ width: viewWidth, height: viewHeight, backgroundColor: '#0B1026' }}>

            {/* Crosshair at center */}
            <svg width={viewWidth} height={viewHeight} className="absolute inset-0 pointer-events-none">
              <line x1={viewWidth / 2} y1={0} x2={viewWidth / 2} y2={viewHeight} stroke="#1E293B" strokeWidth={0.5} strokeDasharray="4 4" />
              <line x1={0} y1={viewHeight / 2} x2={viewWidth} y2={viewHeight / 2} stroke="#1E293B" strokeWidth={0.5} strokeDasharray="4 4" />
            </svg>

            {/* Direction labels */}
            <span className="absolute top-1 left-1/2 -translate-x-1/2 text-lg" title="Cerro de la Silla">&#x26F0;&#xFE0F;</span>
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-slate-500">horizon</span>
            <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">left</span>
            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">right</span>

            {/* Objects in view */}
            {viewObjects.map((obj) => {
              // view_x: -1 (left) to 1 (right), view_y: -1 (bottom) to 1 (top)
              const px = ((obj.view_x + 1) / 2) * viewWidth;
              const py = ((1 - obj.view_y) / 2) * viewHeight; // flip Y (up = top)
              const s = obj.type === 'planet' ? bodySize({ id: obj.name.toLowerCase(), name: obj.name } as BodyPosition) : objectDotSize(obj.magnitude);
              const color = obj.type === 'planet'
                ? bodyColor({ id: obj.name.toLowerCase() } as BodyPosition)
                : '#FFFFFF';

              return (
                <div key={`${obj.type}-${obj.name}`}
                  className="absolute flex flex-col items-center pointer-events-none"
                  style={{ left: px, top: py, transform: 'translate(-50%, -50%)' }}>
                  <div className="rounded-full" style={{
                    width: s, height: s,
                    backgroundColor: color,
                    boxShadow: `0 0 ${s + 4}px ${color}aa`,
                  }} />
                  <span className={`mt-1 whitespace-nowrap ${obj.type === 'planet' ? 'text-[10px] text-amber-300' : 'text-[9px] text-slate-400'}`}>
                    {obj.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* FOV slider */}
          <div className="flex flex-col gap-1 w-full max-w-full">
            <input
              type="range"
              min={0}
              max={200}
              value={brightnessRange}
              onChange={(e) => setBrightnessRange(Number(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Brightest</span>
              <span className={brightnessRange >= 90 && brightnessRange <= 110 ? 'text-indigo-400' : ''}>Naked eye</span>
              <span>Telescopic</span>
            </div>
            <div className="text-[10px] text-slate-500 text-center">
              {viewObjects.length} objects &middot; mag limit {magLimit.toFixed(1)}
            </div>
          </div>

          {/* Head looking up diagram */}
          <div className="flex items-end justify-center gap-4 mt-1">
            <svg width="80" height="60" viewBox="0 0 80 60" className="text-slate-500">
              {/* Ground line */}
              <line x1="0" y1="55" x2="80" y2="55" stroke="currentColor" strokeWidth="1" />
              {/* Mountain silhouette */}
              <polygon points="55,55 67,25 80,55" fill="#1E293B" stroke="#334155" strokeWidth="0.5" />
              {/* Body */}
              <line x1="25" y1="55" x2="25" y2="38" stroke="currentColor" strokeWidth="1.5" />
              {/* Head — tilted up */}
              <circle cx="25" cy="32" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              {/* Eye direction — looking up at 45° towards mountain */}
              <line x1="29" y1="30" x2="45" y2="18" stroke="#6366F1" strokeWidth="1" strokeDasharray="2 2" />
              {/* View cone lines */}
              <line x1="29" y1="30" x2="55" y2="8" stroke="#6366F1" strokeWidth="0.5" opacity="0.5" />
              <line x1="29" y1="30" x2="50" y2="28" stroke="#6366F1" strokeWidth="0.5" opacity="0.5" />
              {/* FOV arc */}
              <path d="M 48 12 Q 52 20 46 26" fill="none" stroke="#6366F1" strokeWidth="0.5" opacity="0.5" />
              {/* 45° label */}
              <text x="36" y="36" fill="#6366F1" fontSize="7" fontFamily="monospace">45°</text>
            </svg>
            <div className="text-[10px] text-slate-500 leading-tight pb-1">
              <div>Looking up at {EVA_VIEW.altitude_deg}° pitch</div>
              <div>FOV {EVA_VIEW.fov_horizontal_deg}° x {EVA_VIEW.fov_vertical_deg}°</div>
              <div className="text-slate-600">{(skyResult.ratios.view_vs_total_sky * 100).toFixed(1)}% of sky</div>
            </div>
          </div>

          {/* Object list — scrollable */}
          <div className="text-xs text-slate-400 w-full max-w-full max-h-32 overflow-y-auto pr-1">
            <div className="space-y-1">
              {viewObjects
                .sort((a, b) => a.magnitude - b.magnitude)
                .map((obj) => {
                  const tag = obj.type === 'planet' ? 'planet'
                    : obj.magnitude <= 0 ? 'brightest'
                    : obj.magnitude <= 6 ? 'naked eye'
                    : 'telescopic';
                  const tagColor = obj.type === 'planet' ? 'text-amber-300'
                    : obj.magnitude <= 0 ? 'text-yellow-300'
                    : obj.magnitude <= 6 ? 'text-slate-300'
                    : 'text-indigo-400';
                  return (
                    <div key={`${obj.type}-${obj.name}`} className="flex justify-between">
                      <span className={tagColor}>
                        {obj.name} <span className="text-[9px] opacity-60">({tag})</span>
                      </span>
                      <span>mag {obj.magnitude.toFixed(1)} &middot; {obj.altitude.toFixed(1)}°</span>
                    </div>
                  );
                })}
              <div className="h-8" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Shared helper
function angleDiff(a: number, b: number): number {
  let d = a - b;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}
