import { Schema } from "effect";
import { describe, expect, test } from "vitest";
import {
  SpendFeed,
  SpendFeedWire,
  bucketSlices,
  dailySeries,
  defaultSpendFilter,
  dollarsToCents,
  merchantBars,
  monthlyBucketSeries,
  parseMonthlyByBucketCsv,
  querySpend,
  spendFeedFromWire,
  spendStub,
  stackSpendCents,
  totalOutflowCents,
} from "./spend.ts";

describe("spend stub", () => {
  test("decodes the small october stub without live balances", () => {
    expect(spendStub.asOf).toBe("2026-10-27");
    expect(spendStub.transactions).toHaveLength(9);
    expect(spendStub.transactions.map((tx) => tx.accountMask)).toEqual([
      "0000",
      "0000",
      "0000",
      "0000",
      "0000",
      "0000",
      "0000",
      "0000",
      "0000",
    ]);
    expect(JSON.stringify(spendStub)).not.toMatch(/3024|4548|5586|6880/);
  });

  test("turns feed dollars into cents, including a numeric string", () => {
    expect(dollarsToCents(-3.3)).toBe(-330);
    expect(dollarsToCents(-42.1)).toBe(-4210);
    expect(dollarsToCents(12.94)).toBe(1294);
    expect(dollarsToCents(1000)).toBe(100_000);

    const wire = Schema.decodeUnknownSync(SpendFeedWire)({
      period: { from: "2026-10-01", to: "2026-10-27" },
      as_of: "2026-10-27",
      transactions: [
        {
          id: "string-amount",
          date: "2026-10-20",
          person: "Carlos",
          account: "Wealthsimple TFSA",
          account_id: "stub-string",
          account_mask: "0000",
          account_class: "investment",
          institution: "Wealthsimple",
          name: "transfer",
          merchant: "",
          description: "",
          amount: "1000.0",
          abs_amount: "1000.0",
          direction: "in",
          currency: "CAD",
          pending: "",
          category_primary: "transfer",
          category_detailed: "",
          category_confidence: "",
          budget_bucket: "investment",
          counts_toward_budget: "no",
          month: "2026-10",
          type: "transfer",
        },
      ],
    });
    const feed = Schema.decodeUnknownSync(SpendFeed)(spendFeedFromWire(wire));

    expect(feed.transactions[0]?.amountCents).toBe(100_000);
    expect(feed.transactions[0]?.pending).toBe("unknown");
  });
});

describe("querySpend", () => {
  const filter = defaultSpendFilter(spendStub.period.from, spendStub.period.to);

  test("defaults to the feed period, budget spending, and hides rent, transfers, and income", () => {
    const queried = querySpend(spendStub.transactions, filter);

    expect(queried.amountValid).toBe(true);
    expect(queried.transactions.map((tx) => tx.merchant)).toEqual([
      "Stub Transit",
      "Stub Grocery",
      "Stub Dinner",
      "Stub Shop",
      "Stub Lamp",
      "Stub July",
    ]);
    expect(totalOutflowCents(queried.transactions)).toBe(22_790);
  });

  test("an october window drops july", () => {
    const october = querySpend(spendStub.transactions, {
      ...filter,
      dateFrom: "2026-10-01",
      dateTo: "2026-10-27",
    });

    expect(october.transactions.map((tx) => tx.merchant)).not.toContain("Stub July");
    expect(totalOutflowCents(october.transactions)).toBe(21_790);
  });

  test("search matches merchant, account, and category text", () => {
    const grocery = querySpend(spendStub.transactions, {
      ...filter,
      search: "grocery",
    });

    expect(grocery.transactions.map((tx) => tx.merchant)).toEqual(["Stub Grocery"]);

    const visas = querySpend(spendStub.transactions, {
      ...filter,
      search: "visa",
    });

    expect(visas.transactions.map((tx) => tx.merchant)).toEqual([
      "Stub Transit",
      "Stub Dinner",
      "Stub Shop",
      "Stub Lamp",
    ]);
  });

  test("filters person, plaid category, confidence, pending, and amount", () => {
    const maria = querySpend(spendStub.transactions, {
      ...filter,
      person: "Maria",
    });

    expect(maria.transactions.map((tx) => tx.merchant)).toEqual([
      "Stub Grocery",
      "Stub Shop",
      "Stub July",
    ]);

    const transit = querySpend(spendStub.transactions, {
      ...filter,
      categoryDetailed: "TRANSPORTATION_PUBLIC_TRANSIT",
    });

    expect(transit.transactions.map((tx) => tx.id)).toEqual(["stub-transit"]);

    const medium = querySpend(spendStub.transactions, {
      ...filter,
      categoryConfidence: "MEDIUM",
    });

    expect(medium.transactions.map((tx) => tx.merchant)).toEqual(["Stub Shop"]);

    const pending = querySpend(spendStub.transactions, {
      ...filter,
      pending: "true",
    });

    expect(pending.transactions.map((tx) => tx.merchant)).toEqual([
      "Stub Transit",
    ]);

    const bounded = querySpend(spendStub.transactions, {
      ...filter,
      amountMin: "-50",
      amountMax: "-10",
    });

    expect(bounded.transactions.map((tx) => tx.merchant)).toEqual([
      "Stub Grocery",
      "Stub Shop",
      "Stub July",
    ]);

    const invalid = querySpend(spendStub.transactions, {
      ...filter,
      amountMin: "abc",
    });

    expect(invalid.amountValid).toBe(false);
    expect(invalid.transactions).toEqual([]);
  });

  test("can include july, rent, and payroll when the defaults are opened", () => {
    const opened = querySpend(spendStub.transactions, {
      ...filter,
      dateFrom: "",
      dateTo: "",
      countsTowardBudget: "any",
      excludeNonSpend: false,
    });

    expect(opened.transactions).toHaveLength(9);
    expect(totalOutflowCents(opened.transactions)).toBe(21_790 + 285_000 + 5_000 + 1_000);
  });
});

