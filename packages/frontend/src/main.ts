import {
  type HouseholdSnapshot,
  type SpendFeed,
  defaultSpendFilter,
  sameSpendFilter,
} from "@expendiru/domain";
import { Runtime, type Update } from "foldkit";
import { modifyFields } from "foldkit/struct";
import { LoadSnapshot, LoadSpend } from "./command.ts";
import { Message } from "./message.ts";
import { Model, Refresh, SpendMark, initialModel, sameSpendMark } from "./model.ts";

export { LoadSnapshot, LoadSpend } from "./command.ts";

export { Message } from "./message.ts";

export { Model, Refresh, initialModel } from "./model.ts";

export { view } from "./view.ts";

type UpdateReturn = Update.Return<Model, Message>;

export const update = (model: Model, message: Message) =>
  Message.match<UpdateReturn>(message, {
    LoadedSnapshot: ({ snapshot }) => ({
      model: replaceSnapshot(model, snapshot),
    }),
    FailedLoadSnapshot: ({ error }) => ({
      model: modifyFields(model, {
        refresh: () => Refresh.Failed({ error }),
      }),
    }),
    ClickedReplay: () => ({
      model: modifyFields(model, {
        replay: (replay) => replay + 1,
      }),
    }),
    ClickedRetry: () => ({
      model,
      commands: [LoadSnapshot()],
    }),
    LoadedSpend: ({ feed }) => ({
      model: replaceSpend(model, feed),
    }),
    FailedLoadSpend: ({ error }) => ({
      model: modifyFields(model, {
        spendRefresh: () => Refresh.Failed({ error }),
      }),
    }),
    ClickedChart: ({ mode }) => ({
      model: modifyFields(model, {
        spendChart: () => mode,
        spendFocus: () => SpendMark.Idle(),
        spendHover: () => SpendMark.Idle(),
        spendHidden: () => [],
      }),
    }),
    ChangedSpendFilter: ({ filter }) => ({
      model: modifyFields(model, {
        spendFilter: () => filter,
        spendFocus: () => SpendMark.Idle(),
        spendHover: () => SpendMark.Idle(),
      }),
    }),
    ClickedResetSpend: () => ({
      model: modifyFields(model, {
        spendFilter: () => defaultSpendFilter(model.spend.period.from, model.spend.period.to),
        spendFocus: () => SpendMark.Idle(),
        spendHover: () => SpendMark.Idle(),
        spendHidden: () => [],
      }),
    }),
    ClickedRetrySpend: () => ({
      model,
      commands: [LoadSpend()],
    }),
    ClickedSpendMark: ({ mark }) => ({
      model: modifyFields(model, {
        spendFocus: (current) =>
          sameSpendMark(current, mark) ? SpendMark.Idle() : mark,
      }),
    }),
    HoveredSpendMark: ({ mark }) => ({
      model: modifyFields(model, {
        spendHover: () => mark,
      }),
    }),
    ClearedSpendHover: () => ({
      model: modifyFields(model, {
        spendHover: () => SpendMark.Idle(),
      }),
    }),
    ToggledSpendSeries: ({ key }) => ({
      model: modifyFields(model, {
        spendHidden: (hidden) => toggleHidden(hidden, key),
        spendFocus: (focus) => (focusKey(focus) === key ? SpendMark.Idle() : focus),
      }),
    }),
  });

const replaceSpend = (model: Model, feed: SpendFeed): Model => {
  const nextFilter = sameSpendFilter(
    model.spendFilter,
    defaultSpendFilter(model.spend.period.from, model.spend.period.to),
  )
    ? defaultSpendFilter(feed.period.from, feed.period.to)
    : model.spendFilter;

  return modifyFields(model, {
    spend: () => feed,
    spendRefresh: () => Refresh.Idle(),
    spendFilter: () => nextFilter,
    spendFocus: () => SpendMark.Idle(),
    spendHover: () => SpendMark.Idle(),
    spendHidden: () => [],
  });
};

const toggleHidden = (hidden: ReadonlyArray<string>, key: string): ReadonlyArray<string> => {
  const next: Array<string> = [];
  let found = false;

  for (const item of hidden) {
    if (item === key) {
      found = true;
      continue;
    }

    next.push(item);
  }

  if (!found) {
    next.push(key);
  }

  return next;
};

const focusKey = (focus: SpendMark): string =>
  SpendMark.match(focus, {
    Idle: () => "",
    Bucket: ({ key }) => key,
    Merchant: ({ key }) => key,
    Day: ({ key }) => key,
  });

const replaceSnapshot = (
  model: Model,
  snapshot: HouseholdSnapshot,
): Model =>
  modifyFields(model, {
    snapshot: () => snapshot,
    refresh: () => Refresh.Idle(),
  });

export const init: Runtime.ApplicationInit<Model, Message> = () => ({
  model: initialModel,
  commands: [LoadSnapshot(), LoadSpend()],
});
