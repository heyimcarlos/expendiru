import type { HouseholdSnapshot, SpendFeed } from "@expendiru/domain";
import type { Update } from "foldkit";
import { modifyFields } from "foldkit/struct";
import { LoadSnapshot, LoadSpend } from "../command.ts";
import { Message } from "../message.ts";
import { Model, Refresh } from "../model.ts";
import { acceptSpendFeed } from "./location.ts";

export const retrySnapshot = (model: Model): Update.Return<Model, Message> => ({
  model: modifyFields(model, {
    snapshotGeneration: (generation) => generation + 1,
    refresh: () => Refresh.Loading(),
  }),
  commands: [
    LoadSnapshot.Interrupt((outcome) =>
      Message.CompletedCancelLoadSnapshot({ outcome }),
    ),
  ],
});

export const retrySpend = (model: Model): Update.Return<Model, Message> => ({
  model: modifyFields(model, {
    spendGeneration: (generation) => generation + 1,
    spendRefresh: () => Refresh.Loading(),
  }),
  commands: [
    LoadSpend.Interrupt((outcome) => Message.CompletedCancelLoadSpend({ outcome })),
  ],
});

export const startSnapshot = (model: Model): Update.Return<Model, Message> => ({
  model,
  commands: [LoadSnapshot({ generation: model.snapshotGeneration })],
});

export const startSpend = (model: Model): Update.Return<Model, Message> => ({
  model,
  commands: [LoadSpend({ generation: model.spendGeneration })],
});

export const acceptSnapshot = (
  model: Model,
  snapshot: HouseholdSnapshot,
  generation: number,
): Update.Return<Model, Message> => {
  if (generation !== model.snapshotGeneration) {
    return { model };
  }

  return {
    model: modifyFields(model, {
      snapshot: () => snapshot,
      refresh: () => Refresh.Idle(),
    }),
  };
};

export const failSnapshot = (
  model: Model,
  error: string,
  generation: number,
): Update.Return<Model, Message> => {
  if (generation !== model.snapshotGeneration) {
    return { model };
  }

  return {
    model: modifyFields(model, {
      refresh: () => Refresh.Failed({ error }),
    }),
  };
};

export const acceptSpend = (
  model: Model,
  feed: SpendFeed,
  generation: number,
): Update.Return<Model, Message> => {
  if (generation !== model.spendGeneration) {
    return { model };
  }

  return {
    model: modifyFields(acceptSpendFeed(model, feed), {
      spendRefresh: () => Refresh.Idle(),
    }),
  };
};

export const failSpend = (
  model: Model,
  error: string,
  generation: number,
): Update.Return<Model, Message> => {
  if (generation !== model.spendGeneration) {
    return { model };
  }

  return {
    model: modifyFields(model, {
      spendRefresh: () => Refresh.Failed({ error }),
    }),
  };
};
