import { ChartMode, HouseholdSnapshot, SpendFeed, SpendFilter } from "@expendiru/domain";
import { Schema } from "effect";
import { defineMessageUnion } from "foldkit/message";

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
});

export type Message = typeof Message.Type;
