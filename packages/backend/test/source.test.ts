import { householdFixture } from "@expendiru/domain";
import * as Effect from "effect/Effect";
import { describe, expect, test } from "vitest";
import { FixtureHouseholdSource, HouseholdSource } from "../src/source.ts";

describe("FixtureHouseholdSource", () => {
  test("loads the shared household fixture", async () => {
    const snapshot = await Effect.runPromise(
      Effect.gen(function* () {
        const source = yield* HouseholdSource;
        return yield* source.load;
      }).pipe(Effect.provide(FixtureHouseholdSource)),
    );

    expect(snapshot).toEqual(householdFixture);
  });
});
