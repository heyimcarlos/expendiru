import { householdFixture } from "@expendiru/domain";
import { Command, given, message, model, story } from "foldkit/story";
import { describe, expect, test } from "vitest";
import { LoadSnapshot, LoadSpend } from "./command.ts";
import { init, update } from "./main.ts";
import { Message } from "./message.ts";
import { Refresh, SpendMark, initialModel } from "./model.ts";

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
    expect(started.commands).toEqual([LoadSnapshot(), LoadSpend()]);
  });
});

describe("spend chart", () => {
  test("the toggle stores the chart mode", () => {
    story(
      update,
      given(initialModel),
      message(Message.ClickedChart({ mode: "bar" })),
      model((next) => {
        expect(next.spendChart).toBe("bar");
        expect(next.spend).toEqual(initialModel.spend);
      }),
    );
  });

  test("a mark toggles the shared focus and a mode change clears it", () => {
    story(
      update,
      given(initialModel),
      message(Message.ClickedSpendMark({ mark: SpendMark.Bucket({ key: "household" }) })),
      model((next) => {
        expect(next.spendFocus).toEqual(SpendMark.Bucket({ key: "household" }));
      }),
      message(Message.ClickedSpendMark({ mark: SpendMark.Bucket({ key: "household" }) })),
      model((next) => {
        expect(next.spendFocus).toEqual(SpendMark.Idle());
      }),
      message(Message.ClickedSpendMark({ mark: SpendMark.Merchant({ key: "Stub Lamp" }) })),
      message(Message.ClickedChart({ mode: "line" })),
      model((next) => {
        expect(next.spendChart).toBe("line");
        expect(next.spendFocus).toEqual(SpendMark.Idle());
        expect(next.spendHidden).toEqual([]);
      }),
    );
  });
});
