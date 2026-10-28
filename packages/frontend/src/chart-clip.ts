import type { ChartMode } from "@expendiru/domain";

// Equal thirds of a 3-column track. `round` keeps the revealed pill's corners
// while the inset moves; the layer underneath is already painted in the active
// colors, so background and label change together.
export const chartClipInset = (mode: ChartMode): string => {
  if (mode === "bar") {
    return "inset(0 33.333% 0 33.333% round 7px)";
  }

  if (mode === "line") {
    return "inset(0 0 0 66.666% round 7px)";
  }

  return "inset(0 66.666% 0 0 round 7px)";
};
