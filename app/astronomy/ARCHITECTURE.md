# Astronomy Feature — Architecture

## Purpose

A sky show for Eva — renders the real night sky at 8 PM as seen from her special location (25.6445595, -100.3658494, Monterrey area), oriented in the direction she faces (SSE ~160°). Built as a gift feature inside the Sudoku app.

## Project Structure

```
lib/astronomy/
  api.ts              # Pure API logic (no React)
                      #   - EVA_LOCATION (lat/lon), DEFAULT_TIME constants
                      #   - BodyPosition, SkyData types
                      #   - fetchBodyPositions(date) → SkyData (planets from API)
                      #   - fetchStarChart(date) → imageUrl (unused, kept for reference)
  catalog.ts          # Star catalog — ~170 stars from mag -1.46 to mag 18+
                      #   - Named bright stars (Sirius, Capella, etc.)
                      #   - Naked-eye stars (mag < 6)
                      #   - Telescopic stars (mag 6+, Barnard's Star, Wolf 359, etc.)
  stars.ts            # View cone engine
                      #   - ViewCone type (azimuth, altitude, FOV, mag limit)
                      #   - EVA_VIEW constant (facing 160°, pitch 45°, 120°×80° FOV)
                      #   - computeSky() → SkyResult with objects + ratios
                      #   - Coordinate math: RA/Dec → Alt/Az via LST
                      #   - In-view test: angular bounds check
  test.ts             # Manual test: npx tsx lib/astronomy/test.ts
  test-stars.ts       # Manual test: npx tsx lib/astronomy/test-stars.ts

app/astronomy/
  STATUS.md           # Progress tracker
  ARCHITECTURE.md     # This file
  components/
    SkyView.tsx       # Main sky rendering component (two tabs)
  hooks/              # Reserved for future use
```

## Layout

The start screen uses a **two-panel layout**:

```
┌──────────────────────────────┬────────────────────┐
│                              │                    │
│   Left Panel (60%)           │   Right Panel (40%)│
│   bg-slate-50                │   bg-slate-50      │
│                              │                    │
│  ┌──────────────────────┐    │     Sudoku         │
│  │  Dark sky container  │    │     Title           │
│  │  bg-[#0f1535]        │    │     Difficulty      │
│  │  rounded-2xl         │    │     Player select   │
│  │  w-full, h-[92vh]    │    │     Resume button   │
│  │  p-6, overflow-y     │    │                    │
│  │                      │    │                    │
│  │  ┌────────────────┐  │    │                    │
│  │  │ SkyView fills  │  │    │                    │
│  │  │ container via  │  │    │                    │
│  │  │ ResizeObserver │  │    │                    │
│  │  └────────────────┘  │    │                    │
│  └──────────────────────┘    │                    │
│                              │                    │
└──────────────────────────────┴────────────────────┘
```

- **Desktop (md+)**: Side by side, left 60%, right 40%
- **Mobile**: Stacks vertically — sky on top, sudoku controls below
- Dark container: `id="sky-container"`, fills left panel with p-4 margin
- SkyView measures container via `ResizeObserver` on `#sky-container`
- Chart sizes itself to fit: width = container - 48px padding, height = min(FOV ratio, available space after reserving ~400px for controls)

## Two Tabs

### Planets Tab — Hemisphere Projection

Full-sky circular view showing planets from the Astronomy API.

```
        ⛰️ (mountain, facing SSE ~160°)
       ╱                              ╲
      │         · Jupiter              │
      │                                │
 WSW  │    · Moon        · Uranus      │  ENE
      │                                │
      │              · Venus           │
       ╲                              ╱
        🍕 (pizza, behind NNW)
```

- Circle: center = zenith (90° alt), edge = horizon (0° alt)
- Azimuth rotated so facing direction (160°) is at top
- No E/W mirror — left of facing = left on screen (consistent with Stars tab)
- Direction landmarks: ⛰️ (mountain/Cerro de la Silla) at top, 🍕 (pizza) at bottom

### Stars Tab — View Cone Window

Rectangular view showing what you actually see looking forward and up.

```
        ⛰️ (mountain)
┌─────────────────────────────────┐
│                                 │
│  · Moon        · Procyon        │
│                                 │
│  left ─ ─ ─ ─ ─ ─ ─ ─ ─ right │
│                                 │
│           · Sirius   · Mirzam  │
│                                 │
│      horizon                    │
└─────────────────────────────────┘

[───────── Brightness Slider ─────────]
Brightest      Naked eye      Telescopic

   ○╌╌╌45°──▲    Looking up at 45° pitch
   │         │    FOV 120° × 80°
───┴─────────┴──  18.8% of sky

[Scrollable object list]
```

Controls:
- **Brightness slider**: 0% = mag -2 (only brightest), 100% = mag 6 (naked eye limit), 200% = mag 20 (telescopic)
- **Head diagram**: SVG showing person looking up at 45° towards mountain
- **Object list**: Scrollable (max-h-32), sorted by magnitude, planets in amber

## View Cone Model

The clean way to define what the user sees:

### Input Parameters (EVA_VIEW)

```typescript
{
  azimuth_deg: 160,        // compass direction facing (SSE towards mountain)
  altitude_deg: 45,        // pitch (looking upward)
  fov_horizontal_deg: 120, // horizontal field of view
  fov_vertical_deg: 80,    // vertical field of view
  magnitude_limit: 6.0     // default cutoff (adjustable via slider)
}
```

### In-View Test

A star at (alt, az) is in the view cone if:

```
|angleDiff(star.az, view.az)| <= fov_horizontal / 2
|star.alt - view.alt| <= fov_vertical / 2
```

