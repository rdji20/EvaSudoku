// Astronomy API — client-side (static export, no server routes)

export const EVA_LOCATION = {
  latitude: 25.6445595,
  longitude: -100.3658494,
  elevation: 0,
} as const;

export const DEFAULT_TIME = '20:00:00'; // 8 PM local

export interface BodyPosition {
  id: string;
  name: string;
  altitude: number;  // degrees, negative = below horizon
  azimuth: number;   // degrees, 0=N, 90=E, 180=S, 270=W
  rightAscension: string;
  declination: string;
  constellation: string;
  distanceKm: string;
  distanceAu: string;
  magnitude?: number;
  elongation?: number;
}

export interface SkyData {
  date: string;
  time: string;
  observer: typeof EVA_LOCATION;
  bodies: BodyPosition[];
}

const API_BASE = 'https://api.astronomyapi.com/api/v2';

function getAuthString(): string {
  const auth = process.env.NEXT_PUBLIC_ASTRONOMY_API_AUTH;
  if (!auth) {
    throw new Error('Missing NEXT_PUBLIC_ASTRONOMY_API_AUTH');
  }
  return auth;
}

export async function fetchBodyPositions(date: string): Promise<SkyData> {
  const auth = getAuthString();
  const params = new URLSearchParams({
    latitude: String(EVA_LOCATION.latitude),
    longitude: String(EVA_LOCATION.longitude),
    elevation: String(EVA_LOCATION.elevation),
    from_date: date,
    to_date: date,
    time: DEFAULT_TIME,
  });

  const res = await fetch(`${API_BASE}/bodies/positions?${params}`, {
    headers: { Authorization: `Basic ${auth}` },
  });

  if (!res.ok) {
    throw new Error(`Astronomy API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const rows = json.data.table.rows;

  const bodies: BodyPosition[] = rows
    .map((row: any) => {
      const cell = row.cells[0];
      return {
        id: cell.id,
        name: cell.name,
        altitude: parseFloat(cell.position.horizontal.altitude.degrees),
        azimuth: parseFloat(cell.position.horizontal.azimuth.degrees),
        rightAscension: cell.position.equatorial.rightAscension.string,
        declination: cell.position.equatorial.declination.string,
        constellation: cell.position.constellation.name,
        distanceKm: cell.distance.fromEarth.km,
        distanceAu: cell.distance.fromEarth.au,
        magnitude: cell.extraInfo?.magnitude ? parseFloat(cell.extraInfo.magnitude) : undefined,
        elongation: cell.extraInfo?.elongation ? parseFloat(cell.extraInfo.elongation) : undefined,
      };
    })
    .filter((b: BodyPosition) => b.id !== 'earth');

  return {
    date,
    time: DEFAULT_TIME,
    observer: EVA_LOCATION,
    bodies,
  };
}
