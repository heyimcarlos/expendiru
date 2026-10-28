import { ChartMode, HouseholdSnapshot, SpendFeed, SpendFilter } from "@expendiru/domain";
import { Schema } from "effect";
import { defineMessageUnion } from "foldkit/message";
import { SpendMark } from "./model.ts";

export const Message = defineMessageUnion({
  LoadedSnapshot: { snapshot: HouseholdSnapshot },
  FailedLoadSnapshot: { error: Schema.String },
  ClickedReplay: {},
  ClickedRetry: {},
  LoadedSpend: { feed: SpendFeed },
  FailedLoadSpend: { error: Schema.String },
  ClickedChart: { mode: ChartMode },
  ChangedSpendFilter: { filter: SpendFilter },
  ClickedResetSpend: {},
  ClickedRetrySpend: {},
  ClickedSpendMark: { mark: SpendMark },
  HoveredSpendMark: { mark: SpendMark },
  ClearedSpendHover: {},
  ToggledSpendSeries: { key: Schema.String },
});

export type Message = typeof Message.Type;
