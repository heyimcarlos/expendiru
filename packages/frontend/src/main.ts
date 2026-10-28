import type { HouseholdSnapshot } from "@expendiru/domain";
import { Runtime, type Update } from "foldkit";
import { modifyFields } from "foldkit/struct";
import { LoadSnapshot } from "./command.ts";
import { Message } from "./message.ts";
import { Model, Refresh, initialModel } from "./model.ts";

export { LoadSnapshot } from "./command.ts";
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
  commands: [LoadSnapshot()],
});
