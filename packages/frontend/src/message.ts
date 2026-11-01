import { ChartMode, HouseholdSnapshot, SpendFeed, SpendFilter } from "@expendiru/domain";
import { Schema } from "effect";
import { Command } from "foldkit";
import { UrlRequest } from "foldkit/navigation";
import { defineMessageUnion } from "foldkit/message";
import { Url } from "foldkit/url";
import { SpendMark } from "./model.ts";

export const Message = defineMessageUnion({
  LoadedSnapshot: { snapshot: HouseholdSnapshot, generation: Schema.Int },
  FailedLoadSnapshot: { error: Schema.String, generation: Schema.Int },
  CompletedCancelLoadSnapshot: { outcome: Command.Interruptible.Outcome },
  ClickedReplay: {},
  ClickedRetry: {},
  LoadedSpend: { feed: SpendFeed, generation: Schema.Int },
  FailedLoadSpend: { error: Schema.String, generation: Schema.Int },
  CompletedCancelLoadSpend: { outcome: Command.Interruptible.Outcome },
  ClickedChart: { mode: ChartMode },
  ChangedSpendFilter: { filter: SpendFilter },
  ClickedResetSpend: {},
  ClickedRetrySpend: {},
  ClickedSpendMark: { mark: SpendMark },
  HoveredSpendMark: { mark: SpendMark },
  ClearedSpendHover: {},
  ToggledSpendSeries: { key: Schema.String },
  ClickedSpendPage: { page: Schema.Int },
  ClickedLink: { request: UrlRequest },
  ChangedUrl: { url: Url },
  ClickedHome: {},
  CompletedReplaceSpendUrl: {},
  CompletedNavigateInternal: {},
  CompletedLoadExternal: {},
  CompletedFocusControl: {},
});

export type Message = typeof Message.Type;
