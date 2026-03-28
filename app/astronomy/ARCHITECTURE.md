# Astronomy Feature — Architecture

## Purpose

A sky show for Eva — renders the real night sky at 8 PM as seen from her special location (25.6445595, -100.3658494, Monterrey area), oriented in the direction she faces (SSE ~157°). Built as a gift feature inside the Sudoku app.

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
  components/
    SkyView.tsx       # Main sky rendering (SVG hemisphere projection)
                      #   - Fetches sky data on mount
                      #   - Renders circular sky map with planets
                      #   - Oriented for SSE facing direction
                      #   - Body list below the chart
  hooks/              # State management (reserved for future use)
```

## Layout

The start screen uses a **two-panel layout**:

```
┌──────────────────────┬──────────────────────┐
│                      │                      │
│   Left Panel         │   Right Panel        │
│   (white bg)         │   (white bg)         │
│                      │                      │
│  ┌────────────────┐  │     Sudoku           │
│  │                │  │     Title             │
│  │  Dark rounded  │  │     Difficulty        │
│  │  sky window    │  │     Player select     │
│  │  (70% w/h)    │  │     Resume button     │
│  │                │  │                      │
│  └────────────────┘  │                      │
│                      │                      │
└──────────────────────┴──────────────────────┘
```

- **Desktop (md+)**: Side by side, each 50% width
- **Mobile**: Stacks vertically — sky on top, sudoku controls below
- Sky view sits inside a **rounded dark window** (70% width, 70vh height) with subtle border

## Data Flow

```
StartScreen mounts
  → SkyView component mounts
    → useEffect calls fetchBodyPositions(today)
      → GET astronomyapi.com/api/v2/bodies/positions
        (auth via NEXT_PUBLIC_ASTRONOMY_API_AUTH env var)
      → Parse response into SkyData { bodies: BodyPosition[] }
    → SVG renders visible bodies (altitude > 0) on circular projection
      → Bodies positioned using hemisphere projection
      → Rotated so SSE (157°) faces up
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

The sky view uses a **hemisphere projection** rotated to match the observer's facing direction:

### Projection Math

```typescript
const FACING_AZIMUTH = 157; // SSE

function skyToXY(body, size) {
  if (body.altitude <= 0) return null;
  const radius = size / 2;
  const r = radius * (1 - body.altitude / 90);  // 90° = center, 0° = edge
  const angle = (-(body.azimuth - FACING_AZIMUTH) - 90) * Math.PI / 180;
  return {
    x: radius + r * Math.cos(angle),
    y: radius + r * Math.sin(angle),
  };
}
```

### How it works

- **Altitude** (0-90°): height above horizon → distance from center
  - 90° (zenith) = center of circle
  - 0° (horizon) = edge of circle
- **Azimuth** (0-360°): compass direction → angle around circle
  - Rotated by `FACING_AZIMUTH` so the facing direction is at the top
  - Negated for "looking up" mirror (East appears on left, like a real star chart)

### Cardinal directions on the chart

| Position | Direction | Azimuth |
|----------|-----------|---------|
| Top      | SSE       | 157°    |
| Bottom   | NNW       | 337°    |
| Left     | ENE       | 67°     |
| Right    | WSW       | 247°    |

### Observer orientation

The compass at Eva's location points SSE (~150°-165°). This is the direction she faces when looking out. The sky chart is rotated so this direction is "forward" (top of the circle), matching what she'd see if she tilted her head back to look up.

## Body Rendering

Each visible body (altitude > 0) is rendered as a colored dot with a glow:

| Body    | Color   | Size |
|---------|---------|------|
| Moon    | #F5F5DC | 14px |
| Venus   | #FFFACD | 8px  |
| Jupiter | #DEB887 | 8px  |
| Mars    | #CD5C5C | 6px  |
| Saturn  | #F0E68C | 6px  |
| Uranus  | #AFEEEE | 6px  |
| Neptune | #6495ED | 6px  |
| Mercury | #D3D3D3 | 6px  |
| Pluto   | #A9A9A9 | 6px  |

## Constraints

- **Static export**: App deploys to GitHub Pages via `next build` with `output: "export"`. No server-side API routes — all API calls happen client-side.
- **Auth**: Pre-computed `base64(appId:secret)` stored in `NEXT_PUBLIC_ASTRONOMY_API_AUTH` env var. Baked into the JS bundle at build time.
- **API bodies available**: sun, moon, mercury, venus, mars, jupiter, saturn, uranus, neptune, pluto (no individual stars — star chart image endpoint available for future use)
- **Fixed observer**: Eva's coordinates (25.6445595, -100.3658494) hardcoded
- **Fixed time**: 8 PM local (Monterrey timezone, UTC-6)
- **Fixed facing**: SSE ~157° azimuth

## Integration with Main App

- SkyView is rendered on the **StartScreen** (left panel), visible to all users
- Two-panel layout on desktop, stacked on mobile
- Game screen remains unchanged (centered single column)
- Does not interfere with game state

## API Reference

### Body Positions

```
GET https://api.astronomyapi.com/api/v2/bodies/positions
  ?latitude=25.6445595&longitude=-100.3658494
  &from_date=YYYY-MM-DD&to_date=YYYY-MM-DD
  &time=20:00:00&elevation=0
Headers: Authorization: Basic <NEXT_PUBLIC_ASTRONOMY_API_AUTH>
```

Returns per body: altitude, azimuth, RA/dec, constellation, distance, magnitude.

### Star Chart Image (available, not yet integrated)

```
POST https://api.astronomyapi.com/api/v2/studio/star-chart
Body: { style, observer: { latitude, longitude, date }, view: { type, parameters } }
Headers: Authorization: Basic <NEXT_PUBLIC_ASTRONOMY_API_AUTH>
```

Returns `{ data: { imageUrl: "https://..." } }` — rendered PNG with stars and constellation lines.
