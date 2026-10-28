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
import { Model, Refresh, initialModel } from "./model.ts";

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
      }),
    }),
    ChangedSpendFilter: ({ filter }) => ({
      model: modifyFields(model, {
        spendFilter: () => filter,
      }),
    }),
    ClickedResetSpend: () => ({
      model: modifyFields(model, {
        spendFilter: () => defaultSpendFilter(model.spend.period.from, model.spend.period.to),
      }),
    }),
    ClickedRetrySpend: () => ({
      model,
      commands: [LoadSpend()],
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
  });
};

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
