/**
 * Pure geometry helpers for Duolingo-style continuous winding course paths.
 */

export interface PathPoint {
  x: number;
  y: number;
}

function roundCoord(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Returns a deterministic horizontal percentage within [26, 74] so lesson circles
 * trace smooth alternating S-curves without clipping on narrow 360px viewports.
 * The final node (typically the reward chest) always lands centered at 50%.
 */
export function getDuolingoNodeOffsetPercent(
  unitNumber: number,
  nodeIndex: number,
  totalNodes: number
): number {
  if (totalNodes <= 1 || nodeIndex >= totalNodes - 1) {
    return 50;
  }

  const isOddUnit = Math.abs(unitNumber) % 2 === 1;

  if (totalNodes === 4) {
    const seq = isOddUnit ? [30, 72, 28, 50] : [70, 28, 72, 50];
    return seq[nodeIndex] ?? 50;
  }

  if (totalNodes === 5) {
    const seq = isOddUnit ? [50, 26, 74, 28, 50] : [50, 74, 26, 72, 50];
    return seq[nodeIndex] ?? 50;
  }

  const baseSeq = isOddUnit ? [50, 26, 72, 28, 74] : [50, 74, 28, 72, 26];
  if (nodeIndex < baseSeq.length) {
    return baseSeq[nodeIndex];
  }

  const phase = isOddUnit ? 0 : Math.PI;
  const wave = Math.sin(nodeIndex * 1.45 + phase);
  const pct = Math.round(50 + wave * 24);
  return Math.max(26, Math.min(74, pct));
}

/**
 * Generates an SVG path string passing cleanly through the center of every node
 * using smooth vertical S-shaped cubic Bezier segments. When consecutive nodes are
 * nearly vertically aligned, an alternating horizontal bulge keeps the thread curvy.
 */
export function buildCurvySvgPath(points: PathPoint[]): string {
  if (points.length < 2) return '';

  let d = `M ${roundCoord(points[0].x)} ${roundCoord(points[0].y)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    let c1x: number;
    let c1y: number;
    let c2x: number;
    let c2y: number;

    if (Math.abs(dx) < 22) {
      const bulge = (i % 2 === 0 ? 1 : -1) * 42;
      c1x = p1.x + bulge;
      c1y = p1.y + dy * 0.45;
      c2x = p2.x - bulge;
      c2y = p2.y - dy * 0.45;
    } else {
      c1x = p1.x;
      c1y = p1.y + dy * 0.58;
      c2x = p2.x;
      c2y = p2.y - dy * 0.58;
    }

    d += ` C ${roundCoord(c1x)} ${roundCoord(c1y)}, ${roundCoord(c2x)} ${roundCoord(c2y)}, ${roundCoord(p2.x)} ${roundCoord(p2.y)}`;
  }

  return d;
}
