/**
 * Generates an SVG path string that matches the CRT curvature distortion
 * from the fragment shader. Uses Newton's method to find the corner limit
 * where curves meet, then samples 4 edges as parametric curves.
 */
export function computeBezelPath(curvature: number): string {
  const bendSq = curvature * curvature;

  // Newton's method: solve B²x³ + x - 1 = 0
  let limit = 1.0;
  if (bendSq > 0) {
    for (let i = 0; i < 5; i++) {
      limit -= (bendSq * Math.pow(limit, 3) + limit - 1)
             / (3 * bendSq * Math.pow(limit, 2) + 1);
    }
  }

  const samples = 30;
  const pointsTop: { x: number; y: number }[] = [];
  const pointsRight: { x: number; y: number }[] = [];
  const pointsBottom: { x: number; y: number }[] = [];
  const pointsLeft: { x: number; y: number }[] = [];

  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * (2 * limit) - limit;
    const yT = -1.0 / (1.0 + bendSq * t * t);
    pointsTop.push({ x: t * 0.5 + 0.5, y: yT * 0.5 + 0.5 });
    const yB = 1.0 / (1.0 + bendSq * t * t);
    pointsBottom.push({ x: t * 0.5 + 0.5, y: yB * 0.5 + 0.5 });
    const xL = -1.0 / (1.0 + bendSq * t * t);
    pointsLeft.push({ x: xL * 0.5 + 0.5, y: t * 0.5 + 0.5 });
    const xR = 1.0 / (1.0 + bendSq * t * t);
    pointsRight.push({ x: xR * 0.5 + 0.5, y: t * 0.5 + 0.5 });
  }

  let d = `M ${pointsTop[0].x},${pointsTop[0].y} `;
  pointsTop.forEach(p => d += `L ${p.x},${p.y} `);
  pointsRight.forEach(p => d += `L ${p.x},${p.y} `);
  for (let i = samples; i >= 0; i--) d += `L ${pointsBottom[i].x},${pointsBottom[i].y} `;
  for (let i = samples; i >= 0; i--) d += `L ${pointsLeft[i].x},${pointsLeft[i].y} `;
  d += 'Z';

  return d;
}
