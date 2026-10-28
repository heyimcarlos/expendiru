import { householdFixture } from "@expendiru/domain";
import { describe, expect, test } from "vitest";
import { presentHousehold } from "./present.ts";

describe("presentHousehold", () => {
  test("shows the fund, both visas, and the four buckets", () => {
    const presented = presentHousehold(householdFixture);

    expect(presented.emergencyName).toBe("Emergency fund");
    expect(presented.savedLabel).toBe("$7,450.00");
    expect(presented.targetLabel).toBe("$12,000.00");
    expect(presented.savedCaption).toContain("62.1%");

    expect(presented.cards.map((card) => card.label)).toEqual([
      "Scotia Visa · Carlos",
      "Scotia Visa · Maria",
    ]);
    expect(presented.cards.map((card) => card.roomLabel)).toEqual([
      "$5,859.45",
      "$4,139.80",
    ]);

    expect(presented.buckets.map((bucket) => bucket.name)).toEqual([
      "Household",
      "Together",
      "Carlos",
      "Maria",
    ]);
    expect(presented.buckets.map((bucket) => bucket.standing)).toEqual([
      "under",
      "over",
      "under",
      "over",
    ]);
    expect(presented.buckets.map((bucket) => bucket.paceLabel)).toEqual([
      "$2,890.32",
      "$812.90",
      "$406.45",
      "$406.45",
    ]);
  });
});