### View-Relative Coordinates

For rendering, each object gets `(view_x, view_y)` in [-1, 1]:

```typescript
view_x = angleDiff(obj.az, view.az) / (fov_h / 2)   // -1=left, +1=right
view_y = (obj.alt - view.alt) / (fov_v / 2)          // -1=bottom, +1=top
```

Screen position:
```typescript
px = ((view_x + 1) / 2) * viewWidth     // left to right
py = ((1 - view_y) / 2) * viewHeight    // top to bottom (Y flipped)
```

### Output Ratios

```typescript
{
  view_vs_total_sky: 0.188,        // geometric: FOV solid angle / 4π
  view_vs_above_horizon: 0.376,    // geometric: FOV solid angle / 2π
  catalog_in_view: 0.28,           // stars in view / stars above horizon
  catalog_above_horizon: 0.58      // stars above horizon / total catalog
}
```

## Coordinate Math

### RA/Dec → Alt/Az Conversion

Stars are cataloged in equatorial coordinates (RA/Dec). To render them for a specific observer/time:

1. **Compute LST** (Local Sidereal Time) from date, time, and longitude
2. **Hour Angle** = LST - RA
3. **Altitude** = arcsin(sin(dec)·sin(lat) + cos(dec)·cos(lat)·cos(HA))
4. **Azimuth** = arccos((sin(dec) - sin(lat)·sin(alt)) / (cos(lat)·cos(alt)))

### Planets Tab Projection (hemisphere → circle)

```typescript
const angle = ((body.azimuth - FACING_AZIMUTH) - 90) * Math.PI / 180;
const r = radius * (1 - body.altitude / 90);
x = radius + r * cos(angle);
y = radius + r * sin(angle);
```

No negation on azimuth — consistent with view cone (left of facing = left on screen).

## Star Catalog

`lib/astronomy/catalog.ts` — ~170 stars organized by magnitude:

| Range | Count | Examples |
|-------|-------|---------|
| mag < 0 | 3 | Sirius (-1.46), Canopus (-0.74), Arcturus (-0.05) |
| mag 0–1 | 12 | Vega, Capella, Rigel, Procyon, Betelgeuse |
| mag 1–2 | 30 | Pollux, Regulus, Castor, Bellatrix, Orion's belt |
| mag 2–3 | 35 | Polaris, Alphard, Mintaka, Denebola |
| mag 3–4 | 30 | Albireo, Wasat, Arneb, Algorab |
| mag 4–6 | 25 | Alcor, Acubens, Copernicus |
| mag 6+ | ~25 | Barnard's Star (9.5), Wolf 359 (13.5), TRAPPIST-1 (18.8) |

Telescopic stars (mag 6+) include famous nearby stars and exoplanet hosts that appear when the brightness slider is pushed past naked-eye range.

## Body Rendering

### Planets (colored dots)

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

### Stars (white dots, sized by magnitude)

| Magnitude | Dot size |
|-----------|----------|
| < -1     | 8px      |
| -1 to 0  | 7px      |
| 0 to 1   | 6px      |
| 1 to 2   | 5px      |
| 2 to 3   | 4px      |
| 3 to 5   | 3.5px    |
| 5+       | 3px      |

All dots have a glow: `box-shadow: 0 0 ${size+4}px ${color}aa`

## Responsive Sizing

The chart dynamically sizes itself to fit the container:

```typescript
// Measure the dark container via ResizeObserver on #sky-container
const chartWidth = containerWidth - 48;  // subtract p-6 padding

// Reserve space for UI controls below the chart
const reservedHeight = 400;  // title + tabs + slider + diagram + list + gaps
const maxChartHeight = windowHeight * 0.92 - reservedHeight;

// Chart fills available space, maintaining FOV aspect ratio
const viewHeight = min(chartWidth * fov_v/fov_h, maxChartHeight);
```

## Constraints

- **Static export**: GitHub Pages via `output: "export"`. All API calls client-side.
- **Auth**: Pre-computed `base64(appId:secret)` in `NEXT_PUBLIC_ASTRONOMY_API_AUTH` env var.
- **API**: Returns planets only (no stars). Stars computed locally from catalog + coordinate math.
- **Fixed observer**: Eva's coordinates hardcoded in `EVA_LOCATION`.
- **Fixed time**: 8 PM local (Monterrey, UTC-6).
- **Fixed facing**: SSE ~160° azimuth, 45° pitch.
- **Star chart image endpoint**: Available (`POST /studio/star-chart`) but not used — too cluttered for our UI.

## Integration with Main App

- SkyView is rendered on the **StartScreen** (left panel), visible to all users
- Two-panel layout: sky (60%) | sudoku controls (40%)
- Game screen remains unchanged (centered single column)
- Does not interfere with game state

## API Reference

### Body Positions (planets)

```
GET https://api.astronomyapi.com/api/v2/bodies/positions
  ?latitude=25.6445595&longitude=-100.3658494
  &from_date=YYYY-MM-DD&to_date=YYYY-MM-DD
  &time=20:00:00&elevation=0
Headers: Authorization: Basic <NEXT_PUBLIC_ASTRONOMY_API_AUTH>
```

Returns per body: altitude, azimuth, RA/dec, constellation, distance, magnitude.

### Star Chart Image (available, not used)

```
POST https://api.astronomyapi.com/api/v2/studio/star-chart
Body: { style, observer: { latitude, longitude, date }, view: { type, parameters } }
```

Returns `{ data: { imageUrl: "..." } }` — rendered PNG.
