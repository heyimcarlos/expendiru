import { Api } from "@expendiru/api";
import { householdFixture } from "@expendiru/domain";
import { Effect } from "effect";
import { HttpApiClient } from "effect/http-api";
import { Command, Http } from "foldkit";
import { Message } from "./message.ts";

const apiUrl = import.meta.env.VITE_API_URL;

const loadSnapshot = Effect.gen(function* () {
  if (apiUrl === undefined || apiUrl === "") {
    return Message.LoadedSnapshot({ snapshot: householdFixture });
  }

  const client = yield* HttpApiClient.make(Api, { baseUrl: apiUrl });
  const snapshot = yield* client.Household.getSnapshot();
  return Message.LoadedSnapshot({ snapshot });
}).pipe(
  Effect.catch((error) =>
    Effect.succeed(
      Message.FailedLoadSnapshot({ error: globalThis.String(error) }),
    ),
  ),
  Effect.provide(Http.layer),
);

export const LoadSnapshot = Command.define("LoadSnapshot", {
  messages: [Message.LoadedSnapshot, Message.FailedLoadSnapshot],
  execute: loadSnapshot,
});
