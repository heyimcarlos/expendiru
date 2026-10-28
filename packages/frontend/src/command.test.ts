import { householdFixture } from "@expendiru/domain";
import { expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { LoadSnapshot } from "./command.ts";
import { Message } from "./message.ts";

it.effect("loads the fixture when the api url is absent", () =>
  Effect.gen(function* () {
    const command = LoadSnapshot();
    const message = yield* command.effect;
    expect(message).toEqual(
      Message.LoadedSnapshot({ snapshot: householdFixture }),
    );
  }),
);
