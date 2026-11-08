import { basins, contours, grid, LEVELS } from './field';

/* The static contour drawing on the Lab teaser. Constant data, so one computation serves every request. */
const NX = 64, NY = 30;
export const LAB_MINI_PATHS = contours(grid(basins(11), 2, NX, NY), NX, NY, LEVELS).map((seg) => {
  let d = '';
  for (let q = 0; q < seg.length; q += 4) d += `M${(seg[q] / (NX - 1) * 400).toFixed(1)} ${(seg[q + 1] / (NY - 1) * 190).toFixed(1)}L${(seg[q + 2] / (NX - 1) * 400).toFixed(1)} ${(seg[q + 3] / (NY - 1) * 190).toFixed(1)}`;
  return d;
});
