import { householdFixture, spendStub } from "@expendiru/domain";
import { Command as FoldkitCommand } from "foldkit";
import { Command, change, click, expect, given, keydown, role, scene, selector, text } from "foldkit/scene";
import { modifyFields } from "foldkit/struct";
import { describe, test } from "vitest";
import { FocusControl, LoadSnapshot, ReplaceSpendUrl } from "./command.ts";
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
        LoadSnapshot.Interrupt((outcome) =>
          Message.CompletedCancelLoadSnapshot({ outcome }),
        ),
        Message.CompletedCancelLoadSnapshot({
          outcome: FoldkitCommand.Interruptible.Outcome.NotFound(),
        }),
      ),
      Command.resolve(
        LoadSnapshot({ generation: 1 }),
        Message.LoadedSnapshot({ snapshot: householdFixture, generation: 1 }),
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
        LoadSnapshot.Interrupt((outcome) =>
          Message.CompletedCancelLoadSnapshot({ outcome }),
        ),
        Message.CompletedCancelLoadSnapshot({
          outcome: FoldkitCommand.Interruptible.Outcome.NotFound(),
        }),
      ),
      Command.resolve(
        LoadSnapshot({ generation: 1 }),
        Message.LoadedSnapshot({
          snapshot: { ...householdFixture, source: "live" },
          generation: 1,
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
      expect(role("button", { name: "Line" })).toHaveAttr("aria-pressed", "true"),
      expect(text("By month")).toExist(),
      expect(text("Household 13.0%")).toExist(),
      expect(text("Search")).toBeAbsent(),
      expect(text("Amount min")).toBeAbsent(),
      expect(text("Reset filters")).toBeAbsent(),
      expect(role("checkbox", { name: "Hide rent, transfers, and income" })).toBeAbsent(),
      expect(role("combobox", { name: "Person" })).toExist(),
      expect(role("table", { name: "Transactions" })).toExist(),
      expect(role("columnheader", { name: "Date" })).toExist(),
      expect(role("columnheader", { name: "Merchant" })).toExist(),
      expect(role("columnheader", { name: "Category" })).toExist(),
      expect(role("columnheader", { name: "Amount" })).toExist(),
      expect(text("6 transactions · $227.90 out")).toExist(),
      expect(text("1–6 of 6")).toExist(),
      expect(role("button", { name: "Previous" })).toBeDisabled(),
      expect(role("button", { name: "Next" })).toBeDisabled(),
      expect(text("Stub Grocery", { exact: false })).toExist(),
      expect(text("Stub July", { exact: false })).toExist(),
      expect(text("2026-10-27")).toExist(),
      expect(text("Pending")).toExist(),
      expect(text("Stub Rent", { exact: false })).toBeAbsent(),
      click(role("button", { name: "Bar" })),
      Command.resolve(ReplaceSpendUrl, Message.CompletedReplaceSpendUrl()),
      expect(text("By merchant")).toExist(),
      expect(text("By bucket")).toBeAbsent(),
      expect(role("group", { name: "Spending by merchant" })).toExist(),
      expect(text("Stub Grocery", { exact: false })).toExist(),
      click(role("button", { name: "Line" })),
      Command.resolve(ReplaceSpendUrl, Message.CompletedReplaceSpendUrl()),
      expect(text("By month")).toExist(),
      expect(text("Jul '26")).toExist(),
      expect(text("Oct")).toExist(),
      expect(role("group", { name: "Spending by month" })).toExist(),
      expect(selector('[data-clip="line"]')).toExist(),
      expect(text("Stub Transit", { exact: false })).toExist(),
      click(role("button", { name: "Pie" })),
      Command.resolve(ReplaceSpendUrl, Message.CompletedReplaceSpendUrl()),
      expect(text("By bucket")).toExist(),
      expect(role("group", { name: "Spending by bucket" })).toExist(),
      expect(selector('[data-clip="pie"]')).toExist(),
    );
  });

  test("a bucket slice filters the shared transaction list", () => {
    scene(
      { update, view },
      given(initialModel),
      click(role("button", { name: /Show Household/ })),
      Command.resolve(ReplaceSpendUrl, Message.CompletedReplaceSpendUrl()),
      expect(text("1 transaction · $42.10 out")).toExist(),
      expect(text("Stub Grocery", { exact: false })).toExist(),
      expect(text("Stub Dinner", { exact: false })).toBeAbsent(),
      expect(text("Stub Lamp", { exact: false })).toBeAbsent(),
      expect(role("button", { name: /Show Household/ })).toHaveAttr("aria-pressed", "true"),
      click(role("button", { name: "Clear selection" })),
      Command.resolve(ReplaceSpendUrl, Message.CompletedReplaceSpendUrl()),
      Command.resolve(FocusControl, Message.CompletedFocusControl()),
      expect(text("6 transactions · $227.90 out")).toExist(),
      expect(text("Stub Dinner", { exact: false })).toExist(),
    );
  });

  test("the legend hides a series from the chart and the list", () => {
    scene(
      { update, view },
      given(initialModel),
      click(role("button", { name: /Toggle Household/ })),
      Command.resolve(ReplaceSpendUrl, Message.CompletedReplaceSpendUrl()),
      expect(text("Stub Grocery", { exact: false })).toBeAbsent(),
      expect(text("Stub Dinner", { exact: false })).toExist(),
      expect(role("button", { name: /Show Household/ })).toBeAbsent(),
      expect(text("Stub Rent", { exact: false })).toBeAbsent(),
    );
  });

  test("a merchant bar filters the list to that merchant", () => {
    scene(
      { update, view },
      given(initialModel),
      click(role("button", { name: "Bar" })),
      Command.resolve(ReplaceSpendUrl, Message.CompletedReplaceSpendUrl()),
      expect(selector('[data-clip="bar"]')).toExist(),
      click(role("button", { name: /Show Stub Lamp/ })),
      Command.resolve(ReplaceSpendUrl, Message.CompletedReplaceSpendUrl()),
      expect(text("1 transaction · $80.00 out")).toExist(),
      expect(text("Carlos · Carlos Scene+ Visa", { exact: false })).toExist(),
      expect(text("Move", { exact: false })).toExist(),
      expect(text("Maria · Maria chequing", { exact: false })).toBeAbsent(),
    );
  });

  test("the person menu narrows the table", () => {
    scene(
      { update, view },
      given(initialModel),
      change(role("combobox", { name: "Person" }), "Carlos"),
      Command.resolve(ReplaceSpendUrl, Message.CompletedReplaceSpendUrl()),
      expect(text("3 transactions · $147.30 out")).toExist(),
      expect(text("Stub Transit", { exact: false })).toExist(),
      expect(text("Stub Dinner", { exact: false })).toExist(),
      expect(text("Stub Grocery", { exact: false })).toBeAbsent(),
      expect(text("Stub Rent", { exact: false })).toBeAbsent(),
    );
  });

  test("arrow keys move the chart mode and the live region stays mounted", () => {
    scene(
      { update, view },
      given(initialModel),
      expect(selector("#skip-to-spend")).toExist(),
      expect(selector("#spend-status")).toHaveAttr("aria-live", "polite"),
      expect(selector("#spend-chart-line")).toHaveAttr("aria-pressed", "true"),
      expect(selector("#spend-page-previous")).toExist(),
      expect(selector("#spend-page-next")).toExist(),
      keydown(selector("#spend-chart-line"), "ArrowLeft"),
      Command.resolve(ReplaceSpendUrl, Message.CompletedReplaceSpendUrl()),
      expect(selector("#spend-chart-bar")).toHaveAttr("aria-pressed", "true"),
      expect(text("No selection.", { exact: false })).toExist(),
    );
  });

  test("loading spend and the snapshot do not paint balances", () => {
    scene(
      { update, view },
      given({
        ...initialModel,
        refresh: Refresh.Loading(),
        spendRefresh: Refresh.Loading(),
      }),
      expect(text("Loading the household snapshot.")).toExist(),
      expect(text("Loading spending.")).toExist(),
      expect(text("$7,450.00")).toBeAbsent(),
      expect(text("$227.90")).toBeAbsent(),
      expect(text("6 transactions")).toBeAbsent(),
    );
  });

  test("a failed spend refresh keeps the stub rows and offers retry", () => {
    scene(
      { update, view },
      given({
        ...initialModel,
        spendRefresh: Refresh.Failed({ error: "offline" }),
      }),
      expect(text("Showing the stub. offline", { exact: false })).toExist(),
      expect(text("6 transactions · $227.90 out")).toExist(),
      expect(role("button", { name: "try spending again" })).toBeEnabled(),
    );
  });

  test("the pager mounts one page of rows", () => {
    const seed = spendStub.transactions[0];

    if (seed === undefined) {
      throw new Error("spend stub has no transactions");
    }

    const transactions = [];

    for (let index = 0; index < 30; index += 1) {
      transactions.push({
        ...seed,
        id: `page-${index}`,
        merchant: index < 25 ? "Alpha Page" : "Beta Page",
        name: index < 25 ? "Alpha Page" : "Beta Page",
      });
    }

    scene(
      { update, view },
      given({
        ...initialModel,
        spend: { ...spendStub, transactions },
      }),
      expect(text("1–25 of 30")).toExist(),
      expect(text("Alpha Page", { exact: false })).toExist(),
      expect(text("Beta Page", { exact: false })).toBeAbsent(),
      click(role("button", { name: "Next" })),
      Command.resolve(ReplaceSpendUrl, Message.CompletedReplaceSpendUrl()),
      expect(text("26–30 of 30")).toExist(),
      expect(text("Beta Page", { exact: false })).toExist(),
      expect(text("Alpha Page", { exact: false })).toBeAbsent(),
    );
  });
});
