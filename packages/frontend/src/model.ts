import {
  ChartMode,
  HouseholdSnapshot,
  SpendFeed,
  SpendFilter,
  defaultSpendFilter,
  householdFixture,
  spendStub,
} from "@expendiru/domain";
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
  spend: SpendFeed,
  spendRefresh: Refresh,
  spendChart: ChartMode,
  spendFilter: SpendFilter,
});

export type Model = typeof Model.Type;

export const initialModel = Model.make({
  snapshot: householdFixture,
  refresh: Refresh.Idle(),
  replay: 0,
  spend: spendStub,
  spendRefresh: Refresh.Idle(),
  spendChart: "pie",
  spendFilter: defaultSpendFilter(spendStub.period.from, spendStub.period.to),
});
