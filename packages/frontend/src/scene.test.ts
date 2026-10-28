import { householdFixture } from "@expendiru/domain";
import { Command, click, expect, given, role, scene, text } from "foldkit/scene";
import { modifyFields } from "foldkit/struct";
import { describe, test } from "vitest";
import { LoadSnapshot } from "./command.ts";
import { update, view } from "./main.ts";
import { Message } from "./message.ts";
import { Refresh, initialModel } from "./model.ts";

describe("home", () => {
  test("shows the fund, both visas, and the four buckets", () => {
    scene(
      { update, view },
      given(initialModel),
      expect(text("Expendiru")).toExist(),
      expect(text("Emergency fund")).toExist(),
      expect(text("$7,450.00")).toExist(),
      expect(text("Room left on the Visas")).toExist(),
      expect(text("Scotia Visa · Carlos")).toExist(),
      expect(text("Scotia Visa · Maria")).toExist(),
      expect(text("$5,859.45")).toExist(),
      expect(text("$4,139.80")).toExist(),
      expect(text("Buckets vs pace")).toExist(),
      expect(text("Household")).toExist(),
      expect(text("Together")).toExist(),
      expect(text("under pace")).toExist(),
      expect(text("over pace")).toExist(),
      expect(role("button", { name: "replay the month" })).toBeEnabled(),
    );
  });

  test("replay keeps the same numbers on screen", () => {
    scene(
      { update, view },
      given(initialModel),
      click(role("button", { name: "replay the month" })),
      expect(text("$7,450.00")).toExist(),
      expect(text("Scotia Visa · Maria")).toExist(),
    );
  });

  test("a failed refresh explains that the fixture is still showing", () => {
    scene(
      { update, view },
      given(
        modifyFields(initialModel, {
          refresh: () => Refresh.Failed({ error: "offline" }),
        }),
      ),
      expect(text("Couldn't refresh from the household API. Showing the fixture. offline")).toExist(),
      expect(text("Fixture for Carlos and Maria.")).toExist(),
      expect(role("button", { name: "try the api again" })).toBeEnabled(),
      click(role("button", { name: "try the api again" })),
      Command.resolve(
        LoadSnapshot(),
        Message.LoadedSnapshot({ snapshot: householdFixture }),
      ),
      expect(text("$7,450.00")).toExist(),
    );
  });

  test("a loaded live snapshot replaces the fixture footer", () => {
    scene(
      { update, view },
      given(
        modifyFields(initialModel, {
          refresh: () => Refresh.Failed({ error: "offline" }),
        }),
      ),
      expect(text("Fixture for Carlos and Maria.")).toExist(),
      expect(text("Scotia and Wealthsimple are not connected yet.")).toBeAbsent(),
      click(role("button", { name: "try the api again" })),
      Command.resolve(
        LoadSnapshot(),
        Message.LoadedSnapshot({
          snapshot: { ...householdFixture, source: "live" },
        }),
      ),
      expect(text("Household Finance snapshot for Carlos and Maria.")).toExist(),
      expect(text("Fixture for Carlos and Maria.")).toBeAbsent(),
      expect(text("Scotia and Wealthsimple are not connected yet.")).toBeAbsent(),
    );
  });
});
