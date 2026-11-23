import { describe, it, expect } from 'vitest';
import {
  buildCurvySvgPath,
  getDuolingoNodeOffsetPercent,
  type PathPoint,
} from '../utils/pathGeometry';

describe('Winding Path Geometry (Duolingo-style Continuous Route)', () => {
  it('keeps all offsets inside [26, 74] and centers the final chest at 50% for lengths 4, 5, 6+', () => {
    for (const total of [4, 5, 6, 8]) {
      for (const unitNum of [1, 2, 7, 8]) {
        const offsets = Array.from({ length: total }, (_, idx) =>
          getDuolingoNodeOffsetPercent(unitNum, idx, total)
        );
        for (const pct of offsets) {
          expect(pct).toBeGreaterThanOrEqual(26);
          expect(pct).toBeLessThanOrEqual(74);
        }
        expect(offsets[total - 1]).toBe(50);

        // Verify lateral alternation / curves exist
        const unique = new Set(offsets);
        expect(unique.size).toBeGreaterThanOrEqual(3);
      }
    }

    // Odd and even units mirror horizontally so consecutive courses flow naturally
    expect(getDuolingoNodeOffsetPercent(1, 0, 4)).not.toBe(
      getDuolingoNodeOffsetPercent(2, 0, 4)
    );
    expect(getDuolingoNodeOffsetPercent(1, 1, 5)).toBe(26);
    expect(getDuolingoNodeOffsetPercent(2, 1, 5)).toBe(74);
  });

  it('returns empty path for fewer than 2 points and builds N-1 cubic curves passing through all centers', () => {
    expect(buildCurvySvgPath([])).toBe('');
    expect(buildCurvySvgPath([{ x: 100, y: 50 }])).toBe('');

    const pts: PathPoint[] = [
      { x: 200, y: 40 },
      { x: 110, y: 170 },
      { x: 300, y: 300 },
      { x: 200, y: 430 },
    ];
    const d = buildCurvySvgPath(pts);

    expect(d.startsWith('M 200 40')).toBe(true);
    const cubicSegments = d.match(/ C /g) || [];
    expect(cubicSegments).toHaveLength(pts.length - 1);

    for (const pt of pts.slice(1)) {
      expect(d).toContain(`${pt.x} ${pt.y}`);
    }
  });

  it('adds alternating organic horizontal bulge when consecutive points share almost the same X coordinate', () => {
    const straightVerticalPts: PathPoint[] = [
      { x: 200, y: 50 },
      { x: 200, y: 180 },
      { x: 205, y: 310 },
    ];
    const d = buildCurvySvgPath(straightVerticalPts);
    expect(d).toContain('C 242 ');
    expect(d).toContain('C 158 ');
  });
});
