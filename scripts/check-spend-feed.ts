import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SpendFeedWire,
  bucketSlices,
  defaultSpendFilter,
  merchantBars,
  parseMonthlyByBucketCsv,
  querySpend,
  spendFeedFromWire,
  totalOutflowCents,
} from "../packages/domain/src/spend.ts";
import { Schema } from "effect";

const feedDir = process.env.EXPENDIRU_FEED ?? "/workspace/finance/expendiru-feed";
const transactionsPath = join(feedDir, "transactions.json");
const summaryPath = join(feedDir, "summary.json");
const monthlyPath = join(feedDir, "monthly_by_bucket.csv");

if (!existsSync(transactionsPath) || !existsSync(summaryPath)) {
  console.log(`No feed at ${feedDir}. Skipping spend acceptance check.`);
  process.exit(0);
}

const transactions: unknown = JSON.parse(readFileSync(transactionsPath, "utf8"));
const summary: unknown = JSON.parse(readFileSync(summaryPath, "utf8"));
const summaryRecord = typeof summary === "object" && summary !== null ? summary : {};

const wire = Schema.decodeUnknownSync(SpendFeedWire)({
  period: "period" in summaryRecord ? summaryRecord.period : undefined,
  as_of: "as_of" in summaryRecord ? summaryRecord.as_of : undefined,
  transactions,
});
const feed = spendFeedFromWire(wire);
const queried = querySpend(
  feed.transactions,
  defaultSpendFilter(feed.period.from, feed.period.to),
);
const slices = bucketSlices(queried.transactions);
const bars = merchantBars(queried.transactions, 5);

const expectCents = (key: string, cents: number) => {
  const slice = slices.find((item) => item.key === key);

  if (slice === undefined || slice.cents !== cents) {
    console.error(
      `${key}: expected ${cents} cents, got ${slice === undefined ? "missing" : slice.cents}`,
    );
    process.exitCode = 1;
  }
};

if (feed.transactions.length !== 830) {
  console.error(`expected 830 transactions, got ${feed.transactions.length}`);
  process.exitCode = 1;
}

expectCents("carlos_personal", 642_308);
expectCents("maria_personal", 912_583);
expectCents("household", 536_715);
expectCents("together", 603_864);
// Move one-offs are counts_toward_budget=no in the 2026-10-31 feed,
// so the default filter leaves them out.

const outflow = totalOutflowCents(queried.transactions);

if (outflow !== 2_695_470) {
  console.error(`expected $26,954.70 out, got ${outflow} cents`);
  process.exitCode = 1;
}

const merchantNames = bars.map((bar) => bar.label);
const expectedMerchants = ["Remitly", "Farm Boy", "Uber Eats", "BorderPass", "Felix"];

expectedMerchants.forEach((name, index) => {
  const label = merchantNames[index] ?? "";

  if (!label.toLowerCase().includes(name.toLowerCase())) {
    console.error(`top merchant ${index + 1}: expected ${name}, got ${label}`);
    process.exitCode = 1;
  }
});

if (existsSync(monthlyPath)) {
  const parsed = parseMonthlyByBucketCsv(readFileSync(monthlyPath, "utf8"));

  if (!parsed.ok) {
    console.error(parsed.error);
    process.exit(1);
  }

  console.log(`monthly_by_bucket.csv: ${parsed.rows.length} months`);
}

if (process.exitCode === 1) {
  process.exit(1);
}

console.log(
  `Spend check ok: ${feed.transactions.length} transactions, ${queried.transactions.length} in the default filter, $${(outflow / 100).toFixed(2)} out.`,
);
