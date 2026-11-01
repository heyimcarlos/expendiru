import { Api } from "@expendiru/api";
import { householdFixture, spendStub } from "@expendiru/domain";
import { Config, ConfigProvider, Effect, Option, Schema } from "effect";
import { HttpApiClient } from "effect/http-api";
import { Command, Dom, Http } from "foldkit";
import { load, pushUrl, replaceUrl } from "foldkit/navigation";
import { Message } from "./message.ts";
import { spendPath } from "./route.ts";

const viteApiUrl = import.meta.env.VITE_API_URL;

const apiUrlConfig = ConfigProvider.layer(
  ConfigProvider.fromUnknown(
    viteApiUrl === undefined || viteApiUrl === ""
      ? {}
      : { VITE_API_URL: viteApiUrl },
  ),
);

export const apiBaseUrl = (configured: string): string =>
  configured === "same-origin" ? "" : configured;

const loadSnapshot = Effect.fn("Household.loadSnapshot")(
  function* (generation: number) {
    const apiUrl = yield* Config.option(Config.String("VITE_API_URL"));

    if (Option.isNone(apiUrl)) {
      return Message.LoadedSnapshot({ snapshot: householdFixture, generation });
    }

    const client = yield* HttpApiClient.make(Api, {
      baseUrl: apiBaseUrl(apiUrl.value),
    });

    const snapshot = yield* client.Household.getSnapshot();

    return Message.LoadedSnapshot({ snapshot, generation });
  },
  (effect, generation) =>
    effect.pipe(
      Effect.catch((error) =>
        Effect.succeed(
          Message.FailedLoadSnapshot({
            error: globalThis.String(error),
            generation,
          }),
        ),
      ),
      Effect.provide(Http.layer),
      Effect.provide(apiUrlConfig),
    ),
);

const loadSpend = Effect.fn("Household.loadSpend")(
  function* (generation: number) {
    const apiUrl = yield* Config.option(Config.String("VITE_API_URL"));

    if (Option.isNone(apiUrl)) {
      return Message.LoadedSpend({ feed: spendStub, generation });
    }

    const client = yield* HttpApiClient.make(Api, {
      baseUrl: apiBaseUrl(apiUrl.value),
    });

    const feed = yield* client.Household.getSpend();

    return Message.LoadedSpend({ feed, generation });
  },
  (effect, generation) =>
    effect.pipe(
      Effect.catch((error) =>
        Effect.succeed(
          Message.FailedLoadSpend({
            error: globalThis.String(error),
            generation,
          }),
        ),
      ),
      Effect.provide(Http.layer),
      Effect.provide(apiUrlConfig),
    ),
);

export const LoadSnapshot = Command.define("LoadSnapshot", {
  args: { generation: Schema.Int },
  messages: [Message.LoadedSnapshot, Message.FailedLoadSnapshot],
  interrupt: true,
  execute: ({ generation }) => loadSnapshot(generation),
});

export const LoadSpend = Command.define("LoadSpend", {
  args: { generation: Schema.Int },
  messages: [Message.LoadedSpend, Message.FailedLoadSpend],
  interrupt: true,
  execute: ({ generation }) => loadSpend(generation),
});

export const ReplaceSpendUrl = Command.define("ReplaceSpendUrl", {
  args: {
    chart: Schema.Literals(["pie", "bar", "line"]),
    person: Schema.String,
    mark: Schema.String,
    page: Schema.Int,
  },
  messages: [Message.CompletedReplaceSpendUrl],
  execute: (location) =>
    replaceUrl(spendPath(location)).pipe(
      Effect.as(Message.CompletedReplaceSpendUrl()),
    ),
});

export const NavigateInternal = Command.define("NavigateInternal", {
  args: { url: Schema.String },
  messages: [Message.CompletedNavigateInternal],
  execute: ({ url }) =>
    pushUrl(url).pipe(Effect.as(Message.CompletedNavigateInternal())),
});

export const LoadExternal = Command.define("LoadExternal", {
  args: { href: Schema.String },
  messages: [Message.CompletedLoadExternal],
  execute: ({ href }) =>
    load(href).pipe(Effect.as(Message.CompletedLoadExternal())),
});

export const FocusControl = Command.define("FocusControl", {
  args: { id: Schema.String, preventScroll: Schema.Boolean },
  messages: [Message.CompletedFocusControl],
  execute: ({ id, preventScroll }) =>
    Dom.focus(`#${id}`, { preventScroll }).pipe(
      Effect.as(Message.CompletedFocusControl()),
      Effect.catch(() => Effect.succeed(Message.CompletedFocusControl())),
    ),
});
