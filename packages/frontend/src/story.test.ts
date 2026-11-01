import { householdFixture } from "@expendiru/domain";
import { Option } from "effect";
import { Command } from "foldkit";
import { Command as StoryCommand, given, message, model, story } from "foldkit/story";
import { fromString } from "foldkit/url";
import { describe, expect, test } from "vitest";
import { FocusControl, LoadSnapshot, ReplaceSpendUrl } from "./command.ts";
import { init, update } from "./main.ts";
import { Message } from "./message.ts";
import { Refresh, SpendMark, initialModel } from "./model.ts";

const mustUrl = (raw: string) =>
  Option.getOrThrowWith(fromString(raw), () => new Error(`bad url ${raw}`));

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
      message(Message.FailedLoadSnapshot({ error: "offline", generation: 0 })),
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
      StoryCommand.resolve(
        LoadSnapshot.Interrupt((outcome) =>
          Message.CompletedCancelLoadSnapshot({ outcome }),
        ),
        Message.CompletedCancelLoadSnapshot({
          outcome: Command.Interruptible.Outcome.NotFound(),
        }),
      ),
      StoryCommand.expectExact(LoadSnapshot({ generation: 1 })),
      StoryCommand.resolve(
        LoadSnapshot({ generation: 1 }),
        Message.LoadedSnapshot({ snapshot: householdFixture, generation: 1 }),
      ),
      model((next) => {
        expect(next.refresh).toEqual(Refresh.Idle());
      }),
    );
  });
});

describe("init", () => {
  test("starts from the fixture and loads a snapshot", () => {
    const started = init(mustUrl("http://127.0.0.1/"));
    expect(started.model.snapshot.householdName).toBe("Carlos & Maria");
    expect(started.model.refresh).toEqual(Refresh.Loading());
    expect(started.model.spendRefresh).toEqual(Refresh.Loading());

    const commands = started.commands;

    if (commands === undefined) {
      throw new Error("init did not schedule commands");
    }

    expect(commands.map((command) => [command.name, command.args])).toEqual([
      ["LoadSnapshot", { generation: 0 }],
      ["LoadSpend", { generation: 0 }],
    ]);
  });
});

describe("spend chart", () => {
  test("the toggle stores the chart mode", () => {
    story(
      update,
      given(initialModel),
      message(Message.ClickedChart({ mode: "bar" })),
      StoryCommand.resolve(ReplaceSpendUrl, Message.CompletedReplaceSpendUrl()),
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
      StoryCommand.resolve(ReplaceSpendUrl, Message.CompletedReplaceSpendUrl()),
      model((next) => {
        expect(next.spendFocus).toEqual(SpendMark.Bucket({ key: "household" }));
      }),
      message(Message.ClickedSpendMark({ mark: SpendMark.Bucket({ key: "household" }) })),
      StoryCommand.resolve(ReplaceSpendUrl, Message.CompletedReplaceSpendUrl()),
      model((next) => {
        expect(next.spendFocus).toEqual(SpendMark.Idle());
      }),
      message(Message.ClickedSpendMark({ mark: SpendMark.Merchant({ key: "Stub Lamp" }) })),
      StoryCommand.resolve(ReplaceSpendUrl, Message.CompletedReplaceSpendUrl()),
      message(Message.ClickedChart({ mode: "line" })),
      StoryCommand.resolve(ReplaceSpendUrl, Message.CompletedReplaceSpendUrl()),
      model((next) => {
        expect(next.spendChart).toBe("line");
        expect(next.spendFocus).toEqual(SpendMark.Idle());
        expect(next.spendHidden).toEqual([]);
      }),
    );
  });

  test("a person filter clears the chart selection", () => {
    story(
      update,
      given(initialModel),
      message(Message.ClickedSpendMark({ mark: SpendMark.Bucket({ key: "household" }) })),
      StoryCommand.resolve(ReplaceSpendUrl, Message.CompletedReplaceSpendUrl()),
      message(
        Message.ChangedSpendFilter({
          filter: { ...initialModel.spendFilter, person: "Carlos" },
        }),
      ),
      StoryCommand.resolve(ReplaceSpendUrl, Message.CompletedReplaceSpendUrl()),
      model((next) => {
        expect(next.spendFilter.person).toBe("Carlos");
        expect(next.spendFocus).toEqual(SpendMark.Idle());
        expect(next.spendHover).toEqual(SpendMark.Idle());
        expect(next.spendPage).toBe(0);
      }),
    );
  });

  test("a stale spend response leaves the current generation alone", () => {
    story(
      update,
      given({ ...initialModel, spendGeneration: 3, spendRefresh: Refresh.Loading() }),
      message(Message.LoadedSpend({ feed: initialModel.spend, generation: 2 })),
      message(Message.FailedLoadSpend({ error: "late", generation: 1 })),
      model((next) => {
        expect(next.spendGeneration).toBe(3);
        expect(next.spendRefresh).toEqual(Refresh.Loading());
      }),
    );
  });

  test("clearing a selection asks the chart mode button to take focus", () => {
    story(
      update,
      given(initialModel),
      message(Message.ClickedSpendMark({ mark: SpendMark.Bucket({ key: "household" }) })),
      StoryCommand.resolve(ReplaceSpendUrl, Message.CompletedReplaceSpendUrl()),
      message(Message.ClickedSpendMark({ mark: SpendMark.Idle() })),
      StoryCommand.resolve(ReplaceSpendUrl, Message.CompletedReplaceSpendUrl()),
      StoryCommand.resolve(FocusControl, Message.CompletedFocusControl()),
      model((next) => {
        expect(next.spendFocus).toEqual(SpendMark.Idle());
        expect(next.spendPage).toBe(0);
      }),
    );
  });

  test("the address restores chart, person, selection, and page", () => {
    story(
      update,
      given(initialModel),
      message(
        Message.ChangedUrl({
          url: mustUrl(
            "http://127.0.0.1/?chart=pie&person=Maria&mark=bucket:household&page=2",
          ),
        }),
      ),
      model((next) => {
        expect(next.spendChart).toBe("pie");
        expect(next.spendFilter.person).toBe("Maria");
        expect(next.spendFocus).toEqual(SpendMark.Bucket({ key: "household" }));
        expect(next.spendPage).toBe(2);
        expect(next.unknownPath).toBe(false);
      }),
    );
  });
});
