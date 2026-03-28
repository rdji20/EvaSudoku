# Astronomy Sky Show — Eva's Sky

## Goal

Show Eva the night sky from her special location (25.6445595, -100.3658494, Monterrey) — a sky show built just for her.

## Status

### Done

- [x] Folder structure: `app/astronomy/`, `lib/astronomy/`
- [x] Astronomy API credentials (`.env.local`, gitignored)
- [x] API verified: body positions, timezone (-06:00), star chart image endpoint
- [x] Client-side API integration (`lib/astronomy/api.ts`)
  - Pre-computed base64 auth in `NEXT_PUBLIC_ASTRONOMY_API_AUTH`
  - Static export compatible (no server routes)
  - GitHub Actions deploy updated with secret
- [x] Star catalog (`lib/astronomy/catalog.ts`)
  - ~200 stars from mag -1.46 (Sirius) to mag 18+ (TRAPPIST-1)
  - Naked eye + telescopic stars
- [x] View cone engine (`lib/astronomy/stars.ts`)
  - EVA_VIEW: facing 160° SSE, 45° pitch, 120°×80° FOV
  - RA/Dec → Alt/Az coordinate math via LST
  - In-view test, view-relative coordinates, sky ratios
- [x] Two-tab SkyView component
  - **Planets tab**: hemisphere projection (circle), planets from API
  - **Stars tab**: rectangular view cone, stars + planets merged
- [x] Direction landmarks: ⛰️ mountain (SSE, front), 🍕 pizza (NNW, behind)
- [x] Brightness slider: brightest → naked eye → telescopic
  - Object count + magnitude limit shown
  - List tagged: *(brightest)*, *(naked eye)*, *(telescopic)*, *(planet)*
- [x] Hour selector: 8 PM, 10 PM, 12 AM, 2 AM
  - Re-fetches planet positions from API per hour
  - Recomputes star positions per hour
  - 12 AM / 2 AM correctly use next day's date
- [x] Responsive layout
  - Two-panel start screen: sky (60%) | sudoku (40%)
  - Dark container fills left panel, chart sizes via ResizeObserver
  - Chart height accounts for controls (~400px reserved)
  - Star list scrollable (max-h-32), container overflow hidden
- [x] Date display: weekday + month + day + hour + Monterrey

### TODO

- [ ] Add `ASTRONOMY_API_AUTH` secret to GitHub repo settings (for deploy)
- [ ] Constellation lines between stars
- [ ] Moon phase visualization
- [ ] Animate transitions between hours
