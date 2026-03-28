# Astronomy Feature — Architecture

## Purpose

A sky show for Eva — renders the real night sky at 8 PM as seen from her location (25.6451304, -100.3680458, Monterrey area). Built as a gift feature inside the Sudoku app.

## Project Structure

```
lib/astronomy/
  api.ts              # Pure API logic (no React)
                      #   - EVA_LOCATION, DEFAULT_TIME constants
                      #   - BodyPosition, SkyData types
                      #   - fetchBodyPositions(date) → SkyData
  test.ts             # Manual test script (npx tsx lib/astronomy/test.ts)

app/astronomy/
  STATUS.md           # Progress tracker — what's done, what's next
  ARCHITECTURE.md     # This file
  components/         # React components for sky view (TODO)
    SkyView.tsx       # Main sky rendering (canvas or SVG)
    BodyLabel.tsx     # Planet/star label overlay
    MoonPhase.tsx     # Moon phase display
    SkyHeader.tsx     # Time, date, location info
  hooks/              # State management (TODO)
    useSky.ts         # Fetch sky data, loading/error state
```

## Data Flow

```
User opens sky show
  → useSky hook calls fetchBodyPositions(today)
    → GET astronomyapi.com/api/v2/bodies/positions
      (auth via NEXT_PUBLIC_ASTRONOMY_API_AUTH env var)
    → Parse response into SkyData { bodies: BodyPosition[] }
  → SkyView renders bodies on a dark sky canvas
    → altitude (0-90°) maps to vertical position (horizon to zenith)
    → azimuth (0-360°) maps to horizontal position (N-E-S-W)
    → Only bodies with altitude > 0 are rendered (above horizon)
```

## Key Types

```typescript
interface BodyPosition {
  id: string;           // "moon", "venus", "jupiter", etc.
  name: string;         // "Moon", "Venus", "Jupiter"
  altitude: number;     // degrees above horizon (negative = hidden)
  azimuth: number;      // degrees clockwise from north
  constellation: string;// "Leo", "Gemini", etc.
  magnitude?: number;   // brightness (lower = brighter)
}

interface SkyData {
  date: string;
  time: string;         // always "20:00:00"
  observer: { latitude, longitude, elevation };
  bodies: BodyPosition[];
}
```

## Coordinate Mapping (altitude/azimuth → screen)

The sky view uses a **hemisphere projection**:
- **Azimuth** (0-360°): compass direction. 0°=North, 90°=East, 180°=South, 270°=West
  - Maps to angle around a circular sky view
- **Altitude** (0-90°): height above horizon. 0°=horizon, 90°=directly overhead (zenith)
  - Maps to distance from center (90° = center, 0° = edge)

This creates a circular "looking up at the sky" view where:
- Center = directly overhead
- Edge = horizon
- Cardinal directions labeled around the rim

## Constraints

- **Static export**: App deploys to GitHub Pages via `next build` with `output: "export"`. No server-side API routes — all API calls happen client-side.
- **Auth**: Pre-computed `base64(appId:secret)` stored in `NEXT_PUBLIC_ASTRONOMY_API_AUTH` env var. Baked into the JS bundle at build time.
- **API bodies available**: sun, moon, mercury, venus, mars, jupiter, saturn, uranus, neptune, pluto (no stars/constellations beyond what planets are "in")
- **Fixed observer**: Eva's coordinates are hardcoded, not user-configurable
- **Fixed time**: 8 PM local (Monterrey timezone, UTC-6)

## Integration with Main App

- Accessed from the StartScreen — Eva-only feature (password gated)
- Separate screen state (doesn't interfere with game state)
- Uses same Tailwind styling / color palette as the rest of the app

## API Reference (Quick)

```
GET https://api.astronomyapi.com/api/v2/bodies/positions
  ?latitude=25.6451304&longitude=-100.3680458
  &from_date=YYYY-MM-DD&to_date=YYYY-MM-DD
  &time=20:00:00&elevation=0
Headers: Authorization: Basic <NEXT_PUBLIC_ASTRONOMY_API_AUTH>
```

Returns per body: altitude, azimuth, RA/dec, constellation, distance, magnitude.
