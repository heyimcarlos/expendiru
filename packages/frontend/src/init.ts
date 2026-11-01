import type { Runtime } from "foldkit";
import { modifyFields } from "foldkit/struct";
import { LoadSnapshot, LoadSpend } from "./command.ts";
import { Message } from "./message.ts";
import { Model, Refresh, initialModel } from "./model.ts";
import { urlToAppRoute } from "./route.ts";
import { modelFromRoute } from "./steps/location.ts";

export const init: Runtime.RoutingApplicationInit<Model, Message> = (url) => ({
  model: modelFromRoute(
    modifyFields(initialModel, {
      refresh: () => Refresh.Loading(),
      spendRefresh: () => Refresh.Loading(),
    }),
    urlToAppRoute(url),
  ),
  commands: [LoadSnapshot({ generation: 0 }), LoadSpend({ generation: 0 })],
});
