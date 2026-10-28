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

describe("spending", () => {
  test("toggles pie, bar, and line and lists the filtered transactions", () => {
    scene(
      { update, view },
      given(initialModel),
      expect(text("Spending")).toExist(),
      expect(role("button", { name: "Pie" })).toHaveAttr("aria-pressed", "true"),
      expect(text("By bucket")).toExist(),
      expect(text("Search")).toExist(),
      expect(text("6 transactions · $227.90 out")).toExist(),
      expect(text("Stub Grocery", { exact: false })).toExist(),
      expect(text("Stub July", { exact: false })).toExist(),
      expect(text("Stub Rent", { exact: false })).toBeAbsent(),
      expect(role("checkbox", { name: "Hide rent, transfers, and income" })).toBeChecked(),
      click(role("button", { name: "Bar" })),
      expect(text("By merchant")).toExist(),
      expect(text("By bucket")).toBeAbsent(),
      expect(role("img", { name: "Spending by merchant" })).toExist(),
      expect(text("Stub Grocery", { exact: false })).toExist(),
      click(role("button", { name: "Line" })),
      expect(text("By day")).toExist(),
      expect(role("img", { name: "Spending by day" })).toExist(),
      expect(text("Stub Transit", { exact: false })).toExist(),
      click(role("button", { name: "Pie" })),
      expect(text("By bucket")).toExist(),
      expect(role("img", { name: "Spending by bucket" })).toExist(),
    );
  });
});
