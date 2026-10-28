import { Schema } from "effect";
import { describe, expect, test } from "vitest";
import {
  HouseholdSnapshot,
  formatCad,
  householdFixture,
  paceCents,
  paceStanding,
  roomLeftCents,
  sharePercent,
} from "./household.ts";

describe("household fixture", () => {
  test("decodes as a Toronto snapshot with placeholder labels", () => {
    const decoded = Schema.decodeUnknownSync(HouseholdSnapshot)(householdFixture);
    expect(decoded.city).toBe("Toronto");
    expect(decoded.householdName).toBe("Carlos & Maria");
    expect(decoded.source).toBe("fixture");
    expect(decoded.cards.map((card) => card.label)).toEqual([
      "Scotia Visa · Carlos",
      "Scotia Visa · Maria",
    ]);
    expect(decoded.buckets.map((bucket) => bucket.id)).toEqual([
      "household",
      "together",
      "carlos",
      "maria",
    ]);
    expect(JSON.stringify(decoded)).not.toMatch(/\d{4}[-\s]\d{4}/);
  });

  test("formats CAD from cents", () => {
    expect(formatCad(745_000)).toBe("$7,450.00");
    expect(formatCad(214_055)).toBe("$2,140.55");
    expect(formatCad(-50)).toBe("-$0.50");
  });

  test("paces October on day 28 of 31", () => {
    expect(paceCents(320_000, 28, 31)).toBe(289_032);
    expect(paceCents(90_000, 28, 31)).toBe(81_290);
    expect(paceCents(45_000, 28, 31)).toBe(40_645);
    expect(paceCents(45_000, 28, 0)).toBe(0);
  });

  test("compares the four buckets with room left on both Visas", () => {
    const [carlos, maria] = householdFixture.cards;
    expect(roomLeftCents(carlos.limit.cents, carlos.balance.cents)).toBe(585_945);
    expect(roomLeftCents(maria.limit.cents, maria.balance.cents)).toBe(413_980);

    const standings = householdFixture.buckets.map((bucket) =>
      paceStanding(
        bucket.spent.cents,
        paceCents(
          bucket.budget.cents,
          householdFixture.dayOfMonth,
          householdFixture.daysInMonth,
        ),
      ),
    );
    expect(standings).toEqual(["under", "over", "under", "over"]);
    expect(sharePercent(745_000, 1_200_000)).toBeCloseTo(62.083, 2);
  });
});
