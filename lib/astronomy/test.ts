import { fetchBodyPositions } from './api';

async function main() {
  process.env.NEXT_PUBLIC_ASTRONOMY_API_AUTH =
    'MmE2NGY4N2ItMTA2Yy00MWVmLTg2ZTMtMTk2NjkyOTIxN2RmOmY2OGJkZjkxN2I3MWIxMDA3ZDIxNDVkNDU1YWQzM2I0MWY5M2I3ZmQ5YTRjYTdhYjNmYTJhODU1Y2EyMTViYjRmYzk3MzNmYTk5OTQxNDllNzcxMzI3ZWMxYjE4MTZjZjIwMWQ4NDNkMDMzYWU5MzE2MTBhYzEzZjc1MGNlNDkxYmY1NzIwYjcyYmJiZjMzM2NlNTNmODcxZTkwOTI0N2Q2NTU1MTBkM2E0ZDYyN2QyY2RiOTAxNWI4NGI1MTY3MTA0MWI2OTEyYjVkYWQ0ZTNlNWM2MzBiOWE5N2YwN2Qw';

  const sky = await fetchBodyPositions('2026-03-28');

  console.log(`Sky at ${sky.time} on ${sky.date}`);
  console.log(`Observer: ${sky.observer.latitude}, ${sky.observer.longitude}\n`);

  for (const body of sky.bodies) {
    const vis = body.altitude > 0 ? 'VISIBLE' : 'below horizon';
    console.log(
      `${body.name.padEnd(10)} alt: ${String(body.altitude).padStart(7)}°  az: ${String(body.azimuth).padStart(7)}°  in ${body.constellation.padEnd(15)} ${vis}`
    );
  }
}

main().catch(console.error);
