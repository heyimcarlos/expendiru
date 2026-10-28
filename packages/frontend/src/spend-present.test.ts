import { defaultSpendFilter, querySpend, spendStub } from "@expendiru/domain";
import { describe, expect, test } from "vitest";
import {
  barMarks,
  lineChart,
  lineChartHeight,
  lineChartWidth,
  pieCircumference,
  pieRings,
  presentSpend,
} from "./spend-present.ts";
import { bucketSlices, merchantBars } from "@expendiru/domain";

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
});
