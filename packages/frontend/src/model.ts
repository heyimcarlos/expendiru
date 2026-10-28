import { HouseholdSnapshot, householdFixture } from "@expendiru/domain";
import { Schema } from "effect";
import { defineTaggedUnion } from "foldkit/schema";

export const Refresh = defineTaggedUnion({
  Idle: {},
  Failed: { error: Schema.String },
});

export type Refresh = typeof Refresh.Type;

export const Model = Schema.Struct({
  snapshot: HouseholdSnapshot,
  refresh: Refresh,
  replay: Schema.Number,
});

export type Model = typeof Model.Type;

export const initialModel = Model.make({
  snapshot: householdFixture,
  refresh: Refresh.Idle(),
  replay: 0,
});
