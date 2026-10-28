import { householdFixture } from "@expendiru/domain";
import { expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { HouseholdSource } from "../src/source.ts";

it.effect("loads the shared household fixture", () =>
  Effect.gen(function* () {
    const source = yield* HouseholdSource.Service;
    const snapshot = yield* source.load();
    expect(snapshot).toEqual(householdFixture);
  }).pipe(Effect.provide(HouseholdSource.layer)),
);

it.effect("decodes the generated live snapshot", () =>
  Effect.gen(function* () {
    const source = yield* HouseholdSource.Service;
    const snapshot = yield* source.load();

    expect(snapshot.city).toBe("Toronto");
    expect(snapshot.householdName).toBe("Carlos & Maria");
    expect(snapshot.buckets.map((bucket) => bucket.id)).toEqual([
      "household",
      "together",
      "carlos",
      "maria",
    ]);
  }).pipe(Effect.provide(HouseholdSource.liveLayer)),
);
