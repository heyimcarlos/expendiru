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