describe("spend series", () => {
  const rows = querySpend(
    spendStub.transactions,
    defaultSpendFilter(spendStub.period.from, spendStub.period.to),
  ).transactions;

  test("groups outflow by bucket and merchant", () => {
    expect(bucketSlices(rows).map((slice) => [slice.label, slice.cents])).toEqual([
      ["Move", 8_000],
      ["Together", 7_400],
      ["Household", 4_210],
      ["Maria", 2_850],
      ["Carlos", 330],
    ]);
    expect(merchantBars(rows, 2).map((slice) => slice.label)).toEqual([
      "Stub Lamp",
      "Stub Dinner",
    ]);
    expect(bucketSlices(spendStub.transactions).some((slice) => slice.key === "income")).toBe(
      false,
    );
  });

  test("fills every day in the range and sums to the outflow", () => {
    const series = dailySeries(rows, "2026-07-01", "2026-10-27");

    expect(series).toHaveLength(119);
    expect(series[0]?.date).toBe("2026-07-01");
    expect(series[0]?.cents).toBe(0);
    expect(series.find((point) => point.date === "2026-07-04")?.cents).toBe(1_000);
    expect(series.at(-1)?.date).toBe("2026-10-27");
    expect(series.at(-1)?.cents).toBe(330);

    const summed = series.reduce((total, point) => total + point.cents, 0);

    expect(summed).toBe(totalOutflowCents(rows));
    expect(dailySeries(rows, "2026-10-27", "2026-10-01")).toEqual([]);
  });

  test("stacks the four budget buckets by month and reads a csv", () => {
    const series = monthlyBucketSeries(rows, "2026-07-01", "2026-10-27");

    expect(series.map((row) => row.month)).toEqual([
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
    ]);
    expect(series[0]?.together).toBe(1_000);
    expect(series[3]?.household).toBe(4_210);
    expect(series[3]?.carlosPersonal).toBe(330);
    expect(series[3]?.mariaPersonal).toBe(2_850);
    expect(series.reduce((total, row) => total + stackSpendCents(row), 0)).toBe(14_790);

    const wide = parseMonthlyByBucketCsv(
      "month,household,together,carlos_personal,maria_personal\n2026-07,10.00,5.50,0,1\n",
    );
    const long = parseMonthlyByBucketCsv(
      "month,budget_bucket,cents\n2026-08,household,250\n2026-08,maria_personal,100\n",
    );

    expect(wide.ok).toBe(true);
    if (wide.ok) {
      expect(wide.rows[0]?.household).toBe(1_000);
      expect(wide.rows[0]?.together).toBe(550);
      expect(wide.rows[0]?.mariaPersonal).toBe(100);
    }

    expect(long.ok).toBe(true);
    if (long.ok) {
      expect(long.rows[0]?.household).toBe(250);
      expect(long.rows[0]?.mariaPersonal).toBe(100);
    }

    expect(parseMonthlyByBucketCsv("nope").ok).toBe(false);
  });

  test("the stub carries the Jul–Oct household monthly fixture", () => {
    const fixture = spendStub.monthlyByBucket ?? [];

    expect(fixture.map((row) => row.month)).toEqual([
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
    ]);
    expect(fixture.reduce((total, row) => total + stackSpendCents(row), 0)).toBe(2_366_829);
    expect(fixture[3]?.household).toBe(98_862);
    expect(fixture[3]?.together).toBe(87_619);
    expect(fixture[3]?.carlosPersonal).toBe(401_153);
    expect(fixture[3]?.mariaPersonal).toBe(172_006);
    expect(dollarsToCents(7596.4)).toBe(759_640);
  });
});
