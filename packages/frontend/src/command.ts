import { Api } from "@expendiru/api";
import { householdFixture, spendStub } from "@expendiru/domain";
import { Config, ConfigProvider, Effect, Option } from "effect";
import { HttpApiClient } from "effect/http-api";
import { Command, Http } from "foldkit";
import { Message } from "./message.ts";

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
  function* () {
    const apiUrl = yield* Config.option(Config.String("VITE_API_URL"));

    if (Option.isNone(apiUrl)) {
      return Message.LoadedSnapshot({ snapshot: householdFixture });
    }

    const client = yield* HttpApiClient.make(Api, {
      baseUrl: apiBaseUrl(apiUrl.value),
    });

    const snapshot = yield* client.Household.getSnapshot();

    return Message.LoadedSnapshot({ snapshot });
  },
  (effect) =>
    effect.pipe(
      Effect.catch((error) =>
        Effect.succeed(
          Message.FailedLoadSnapshot({ error: globalThis.String(error) }),
        ),
      ),
      Effect.provide(Http.layer),
      Effect.provide(apiUrlConfig),
    ),
);

const loadSpend = Effect.fn("Household.loadSpend")(
  function* () {
    const apiUrl = yield* Config.option(Config.String("VITE_API_URL"));

    if (Option.isNone(apiUrl)) {
      return Message.LoadedSpend({ feed: spendStub });
    }

    const client = yield* HttpApiClient.make(Api, {
      baseUrl: apiBaseUrl(apiUrl.value),
    });

    const feed = yield* client.Household.getSpend();

    return Message.LoadedSpend({ feed });
  },
  (effect) =>
    effect.pipe(
      Effect.catch((error) =>
        Effect.succeed(Message.FailedLoadSpend({ error: globalThis.String(error) })),
      ),
      Effect.provide(Http.layer),
      Effect.provide(apiUrlConfig),
    ),
);

export const LoadSnapshot = Command.define("LoadSnapshot", {
  messages: [Message.LoadedSnapshot, Message.FailedLoadSnapshot],
  execute: loadSnapshot(),
});

export const LoadSpend = Command.define("LoadSpend", {
  messages: [Message.LoadedSpend, Message.FailedLoadSpend],
  execute: loadSpend(),
});
