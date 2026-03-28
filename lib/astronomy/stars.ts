import { STAR_CATALOG, type CatalogStar } from './catalog';

// --- View Cone Definition ---

export interface ViewCone {
  azimuth_deg: number;        // compass direction you're facing
  altitude_deg: number;       // pitch (0 = horizon, 90 = zenith)
  fov_horizontal_deg: number; // horizontal field of view
  fov_vertical_deg: number;   // vertical field of view
  magnitude_limit: number;    // dimmest star to include
}

// Eva's default view: looking towards the mountain, tilted up
export const EVA_VIEW: ViewCone = {
  azimuth_deg: 160,
  altitude_deg: 45,
  fov_horizontal_deg: 120,
  fov_vertical_deg: 80,
  magnitude_limit: 6.0,
};

export interface SkyObject {
  name: string;
  type: 'star' | 'planet';
  altitude: number;
  azimuth: number;
  magnitude: number;
  in_view: boolean;     // inside the view cone
  // Position relative to view center (for rendering)
  view_x: number;       // -1 to 1, left to right within FOV
  view_y: number;       // -1 to 1, bottom to top within FOV
}

export interface SkyResult {
  ratios: {
    view_vs_total_sky: number;
    view_vs_above_horizon: number;
    catalog_in_view: number;
    catalog_above_horizon: number;
  };
  view_center: {
    azimuth_deg: number;
    altitude_deg: number;
  };
  objects: SkyObject[];
}

// --- Coordinate Math ---

// Compute Local Sidereal Time in hours
function computeLST(date: string, time: string, longitudeDeg: number): number {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm, ss] = time.split(':').map(Number);

  // Convert local time to UTC (Monterrey = UTC-6)
  let utcHour = hh + 6;
  let dayOffset = 0;
  if (utcHour >= 24) {
    utcHour -= 24;
    dayOffset = 1;
  }
  const utDecimal = utcHour + mm / 60 + (ss || 0) / 3600;

  // Julian Date
  let jdY = y, jdM = m;
  if (m <= 2) { jdY -= 1; jdM += 12; }
  const A = Math.floor(jdY / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD = Math.floor(365.25 * (jdY + 4716)) + Math.floor(30.6001 * (jdM + 1)) + (d + dayOffset) + utDecimal / 24 + B - 1524.5;

  // Greenwich Mean Sidereal Time
  const T = (JD - 2451545.0) / 36525;
  let gmst = 280.46061837 + 360.98564736629 * (JD - 2451545.0) + 0.000387933 * T * T;
  gmst = ((gmst % 360) + 360) % 360;

  let lst = gmst + longitudeDeg;
  lst = ((lst % 360) + 360) % 360;
  return lst / 15;
}

// Convert RA/Dec to Altitude/Azimuth
function equatorialToHorizontal(
  ra: number, dec: number, lst: number, latDeg: number
): { altitude: number; azimuth: number } {
  const lat = latDeg * Math.PI / 180;
  const decRad = dec * Math.PI / 180;
  const ha = ((lst - ra) * 15) * Math.PI / 180;

  const sinAlt = Math.sin(decRad) * Math.sin(lat) + Math.cos(decRad) * Math.cos(lat) * Math.cos(ha);
  const altitude = Math.asin(sinAlt) * 180 / Math.PI;

  const cosAz = (Math.sin(decRad) - Math.sin(lat) * sinAlt) / (Math.cos(lat) * Math.cos(Math.asin(sinAlt)));
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz))) * 180 / Math.PI;
  if (Math.sin(ha) > 0) azimuth = 360 - azimuth;

  return { altitude, azimuth };
}

// Normalize angle difference to [-180, 180]
function angleDiff(a: number, b: number): number {
  let d = a - b;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

// Test if a point (alt/az) is inside the view cone and compute view-relative coords
function projectIntoView(
  objAlt: number, objAz: number, view: ViewCone
): { in_view: boolean; view_x: number; view_y: number } {
  const relAz = angleDiff(objAz, view.azimuth_deg);
  const relAlt = objAlt - view.altitude_deg;

  const halfH = view.fov_horizontal_deg / 2;
  const halfV = view.fov_vertical_deg / 2;

  const in_view = Math.abs(relAz) <= halfH && Math.abs(relAlt) <= halfV;

  // Normalize to [-1, 1] within FOV (0,0 = center)
  const view_x = relAz / halfH;
  const view_y = relAlt / halfV;

  return { in_view, view_x, view_y };
}

// Solid angle of a rectangular FOV patch (approximate)
function fovSolidAngle(hDeg: number, vDeg: number): number {
  const h = hDeg * Math.PI / 180;
  const v = vDeg * Math.PI / 180;
  return 4 * Math.asin(Math.sin(h / 2) * Math.sin(v / 2));
}

// --- Main API ---

export function computeSky(
  date: string,
  time: string,
  latDeg: number,
  lonDeg: number,
  view: ViewCone
): SkyResult {
  const lst = computeLST(date, time, lonDeg);

  // Compute positions for all catalog stars
  const allObjects: SkyObject[] = STAR_CATALOG
    .filter((s) => s.mag <= view.magnitude_limit)
    .map((star) => {
      const { altitude, azimuth } = equatorialToHorizontal(star.ra, star.dec, lst, latDeg);
      const { in_view, view_x, view_y } = projectIntoView(altitude, azimuth, view);
      return {
        name: star.name,
        type: 'star' as const,
        altitude,
        azimuth,
        magnitude: star.mag,
        in_view: altitude > 0 && in_view,
        view_x,
        view_y,
      };
    });

  const aboveHorizon = allObjects.filter((o) => o.altitude > 0);
  const inView = allObjects.filter((o) => o.in_view);

  // Geometric ratios
  const fullSkySr = 4 * Math.PI;          // full sphere
  const aboveHorizonSr = 2 * Math.PI;     // hemisphere
  const viewSr = fovSolidAngle(view.fov_horizontal_deg, view.fov_vertical_deg);

  return {
    ratios: {
      view_vs_total_sky: viewSr / fullSkySr,
      view_vs_above_horizon: viewSr / aboveHorizonSr,
      catalog_in_view: aboveHorizon.length > 0 ? inView.length / aboveHorizon.length : 0,
      catalog_above_horizon: allObjects.length > 0 ? aboveHorizon.length / allObjects.length : 0,
    },
    view_center: {
      azimuth_deg: view.azimuth_deg,
      altitude_deg: view.altitude_deg,
    },
    objects: allObjects,
  };
}
