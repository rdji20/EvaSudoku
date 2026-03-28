# Astronomy Sky Show — Eva's Sky

## Goal

Show Eva the night sky at 8 PM from her special location (25.6451304, -100.3680458) — a sky show built just for her.

## Status

### Done

- [x] Created folder structure
  - `app/astronomy/components/` — UI screens
  - `app/astronomy/hooks/` — state management
  - `lib/astronomy/` — pure logic, API calls, data transforms
- [x] Set up Astronomy API credentials
  - [x] Created account and got Application ID + Secret
  - [x] Stored in `.env.local` (gitignored)
- [x] Verified API works
  - [x] `GET /bodies` returns: sun, moon, mercury, venus, earth, mars, jupiter, saturn, uranus, neptune, pluto
  - [x] `GET /bodies/positions` returns full position data (altitude, azimuth, RA/dec, constellation, distance)
  - [x] Confirmed timezone handling: returns `-06:00` offset for Monterrey
- [x] Built client-side API integration
  - [x] `lib/astronomy/api.ts` — types, fetch helper, response parser
  - [x] Pre-computed base64 auth string stored as `NEXT_PUBLIC_ASTRONOMY_API_AUTH`
  - [x] No server route needed (static export / GitHub Pages)
  - [x] Updated GitHub Actions deploy to pass secret as env var
  - [x] Build passes clean
- [x] Tested end-to-end locally (`lib/astronomy/test.ts`)
  - [x] Confirmed visible bodies at 8 PM Mar 28: Moon (Leo, 62.7°), Venus (Pisces, 4.7°), Jupiter (Gemini, 81.2°), Uranus (Taurus, 35°)
  - [x] Sun, Mercury, Mars, Saturn, Neptune, Pluto all below horizon

### TODO

- [ ] Add `ASTRONOMY_API_AUTH` secret to GitHub repo settings (for deploy)
- [ ] Build sky view screen
  - [ ] Sky rendering component (map altitude/azimuth to canvas/SVG positions)
  - [ ] Planet/Moon labels and icons
  - [ ] Constellation labels
  - [ ] Moon phase display
  - [ ] Time and location header
  - [ ] Dark sky background with stars
- [ ] Integrate into main app
  - [ ] Add navigation from start screen to sky show
  - [ ] Eva-only access (password gated like the game)
- [ ] Explore star chart image endpoint (`POST /studio/star-chart`) for richer visuals

---

## API Reference — Astronomy API

**Base URL**: `https://api.astronomyapi.com/api/v2`

### Authentication

Basic Auth using Application ID and Secret:

```typescript
const authString = btoa(`${applicationId}:${applicationSecret}`);
// Header: "Authorization: Basic {authString}"
```

### Key Parameters

| Param | Value |
|-------|-------|
| Latitude | 25.6451304 |
| Longitude | -100.3680458 |
| Time | 20:00 (8 PM local) |
| Elevation | 0 (default) |

### Endpoints (to confirm once API access is set up)

- `GET /bodies` — list available celestial bodies
- `GET /bodies/positions` — get positions for bodies at a given time/location
- `POST /studio/star-chart` — generate star chart image (if available)
- `GET /bodies/positions/:body` — single body position

### Request Format (body positions)

```
GET /bodies/positions
  ?latitude=25.6451304
  &longitude=-100.3680458
  &from_date=YYYY-MM-DD
  &to_date=YYYY-MM-DD
  &time=20:00:00
  &elevation=0
```

### Response (confirmed)

Each body returns:
- **horizontal**: `altitude` (degrees + string), `azimuth` (degrees + string)
- **equatorial**: `rightAscension` (hours + string), `declination` (degrees + string)
- **constellation**: `id`, `short`, `name` (e.g. `psc`, `Psc`, `Pisces`)
- **distance.fromEarth**: `au` + `km`
- **extraInfo**: elongation, magnitude (brightness)

Available bodies: `sun`, `moon`, `mercury`, `venus`, `earth`, `mars`, `jupiter`, `saturn`, `uranus`, `neptune`, `pluto`

### Sample Response (Sun at 8 PM, Mar 28 2026)

```json
{
  "position": {
    "horizontal": {
      "altitude": { "degrees": "-14.48" },
      "azimuth": { "degrees": "281.28" }
    },
    "constellation": { "name": "Pisces" }
  }
}
```

Sun is below horizon (altitude -14.48) at 8 PM — confirmed it's nighttime.

---

## Configuration

```env
# .env.local — pre-computed base64(appId:appSecret)
NEXT_PUBLIC_ASTRONOMY_API_AUTH=<base64-auth-string>
```

**GitHub Actions**: Add repo secret `ASTRONOMY_API_AUTH` with the same base64 value.
Go to: Repo Settings > Secrets and variables > Actions > New repository secret.

## Location

Eva's location: **25.6451304, -100.3680458** (Monterrey, Mexico area)
