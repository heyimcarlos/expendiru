import { householdFixture, type HouseholdSnapshot } from "@expendiru/domain";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

export class HouseholdSource extends Context.Service<
  HouseholdSource,
  {
    readonly load: Effect.Effect<HouseholdSnapshot>;
  }
>()("expendiru/HouseholdSource") {}

export const FixtureHouseholdSource = Layer.succeed(HouseholdSource, {
  load: Effect.succeed(householdFixture),
});
