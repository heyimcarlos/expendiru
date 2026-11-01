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
  Loading: {},
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

export const parseSpendMark = (raw: string): SpendMark => {
  const separator = raw.indexOf(":");

  if (separator <= 0) {
    return SpendMark.Idle();
  }

  const kind = raw.slice(0, separator);
  const key = raw.slice(separator + 1);

  if (key === "") {
    return SpendMark.Idle();
  }

  if (kind === "bucket") {
    return SpendMark.Bucket({ key });
  }

  if (kind === "merchant") {
    return SpendMark.Merchant({ key });
  }

  if (kind === "day") {
    return SpendMark.Day({ key });
  }

  return SpendMark.Idle();
};

export const Model = Schema.Struct({
  snapshot: HouseholdSnapshot,
  refresh: Refresh,
  snapshotGeneration: Schema.Int,
  replay: Schema.Number,
  spend: SpendFeed,
  spendRefresh: Refresh,
  spendGeneration: Schema.Int,
  spendChart: ChartMode,
  spendFilter: SpendFilter,
  spendFocus: SpendMark,
  spendHover: SpendMark,
  spendHidden: Schema.Array(Schema.String),
  spendPage: Schema.Int,
  unknownPath: Schema.Boolean,
});

export type Model = typeof Model.Type;

export const initialModel = Model.make({
  snapshot: householdFixture,
  refresh: Refresh.Idle(),
  snapshotGeneration: 0,
  replay: 0,
  spend: spendStub,
  spendRefresh: Refresh.Idle(),
  spendGeneration: 0,
  spendChart: "line",
  spendFilter: defaultSpendFilter(spendStub.period.from, spendStub.period.to),
  spendFocus: SpendMark.Idle(),
  spendHover: SpendMark.Idle(),
  spendHidden: [],
  spendPage: 0,
  unknownPath: false,
});
