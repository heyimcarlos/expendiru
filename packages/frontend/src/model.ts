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

export const SpendMark = defineTaggedUnion({
  Idle: {},
  Bucket: { key: Schema.String },
  Merchant: { key: Schema.String },
  Day: { key: Schema.String },
});

export type SpendMark = typeof SpendMark.Type;

export const spendMarkId = (mark: SpendMark): string =>
  SpendMark.match(mark, {
    Idle: () => "",
    Bucket: ({ key }) => `bucket:${key}`,
    Merchant: ({ key }) => `merchant:${key}`,
    Day: ({ key }) => `day:${key}`,
  });

export const sameSpendMark = (left: SpendMark, right: SpendMark): boolean =>
  spendMarkId(left) === spendMarkId(right);

export const Model = Schema.Struct({
  snapshot: HouseholdSnapshot,
  refresh: Refresh,
  replay: Schema.Number,
  spend: SpendFeed,
  spendRefresh: Refresh,
  spendChart: ChartMode,
  spendFilter: SpendFilter,
  spendFocus: SpendMark,
  spendHover: SpendMark,
  spendHidden: Schema.Array(Schema.String),
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
  spendFocus: SpendMark.Idle(),
  spendHover: SpendMark.Idle(),
  spendHidden: [],
});
