import { computeSky, EVA_VIEW } from './stars';

const result = computeSky('2026-03-28', '20:00:00', 25.6445595, -100.3658494, EVA_VIEW);

console.log('View cone:', `${EVA_VIEW.fov_horizontal_deg}° x ${EVA_VIEW.fov_vertical_deg}°`, `facing ${EVA_VIEW.azimuth_deg}° at ${EVA_VIEW.altitude_deg}° pitch\n`);

console.log('Ratios:');
console.log(`  View / total sky:      ${(result.ratios.view_vs_total_sky * 100).toFixed(1)}%`);
console.log(`  View / above horizon:  ${(result.ratios.view_vs_above_horizon * 100).toFixed(1)}%`);
console.log(`  Stars in view:         ${result.objects.filter(o => o.in_view).length} / ${result.objects.filter(o => o.altitude > 0).length} above horizon`);

console.log('\nIn view:');
result.objects
  .filter(o => o.in_view)
  .sort((a, b) => a.magnitude - b.magnitude)
  .forEach(o => {
    console.log(`  ${o.name.padEnd(12)} mag ${o.magnitude.toString().padStart(6)}  alt ${o.altitude.toFixed(1).padStart(5)}°  az ${o.azimuth.toFixed(1).padStart(6)}°  view(${o.view_x.toFixed(2)}, ${o.view_y.toFixed(2)})`);
  });
