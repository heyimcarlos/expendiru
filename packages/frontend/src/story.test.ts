import { householdFixture } from "@expendiru/domain";
import { Command, given, message, model, story } from "foldkit/story";
import { describe, expect, test } from "vitest";
import { LoadSnapshot } from "./command.ts";
import { init, update } from "./main.ts";
import { Message } from "./message.ts";
import { Refresh, initialModel } from "./model.ts";

describe("update", () => {
  test("replay bumps the animation generation and leaves the snapshot", () => {
    story(
      update,
      given(initialModel),
      message(Message.ClickedReplay()),
      model((next) => {
        expect(next.replay).toBe(1);
        expect(next.snapshot).toEqual(householdFixture);
      }),
    );
  });

  test("a failed refresh keeps the fixture and records the error", () => {
    story(
      update,
      given(initialModel),
      message(Message.FailedLoadSnapshot({ error: "offline" })),
      model((next) => {
        expect(next.snapshot).toEqual(householdFixture);
        expect(next.refresh).toEqual(Refresh.Failed({ error: "offline" }));
      }),
    );
  });

  test("retry asks the api again", () => {
    story(
      update,
      given(initialModel),
      message(Message.ClickedRetry()),
      Command.expectExact(LoadSnapshot()),
      Command.resolve(
        LoadSnapshot(),
        Message.LoadedSnapshot({ snapshot: householdFixture }),
      ),
      model((next) => {
        expect(next.refresh).toEqual(Refresh.Idle());
      }),
    );
  });
});

describe("init", () => {
  test("starts from the fixture and loads a snapshot", () => {
    const started = init();
    expect(started.model.snapshot.householdName).toBe("Carlos & Maria");
    expect(started.commands).toEqual([LoadSnapshot()]);
  });
});
