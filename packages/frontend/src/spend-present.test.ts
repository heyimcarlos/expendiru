import { defaultSpendFilter, querySpend, spendStub } from "@expendiru/domain";
import { describe, expect, test } from "vitest";
import { chartClipInset } from "./chart-clip.ts";
import { SpendMark } from "./model.ts";
import {
  barMarks,
  pieCircumference,
  pieRings,
  presentSpend,
  seriesColor,
  stackChart,
  stackChartHeight,
  stackChartWidth,
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

  test("draws a closed donut, proportional bars, and a monthly stack", () => {
    const rings = pieRings(bucketSlices(rows));
    let painted = 0;

    for (const ring of rings) {
      painted += ring.length;
    }

    expect(rings[0]?.offset).toBeCloseTo(pieCircumference / 4, 5);
    expect(rings[0]?.d.startsWith("M 120 31")).toBe(true);
    expect(rings[0]?.d.endsWith("Z")).toBe(true);
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

    expect(presented.chartTitle).toBe("By month");
    expect(presented.stack.empty).toBe(false);
    expect(presented.stack.width).toBe(stackChartWidth);
    expect(presented.stack.height).toBe(stackChartHeight);
    expect(presented.stack.months.map((month) => month.label)).toEqual([
      "Jul '26",
      "Aug",
      "Sep",
      "Oct",
    ]);
    expect(presented.stack.bands.map((band) => band.label)).toEqual([
      "Household",
      "Together",
      "Carlos",
      "Maria",
    ]);
    expect(presented.stack.bands.map((band) => band.callout)).toEqual([
      "Household 13.0%",
      "Together 11.5%",
      "Carlos 52.8%",
      "Maria 22.6%",
    ]);
    expect(presented.stack.bands.map((band) => band.cents)).toEqual([
      385_143, 238_739, 1_144_448, 598_499,
    ]);
    expect(presented.stack.bands.every((band) => band.path.endsWith("Z"))).toBe(true);
    expect(presented.stack.bands.every((band) => band.line.includes("C"))).toBe(true);
    expect(presented.stack.months[0]?.x).toBe(4);
    expect(presented.stack.months.at(-1)?.x).toBe(stackChartWidth - 136);

    const drawn = stackChart(presented.stack.months.map(() => ({
      month: "2026-10",
      household: 0,
      together: 0,
      carlosPersonal: 0,
      mariaPersonal: 0,
    })));

    expect(drawn.empty).toBe(true);
    expect(drawn.height).toBe(stackChartHeight);
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
    expect(seriesColor(4)).toBe("#b3aa9e");

    const rings = pieRings(bucketSlices(rows));
    const move = rings.find((ring) => ring.key === "move_oneoffs");

    expect(move?.color).toBe("#b3aa9e");
  });
});

describe("chart clip", () => {
  test("reveals one third of the duplicated tab layer", () => {
    expect(chartClipInset("pie")).toBe("inset(0 66.666% 0 0 round 7px)");
    expect(chartClipInset("bar")).toBe("inset(0 33.333% 0 33.333% round 7px)");
    expect(chartClipInset("line")).toBe("inset(0 0 0 66.666% round 7px)");
  });
});
