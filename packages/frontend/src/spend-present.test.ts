import { defaultSpendFilter, querySpend, spendStub } from "@expendiru/domain";
import { describe, expect, test } from "vitest";
import { chartClipInset } from "./chart-clip.ts";
import { SpendMark } from "./model.ts";
import {
  barMarks,
  lineChart,
  lineChartHeight,
  lineChartWidth,
  pieCircumference,
  pieRings,
  presentSpend,
  seriesColor,
} from "./spend-present.ts";
import { bucketSlices, merchantBars } from "@expendiru/domain";
import { palette } from "./theme.stylex.ts";

const rows = querySpend(
  spendStub.transactions,
  defaultSpendFilter(spendStub.period.from, spendStub.period.to),
).transactions;

describe("presentSpend", () => {
  test("formats the default october spending and hides rent", () => {
    const presented = presentSpend(
      spendStub,
      defaultSpendFilter(spendStub.period.from, spendStub.period.to),
      "pie",
    );

    expect(presented.totalLabel).toBe("$227.90");
    expect(presented.countLabel).toBe("6 transactions · $227.90 out");
    expect(presented.chartTitle).toBe("By bucket");
    expect(presented.rows.map((row) => row.title)).toEqual([
      "Stub Transit",
      "Stub Grocery",
      "Stub Dinner",
      "Stub Shop",
      "Stub Lamp",
      "Stub July",
    ]);
    expect(presented.rows.map((row) => row.title)).not.toContain("Stub Rent");
    expect(presented.rows[0]?.category).toContain("Transportation");
    expect(presented.rows[0]?.category).toContain("public transit");
    expect(presented.rows[0]?.bucket).toBe("Carlos");
    expect(presented.rows[0]?.detail).toBe("Carlos · Carlos Scene+ Visa");
    expect(presented.rows[0]?.pending).toBe(true);
    expect(presented.amountError).toBe(false);
  });

  test("draws a symmetrical pie, proportional bars, and an integer line", () => {
    const rings = pieRings(bucketSlices(rows));
    let painted = 0;

    for (const ring of rings) {
      painted += ring.length;
    }

    expect(rings[0]?.offset).toBeCloseTo(pieCircumference / 4, 5);
    expect(painted + 2 * rings.length).toBeCloseTo(pieCircumference, 4);

    const bars = barMarks(merchantBars(rows, 8));

    expect(bars[0]?.widthPercent).toBe(100);
    expect(bars[0]?.label).toBe("Stub Lamp");
    expect(bars.at(-1)?.widthPercent).toBeLessThan(100);

    const presented = presentSpend(
      spendStub,
      defaultSpendFilter(spendStub.period.from, spendStub.period.to),
      "line",
    );

    expect(presented.line.points).toHaveLength(119);
    expect(presented.line.firstDate).toBe("2026-07-01");
    expect(presented.line.lastDate).toBe("2026-10-27");
    expect(presented.line.width).toBe(lineChartWidth);
    expect(presented.line.height).toBe(lineChartHeight);
    expect(presented.line.points[0]?.x).toBe(16);
    expect(presented.line.points.at(-1)?.x).toBe(lineChartWidth - 16);

    for (const point of presented.line.points) {
      expect(Number.isInteger(point.x)).toBe(true);
      expect(Number.isInteger(point.y)).toBe(true);
    }

    const peak = lineChart(presented.line.points.map((point) => ({
      date: point.date,
      cents: point.cents,
    })));

    expect(peak.top).toBe(16);
    expect(peak.baseline).toBe(lineChartHeight - 16);
  });

  test("a bucket focus narrows the list and leaves the other slices drawn", () => {
    const presented = presentSpend(
      spendStub,
      defaultSpendFilter(spendStub.period.from, spendStub.period.to),
      "pie",
      SpendMark.Bucket({ key: "household" }),
    );

    expect(presented.rows.map((row) => row.title)).toEqual(["Stub Grocery"]);
    expect(presented.countLabel).toBe("1 transaction · $42.10 out");
    expect(presented.rings.map((ring) => ring.key)).toContain("together");
    expect(presented.chartEmpty).toBe(false);
  });

  test("hiding a series drops it from the pie and the list", () => {
    const presented = presentSpend(
      spendStub,
      defaultSpendFilter(spendStub.period.from, spendStub.period.to),
      "pie",
      SpendMark.Idle(),
      ["household"],
    );

    expect(presented.rows.map((row) => row.title)).not.toContain("Stub Grocery");
    expect(presented.rings.map((ring) => ring.key)).not.toContain("household");
  });

  test("uses a real red and a quiet series color instead of pink", () => {
    expect(palette.red).toBe("#d1242f");
    expect(palette.green).toBe("#18794e");
    expect(palette.red).not.toBe("#ffc9c9");
    expect(seriesColor(4)).toBe("#3d4d73");

    const rings = pieRings(bucketSlices(rows));
    const move = rings.find((ring) => ring.key === "move_oneoffs");

    expect(move?.color).toBe("#3d4d73");
  });
});

describe("chart clip", () => {
  test("reveals one third of the duplicated tab layer", () => {
    expect(chartClipInset("pie")).toBe("inset(0 66.666% 0 0 round 7px)");
    expect(chartClipInset("bar")).toBe("inset(0 33.333% 0 33.333% round 7px)");
    expect(chartClipInset("line")).toBe("inset(0 0 0 66.666% round 7px)");
  });
});
