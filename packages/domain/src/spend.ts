import { Schema } from "effect";
import { Person } from "./household.ts";

const IsoDate = Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}$/));

const Dollars = Schema.Union([Schema.Number, Schema.NumberFromString]);

export const ChartMode = Schema.Literals(["pie", "bar", "line"]);

export type ChartMode = Schema.Schema.Type<typeof ChartMode>;

export const SpendFilter = Schema.Struct({
  person: Schema.String,
  account: Schema.String,
  budgetBucket: Schema.String,
  categoryPrimary: Schema.String,
  categoryDetailed: Schema.String,
  categoryConfidence: Schema.String,
  dateFrom: Schema.String,
  dateTo: Schema.String,
  amountMin: Schema.String,
  amountMax: Schema.String,
  search: Schema.String,
  pending: Schema.Literals(["any", "true", "false", "unknown"]),
  countsTowardBudget: Schema.Literals(["any", "yes", "no"]),
  excludeNonSpend: Schema.Boolean,
});

export interface SpendFilter extends Schema.Schema.Type<typeof SpendFilter> {}

export const AmountBounds = Schema.Struct({
  valid: Schema.Boolean,
  minCents: Schema.NullOr(Schema.Int),
  maxCents: Schema.NullOr(Schema.Int),
});

export interface AmountBounds extends Schema.Schema.Type<typeof AmountBounds> {}

export const LedgerTransaction = Schema.Struct({
  id: Schema.String,
  date: IsoDate,
  person: Person,
  account: Schema.String,
  accountId: Schema.String,
  accountMask: Schema.String,
  accountClass: Schema.String,
  institution: Schema.String,
  name: Schema.String,
  merchant: Schema.String,
  description: Schema.String,
  amountCents: Schema.Int,
  direction: Schema.Literals(["in", "out"]),
  currency: Schema.Literals(["CAD"]),
  pending: Schema.Literals(["true", "false", "unknown"]),
  categoryPrimary: Schema.String,
  categoryDetailed: Schema.String,
  categoryConfidence: Schema.String,
  budgetBucket: Schema.String,
  countsTowardBudget: Schema.Literals(["yes", "no"]),
  month: Schema.String,
  type: Schema.String,
});

export interface LedgerTransaction extends Schema.Schema.Type<typeof LedgerTransaction> {}

export const SpendPeriod = Schema.Struct({
  from: IsoDate,
  to: IsoDate,
});

export interface SpendPeriod extends Schema.Schema.Type<typeof SpendPeriod> {}

const IsoMonth = Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}$/));

export const stackBucketKeys = [
  "household",
  "together",
  "carlos_personal",
  "maria_personal",
] as const;

export const MonthlyBucketSpend = Schema.Struct({
  month: IsoMonth,
  household: Schema.Natural,
  together: Schema.Natural,
  carlosPersonal: Schema.Natural,
  mariaPersonal: Schema.Natural,
});

export interface MonthlyBucketSpend extends Schema.Schema.Type<typeof MonthlyBucketSpend> {}

const MonthlyBucketWire = Schema.Struct({
  month: IsoMonth,
  household: Schema.Natural,
  together: Schema.Natural,
  carlos_personal: Schema.Natural,
  maria_personal: Schema.Natural,
});

export const SpendFeed = Schema.Struct({
  period: SpendPeriod,
  asOf: IsoDate,
  transactions: Schema.Array(LedgerTransaction),
  monthlyByBucket: Schema.optionalKey(Schema.Array(MonthlyBucketSpend)),
}).annotate({ identifier: "SpendFeed" });

export interface SpendFeed extends Schema.Schema.Type<typeof SpendFeed> {}

export const SpendSlice = Schema.Struct({
  key: Schema.String,
  label: Schema.String,
  cents: Schema.Natural,
});

export interface SpendSlice extends Schema.Schema.Type<typeof SpendSlice> {}

export const DailySpend = Schema.Struct({
  date: IsoDate,
  cents: Schema.Natural,
});

export interface DailySpend extends Schema.Schema.Type<typeof DailySpend> {}

const TransactionWire = Schema.Struct({
  id: Schema.String,
  date: IsoDate,
  person: Person,
  account: Schema.String,
  account_id: Schema.String,
  account_mask: Schema.String,
  account_class: Schema.String,
  institution: Schema.String,
  name: Schema.String,
  merchant: Schema.String,
  description: Schema.String,
  amount: Dollars,
  abs_amount: Dollars,
  direction: Schema.Literals(["in", "out"]),
  currency: Schema.Literals(["CAD"]),
  pending: Schema.String,
  category_primary: Schema.String,
  category_detailed: Schema.String,
  category_confidence: Schema.String,
  category_raw: Schema.optionalKey(Schema.String),
  budget_bucket: Schema.String,
  counts_toward_budget: Schema.Literals(["yes", "no"]),
  month: Schema.String,
  type: Schema.String,
});

export const SpendFeedWire = Schema.Struct({
  period: SpendPeriod,
  as_of: IsoDate,
  transactions: Schema.Array(TransactionWire),
  monthly_by_bucket: Schema.optionalKey(Schema.Array(MonthlyBucketWire)),
}).annotate({ identifier: "SpendFeedWire" });

export interface SpendFeedWire extends Schema.Schema.Type<typeof SpendFeedWire> {}

const nonSpendBuckets = ["rent", "transfer_or_payment", "income"];

export const isNonSpendBucket = (bucket: string): boolean => {
  for (const name of nonSpendBuckets) {
    if (bucket === name) {
      return true;
    }
  }

  return false;
};

export const dollarsToCents = (dollars: number): number => {
  const negative = dollars < 0;
  const text = Math.abs(dollars).toFixed(2);
  const whole = text.slice(0, text.length - 3);
  const fraction = text.slice(text.length - 2);
  const cents = Number(whole) * 100 + Number(fraction);

  return negative ? -cents : cents;
};

const pendingFlag = (value: string): LedgerTransaction["pending"] => {
  if (value === "true") {
    return "true";
  }

  if (value === "false") {
    return "false";
  }

  return "unknown";
};

const boundCents = (raw: string): number | null | "invalid" => {
  const trimmed = raw.trim().replaceAll("$", "").replaceAll(",", "");

  if (trimmed === "") {
    return null;
  }

  if (!/^-?\d+(\.\d{1,2})?$/.test(trimmed)) {
    return "invalid";
  }

  return dollarsToCents(Number(trimmed));
};

export const readAmountBounds = (min: string, max: string): AmountBounds => {
  const minCents = boundCents(min);
  const maxCents = boundCents(max);

  if (minCents === "invalid" || maxCents === "invalid") {
    return AmountBounds.make({ valid: false, minCents: null, maxCents: null });
  }

  return AmountBounds.make({
    valid: true,
    minCents,
    maxCents,
  });
};

export const budgetBucketLabel = (bucket: string): string => {
  if (bucket === "carlos_personal") {
    return "Carlos";
  }

  if (bucket === "maria_personal") {
    return "Maria";
  }

  if (bucket === "household") {
    return "Household";
  }

  if (bucket === "together") {
    return "Together";
  }

  if (bucket === "move_oneoffs") {
    return "Move";
  }

  if (bucket === "income_or_refund") {
    return "Refunds";
  }

  if (bucket === "transfer_or_payment") {
    return "Transfers";
  }

  if (bucket === "income") {
    return "Income";
  }

  if (bucket === "rent") {
    return "Rent";
  }

  if (bucket === "fees") {
    return "Fees";
  }

  if (bucket === "investment") {
    return "Investment";
  }

  return bucket;
};

export const merchantLabel = (tx: LedgerTransaction): string => {
  if (tx.merchant !== "") {
    return tx.merchant;
  }

  if (tx.name !== "") {
    return tx.name;
  }

  return "Unknown merchant";
};

export const outflowCents = (tx: LedgerTransaction): number =>
  tx.amountCents < 0 ? -tx.amountCents : 0;

export const totalOutflowCents = (
  transactions: ReadonlyArray<LedgerTransaction>,
): number => {
  let total = 0;

  for (const tx of transactions) {
    total += outflowCents(tx);
  }

  return total;
};

const matchesSpend = (
  tx: LedgerTransaction,
  filter: SpendFilter,
  bounds: AmountBounds,
): boolean => {
  if (filter.person !== "" && tx.person !== filter.person) {
    return false;
  }

  if (filter.account !== "" && tx.account !== filter.account) {
    return false;
  }

  if (filter.budgetBucket !== "" && tx.budgetBucket !== filter.budgetBucket) {
    return false;
  }

  if (
    filter.categoryPrimary !== "" &&
    tx.categoryPrimary !== filter.categoryPrimary
  ) {
    return false;
  }

  if (
    filter.categoryDetailed !== "" &&
    tx.categoryDetailed !== filter.categoryDetailed
  ) {
    return false;
  }

  if (
    filter.categoryConfidence !== "" &&
    tx.categoryConfidence !== filter.categoryConfidence
  ) {
    return false;
  }

  if (filter.dateFrom !== "" && tx.date < filter.dateFrom) {
    return false;
  }

  if (filter.dateTo !== "" && tx.date > filter.dateTo) {
    return false;
  }

  const needle = filter.search.trim().toLowerCase();

  if (needle !== "" && !searchHaystack(tx).includes(needle)) {
    return false;
  }

  if (filter.pending !== "any" && tx.pending !== filter.pending) {
    return false;
  }

  if (
    filter.countsTowardBudget !== "any" &&
    tx.countsTowardBudget !== filter.countsTowardBudget
  ) {
    return false;
  }

  if (filter.excludeNonSpend && isNonSpendBucket(tx.budgetBucket)) {
    return false;
  }

  if (bounds.minCents !== null && tx.amountCents < bounds.minCents) {
    return false;
  }

  if (bounds.maxCents !== null && tx.amountCents > bounds.maxCents) {
    return false;
  }

  return true;
};

export type SpendQuery = {
  readonly amountValid: boolean;
  readonly transactions: ReadonlyArray<LedgerTransaction>;
};

export const querySpend = (
  transactions: ReadonlyArray<LedgerTransaction>,
  filter: SpendFilter,
): SpendQuery => {
  const bounds = readAmountBounds(filter.amountMin, filter.amountMax);

  if (!bounds.valid) {
    return { amountValid: false, transactions: [] };
  }

  const matched: Array<LedgerTransaction> = [];

  for (const tx of transactions) {
    if (matchesSpend(tx, filter, bounds)) {
      matched.push(tx);
    }
  }

  return { amountValid: true, transactions: matched };
};

const slicesFromTotals = (
  totals: ReadonlyMap<string, number>,
  labelFor: (key: string) => string,
): ReadonlyArray<SpendSlice> => {
  const slices: Array<SpendSlice> = [];

  for (const [key, cents] of totals) {
    if (cents <= 0) {
      continue;
    }

    slices.push(SpendSlice.make({ key, label: labelFor(key), cents }));
  }

  slices.sort((left, right) => {
    if (right.cents !== left.cents) {
      return right.cents - left.cents;
    }

    return left.label.localeCompare(right.label);
  });

  return slices;
};

export const bucketSlices = (
  transactions: ReadonlyArray<LedgerTransaction>,
): ReadonlyArray<SpendSlice> => {
  const totals = new Map<string, number>();

  for (const tx of transactions) {
    const cents = outflowCents(tx);

    if (cents === 0) {
      continue;
    }

    const current = totals.get(tx.budgetBucket);

    totals.set(tx.budgetBucket, current === undefined ? cents : current + cents);
  }

  return slicesFromTotals(totals, budgetBucketLabel);
};

export const merchantBars = (
  transactions: ReadonlyArray<LedgerTransaction>,
  limit: number,
): ReadonlyArray<SpendSlice> => {
  const totals = new Map<string, number>();

  for (const tx of transactions) {
    const cents = outflowCents(tx);

    if (cents === 0) {
      continue;
    }

    const key = merchantLabel(tx);
    const current = totals.get(key);

    totals.set(key, current === undefined ? cents : current + cents);
  }

  const ranked = slicesFromTotals(totals, (key) => key);

  if (limit <= 0) {
    return [];
  }

  return ranked.slice(0, limit);
};

const nextIsoDate = (iso: string): string => {
  const parsed = Date.parse(`${iso}T00:00:00Z`);

  if (Number.isNaN(parsed)) {
    return iso;
  }

  return new Date(parsed + 86_400_000).toISOString().slice(0, 10);
};

export const dailySeries = (
  transactions: ReadonlyArray<LedgerTransaction>,
  from: string,
  to: string,
): ReadonlyArray<DailySpend> => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return [];
  }

  if (from > to) {
    return [];
  }

  const totals = new Map<string, number>();

  for (const tx of transactions) {
    const cents = outflowCents(tx);

    if (cents === 0) {
      continue;
    }

    const current = totals.get(tx.date);

    totals.set(tx.date, current === undefined ? cents : current + cents);
  }

  const points: Array<DailySpend> = [];
  let cursor = from;
  let guard = 0;

  while (cursor <= to && guard < 400) {
    points.push(
      DailySpend.make({
        date: cursor,
        cents: totals.get(cursor) ?? 0,
      }),
    );

    const next = nextIsoDate(cursor);

    if (next === cursor) {
      break;
    }

    cursor = next;
    guard += 1;
  }

  return points;
};

const blankMonth = () => ({
  household: 0,
  together: 0,
  carlosPersonal: 0,
  mariaPersonal: 0,
});

type MonthTotals = ReturnType<typeof blankMonth>;

const addStackCents = (
  totals: ReturnType<typeof blankMonth>,
  bucket: string,
  cents: number,
): void => {
  if (bucket === "household") {
    totals.household += cents;

    return;
  }

  if (bucket === "together") {
    totals.together += cents;

    return;
  }

  if (bucket === "carlos_personal") {
    totals.carlosPersonal += cents;

    return;
  }

  if (bucket === "maria_personal") {
    totals.mariaPersonal += cents;
  }
};

const nextMonth = (month: string): string => {
  const year = Number(month.slice(0, 4));
  const mon = Number(month.slice(5, 7));

  if (!Number.isInteger(year) || !Number.isInteger(mon) || mon < 1 || mon > 12) {
    return month;
  }

  if (mon === 12) {
    return `${String(year + 1)}-01`;
  }

  const next = mon + 1;

  return `${String(year)}-${next < 10 ? `0${String(next)}` : String(next)}`;
};

const txMonth = (tx: LedgerTransaction): string => {
  if (/^\d{4}-\d{2}$/.test(tx.month)) {
    return tx.month;
  }

  return tx.date.slice(0, 7);
};

const monthRow = (month: string, totals: MonthTotals): MonthlyBucketSpend =>
  MonthlyBucketSpend.make({
    month,
    household: totals.household,
    together: totals.together,
    carlosPersonal: totals.carlosPersonal,
    mariaPersonal: totals.mariaPersonal,
  });

export const monthlyBucketSeries = (
  transactions: ReadonlyArray<LedgerTransaction>,
  from: string,
  to: string,
): ReadonlyArray<MonthlyBucketSpend> => {
  const start = from.slice(0, 7);
  const end = to.slice(0, 7);

  if (!/^\d{4}-\d{2}$/.test(start) || !/^\d{4}-\d{2}$/.test(end) || start > end) {
    return [];
  }

  const totals = new Map<string, ReturnType<typeof blankMonth>>();

  for (const tx of transactions) {
    const cents = outflowCents(tx);

    if (cents === 0) {
      continue;
    }

    const month = txMonth(tx);
    const current = totals.get(month) ?? blankMonth();

    addStackCents(current, tx.budgetBucket, cents);
    totals.set(month, current);
  }

  const rows: Array<MonthlyBucketSpend> = [];
  let cursor = start;
  let guard = 0;

  while (cursor <= end && guard < 36) {
    rows.push(monthRow(cursor, totals.get(cursor) ?? blankMonth()));

    const next = nextMonth(cursor);

    if (next === cursor) {
      break;
    }

    cursor = next;
    guard += 1;
  }

  return rows;
};

export const stackSpendCents = (row: MonthlyBucketSpend): number =>
  row.household + row.together + row.carlosPersonal + row.mariaPersonal;

const splitCsvLine = (line: string): Array<string> => {
  const cells: Array<string> = [];
  let current = "";
  let quoted = false;

  for (const char of line) {
    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());

  return cells;
};

const headerIndex = (header: ReadonlyArray<string>, name: string): number => {
  const wanted = name.toLowerCase();
  let index = 0;

  for (const cell of header) {
    if (cell.toLowerCase() === wanted) {
      return index;
    }

    index += 1;
  }

  return -1;
};

const cellCents = (raw: string | undefined, asCents: boolean): number => {
  if (raw === undefined) {
    return 0;
  }

  const trimmed = raw.trim().replaceAll("$", "").replaceAll(",", "");

  if (trimmed === "" || trimmed === "-") {
    return 0;
  }

  const value = Number(trimmed);

  if (!Number.isFinite(value)) {
    return 0;
  }

  if (asCents) {
    return Math.round(Math.abs(value));
  }

  return Math.abs(dollarsToCents(value));
};

export type MonthlyCsvRead =
  | { readonly ok: true; readonly rows: ReadonlyArray<MonthlyBucketSpend> }
  | { readonly ok: false; readonly error: string };

const rowsFromTotals = (
  totals: ReadonlyMap<string, ReturnType<typeof blankMonth>>,
): ReadonlyArray<MonthlyBucketSpend> => {
  const months = [...totals.keys()].sort((left, right) => left.localeCompare(right));
  const rows: Array<MonthlyBucketSpend> = [];

  for (const month of months) {
    if (!/^\d{4}-\d{2}$/.test(month)) {
      continue;
    }

    const found = totals.get(month);

    if (found !== undefined) {
      rows.push(monthRow(month, found));
    }
  }

  return rows;
};

export const parseMonthlyByBucketCsv = (text: string): MonthlyCsvRead => {
  const lines: Array<string> = [];

  for (const raw of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const line = raw.trim();

    if (line !== "") {
      lines.push(line);
    }
  }

  const headerLine = lines[0];

  if (headerLine === undefined) {
    return { ok: false, error: "monthly_by_bucket.csv is empty" };
  }

  const header = splitCsvLine(headerLine);
  const monthCol = headerIndex(header, "month");

  if (monthCol < 0) {
    return { ok: false, error: "monthly_by_bucket.csv needs a month column" };
  }

  const bucketCol =
    headerIndex(header, "budget_bucket") >= 0
      ? headerIndex(header, "budget_bucket")
      : headerIndex(header, "bucket");

  const centsCol = headerIndex(header, "cents");

  const amountCol =
    headerIndex(header, "amount") >= 0
      ? headerIndex(header, "amount")
      : headerIndex(header, "dollars");

  const householdCol = headerIndex(header, "household");
  const togetherCol = headerIndex(header, "together");
  const carlosCol = headerIndex(header, "carlos_personal");
  const mariaCol = headerIndex(header, "maria_personal");

  const wide =
    householdCol >= 0 && togetherCol >= 0 && carlosCol >= 0 && mariaCol >= 0;

  const long = bucketCol >= 0 && (centsCol >= 0 || amountCol >= 0);

  if (!wide && !long) {
    return {
      ok: false,
      error:
        "monthly_by_bucket.csv needs household, together, carlos_personal, and maria_personal columns, or budget_bucket plus amount",
    };
  }

  const totals = new Map<string, ReturnType<typeof blankMonth>>();

  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    const month = cells[monthCol] ?? "";

    if (!/^\d{4}-\d{2}$/.test(month)) {
      continue;
    }

    const current = totals.get(month) ?? blankMonth();

    if (long && bucketCol >= 0) {
      const bucket = (cells[bucketCol] ?? "").trim();

      const cents =
        centsCol >= 0 ? cellCents(cells[centsCol], true) : cellCents(cells[amountCol], false);

      addStackCents(current, bucket, cents);
    } else {
      current.household += cellCents(cells[householdCol], false);
      current.together += cellCents(cells[togetherCol], false);
      current.carlosPersonal += cellCents(cells[carlosCol], false);
      current.mariaPersonal += cellCents(cells[mariaCol], false);
    }

    totals.set(month, current);
  }

  return { ok: true, rows: rowsFromTotals(totals) };
};

export type MonthlyDollarRow = {
  readonly month: string;
  readonly household: number;
  readonly together: number;
  readonly carlos_personal: number;
  readonly maria_personal: number;
};

export const monthlyRowsFromDollars = (
  rows: ReadonlyArray<MonthlyDollarRow>,
): MonthlyCsvRead => {
  const totals = new Map<string, MonthTotals>();

  for (const row of rows) {
    if (!/^\d{4}-\d{2}$/.test(row.month)) {
      continue;
    }

    const values = [row.household, row.together, row.carlos_personal, row.maria_personal];
    let valid = true;

    for (const value of values) {
      if (!Number.isFinite(value)) {
        valid = false;
      }
    }

    if (!valid) {
      return { ok: false, error: "monthly bucket amounts must be numbers" };
    }

    const current = totals.get(row.month) ?? blankMonth();

    current.household += Math.abs(dollarsToCents(row.household));
    current.together += Math.abs(dollarsToCents(row.together));
    current.carlosPersonal += Math.abs(dollarsToCents(row.carlos_personal));
    current.mariaPersonal += Math.abs(dollarsToCents(row.maria_personal));
    totals.set(row.month, current);
  }

  if (rows.length > 0 && totals.size === 0) {
    return { ok: false, error: "monthly_by_bucket.json needs YYYY-MM months" };
  }

  return { ok: true, rows: rowsFromTotals(totals) };
};

const monthlyFixtureDollars = [
  {
    month: "2026-07",
    household: 1155.91,
    together: 89.81,
    carlos_personal: 3412.07,
    maria_personal: 1461.45,
  },
  {
    month: "2026-08",
    household: 829.13,
    together: 358.5,
    carlos_personal: 1079.78,
    maria_personal: 1207.41,
  },
  {
    month: "2026-09",
    household: 877.77,
    together: 1062.89,
    carlos_personal: 2941.1,
    maria_personal: 1596.07,
  },
  {
    month: "2026-10",
    household: 988.62,
    together: 876.19,
    carlos_personal: 4011.53,
    maria_personal: 1720.06,
  },
] as const;

const monthlyFixtureWire = monthlyFixtureDollars.map((row) => ({
  month: row.month,
  household: Math.abs(dollarsToCents(row.household)),
  together: Math.abs(dollarsToCents(row.together)),
  carlos_personal: Math.abs(dollarsToCents(row.carlos_personal)),
  maria_personal: Math.abs(dollarsToCents(row.maria_personal)),
}));

export const monthlyBucketWire = (
  rows: ReadonlyArray<MonthlyBucketSpend>,
): ReadonlyArray<{
  readonly month: string;
  readonly household: number;
  readonly together: number;
  readonly carlos_personal: number;
  readonly maria_personal: number;
}> => {
  const wire: Array<{
    readonly month: string;
    readonly household: number;
    readonly together: number;
    readonly carlos_personal: number;
    readonly maria_personal: number;
  }> = [];

  for (const row of rows) {
    wire.push({
      month: row.month,
      household: row.household,
      together: row.together,
      carlos_personal: row.carlosPersonal,
      maria_personal: row.mariaPersonal,
    });
  }

  return wire;
};

const searchHaystack = (tx: LedgerTransaction): string =>
  [
    tx.merchant,
    tx.name,
    tx.account,
    tx.person,
    tx.categoryPrimary,
    tx.categoryDetailed,
    tx.budgetBucket,
    budgetBucketLabel(tx.budgetBucket),
  ]
    .join(" ")
    .toLowerCase();

export const defaultSpendFilter = (from: string, to: string): SpendFilter =>
  SpendFilter.make({
    person: "",
    account: "",
    budgetBucket: "",
    categoryPrimary: "",
    categoryDetailed: "",
    categoryConfidence: "",
    dateFrom: from,
    dateTo: to,
    amountMin: "",
    amountMax: "",
    search: "",
    pending: "any",
    countsTowardBudget: "yes",
    excludeNonSpend: true,
  });

export const sameSpendFilter = (left: SpendFilter, right: SpendFilter): boolean =>
  left.person === right.person &&
  left.account === right.account &&
  left.budgetBucket === right.budgetBucket &&
  left.categoryPrimary === right.categoryPrimary &&
  left.categoryDetailed === right.categoryDetailed &&
  left.categoryConfidence === right.categoryConfidence &&
  left.dateFrom === right.dateFrom &&
  left.dateTo === right.dateTo &&
  left.amountMin === right.amountMin &&
  left.amountMax === right.amountMax &&
  left.search === right.search &&
  left.pending === right.pending &&
  left.countsTowardBudget === right.countsTowardBudget &&
  left.excludeNonSpend === right.excludeNonSpend;

const toLedger = (
  wire: SpendFeedWire["transactions"][number],
): LedgerTransaction =>
  LedgerTransaction.make({
    id: wire.id,
    date: wire.date,
    person: wire.person,
    account: wire.account,
    accountId: wire.account_id,
    accountMask: wire.account_mask,
    accountClass: wire.account_class,
    institution: wire.institution,
    name: wire.name,
    merchant: wire.merchant,
    description: wire.description,
    amountCents: dollarsToCents(wire.amount),
    direction: wire.direction,
    currency: wire.currency,
    pending: pendingFlag(wire.pending),
    categoryPrimary: wire.category_primary,
    categoryDetailed: wire.category_detailed,
    categoryConfidence: wire.category_confidence,
    budgetBucket: wire.budget_bucket,
    countsTowardBudget: wire.counts_toward_budget,
    month: wire.month,
    type: wire.type,
  });

const monthlyFromWire = (
  rows: SpendFeedWire["monthly_by_bucket"],
): ReadonlyArray<MonthlyBucketSpend> | undefined => {
  if (rows === undefined) {
    return undefined;
  }

  const decoded: Array<MonthlyBucketSpend> = [];

  for (const row of rows) {
    decoded.push(
      MonthlyBucketSpend.make({
        month: row.month,
        household: row.household,
        together: row.together,
        carlosPersonal: row.carlos_personal,
        mariaPersonal: row.maria_personal,
      }),
    );
  }

  return decoded;
};

export const spendFeedFromWire = (wire: SpendFeedWire): SpendFeed => {
  const monthlyByBucket = monthlyFromWire(wire.monthly_by_bucket);

  if (monthlyByBucket === undefined) {
    return SpendFeed.make({
      period: wire.period,
      asOf: wire.as_of,
      transactions: wire.transactions.map(toLedger),
    });
  }

  return SpendFeed.make({
    period: wire.period,
    asOf: wire.as_of,
    transactions: wire.transactions.map(toLedger),
    monthlyByBucket,
  });
};

interface StubDraft {
  readonly id: string;
  readonly date: string;
  readonly person: "Carlos" | "Maria";
  readonly account: string;
  readonly name: string;
  readonly merchant: string;
  readonly amount: number;
  readonly pending: string;
  readonly categoryPrimary: string;
  readonly categoryDetailed: string;
  readonly categoryConfidence: string;
  readonly budgetBucket: string;
  readonly countsTowardBudget: "yes" | "no";
  readonly direction: "in" | "out";
  readonly type: string;
}

const wireTransaction = (draft: StubDraft) => ({
  id: draft.id,
  date: draft.date,
  person: draft.person,
  account: draft.account,
  account_id: `stub-${draft.id}`,
  account_mask: "0000",
  account_class: draft.account.includes("Visa") ? "liability" : "cash",
  institution: "Scotiabank",
  name: draft.name,
  merchant: draft.merchant,
  description: "",
  amount: draft.amount,
  abs_amount: Math.abs(draft.amount),
  direction: draft.direction,
  currency: "CAD",
  pending: draft.pending,
  category_primary: draft.categoryPrimary,
  category_detailed: draft.categoryDetailed,
  category_confidence: draft.categoryConfidence,
  budget_bucket: draft.budgetBucket,
  counts_toward_budget: draft.countsTowardBudget,
  month: draft.date.slice(0, 7),
  type: draft.type,
});

export const encodedSpendStub = {
  period: { from: "2026-07-01", to: "2026-10-27" },
  as_of: "2026-10-27",
  monthly_by_bucket: monthlyFixtureWire,
  transactions: [
    wireTransaction({
      id: "stub-transit",
      date: "2026-10-27",
      person: "Carlos",
      account: "Carlos Scene+ Visa",
      name: "PRESTO FARE",
      merchant: "Stub Transit",
      amount: -3.3,
      pending: "true",
      categoryPrimary: "TRANSPORTATION",
      categoryDetailed: "TRANSPORTATION_PUBLIC_TRANSIT",
      categoryConfidence: "HIGH",
      budgetBucket: "carlos_personal",
      countsTowardBudget: "yes",
      direction: "out",
      type: "purchase",
    }),
    wireTransaction({
      id: "stub-grocery",
      date: "2026-10-26",
      person: "Maria",
      account: "Maria chequing",
      name: "FARM BOY",
      merchant: "Stub Grocery",
      amount: -42.1,
      pending: "false",
      categoryPrimary: "FOOD_AND_DRINK",
      categoryDetailed: "FOOD_AND_DRINK_GROCERIES",
      categoryConfidence: "VERY_HIGH",
      budgetBucket: "household",
      countsTowardBudget: "yes",
      direction: "out",
      type: "purchase",
    }),
    wireTransaction({
      id: "stub-dinner",
      date: "2026-10-25",
      person: "Carlos",
      account: "Carlos Scene+ Visa",
      name: "DINNER",
      merchant: "Stub Dinner",
      amount: -64,
      pending: "false",
      categoryPrimary: "FOOD_AND_DRINK",
      categoryDetailed: "FOOD_AND_DRINK_RESTAURANT",
      categoryConfidence: "HIGH",
      budgetBucket: "together",
      countsTowardBudget: "yes",
      direction: "out",
      type: "purchase",
    }),
    wireTransaction({
      id: "stub-shop",
      date: "2026-10-20",
      person: "Maria",
      account: "Maria Scene+ Visa",
      name: "CLOTHING",
      merchant: "Stub Shop",
      amount: -28.5,
      pending: "false",
      categoryPrimary: "GENERAL_MERCHANDISE",
      categoryDetailed: "GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES",
      categoryConfidence: "MEDIUM",
      budgetBucket: "maria_personal",
      countsTowardBudget: "yes",
      direction: "out",
      type: "purchase",
    }),
    wireTransaction({
      id: "stub-lamp",
      date: "2026-10-05",
      person: "Carlos",
      account: "Carlos Scene+ Visa",
      name: "LAMP",
      merchant: "Stub Lamp",
      amount: -80,
      pending: "false",
      categoryPrimary: "HOME_IMPROVEMENT",
      categoryDetailed: "HOME_IMPROVEMENT_FURNITURE_AND_HARDWARE",
      categoryConfidence: "HIGH",
      budgetBucket: "move_oneoffs",
      countsTowardBudget: "yes",
      direction: "out",
      type: "purchase",
    }),
    wireTransaction({
      id: "stub-rent",
      date: "2026-10-01",
      person: "Carlos",
      account: "Carlos chequing",
      name: "RENT",
      merchant: "Stub Rent",
      amount: -2850,
      pending: "false",
      categoryPrimary: "RENT_AND_UTILITIES",
      categoryDetailed: "RENT_AND_UTILITIES_RENT",
      categoryConfidence: "HIGH",
      budgetBucket: "rent",
      countsTowardBudget: "no",
      direction: "out",
      type: "cash",
    }),
    wireTransaction({
      id: "stub-payroll",
      date: "2026-10-15",
      person: "Carlos",
      account: "Carlos chequing",
      name: "PAYROLL",
      merchant: "Stub Payroll",
      amount: 100,
      pending: "false",
      categoryPrimary: "INCOME",
      categoryDetailed: "INCOME_WAGES",
      categoryConfidence: "HIGH",
      budgetBucket: "income",
      countsTowardBudget: "no",
      direction: "in",
      type: "cash",
    }),
    wireTransaction({
      id: "stub-transfer",
      date: "2026-10-16",
      person: "Maria",
      account: "Maria chequing",
      name: "VISA PAYMENT",
      merchant: "Stub Transfer",
      amount: -50,
      pending: "false",
      categoryPrimary: "LOAN_PAYMENTS",
      categoryDetailed: "LOAN_PAYMENTS_CREDIT_CARD_PAYMENT",
      categoryConfidence: "HIGH",
      budgetBucket: "transfer_or_payment",
      countsTowardBudget: "no",
      direction: "out",
      type: "cash",
    }),
    wireTransaction({
      id: "stub-july",
      date: "2026-07-04",
      person: "Maria",
      account: "Maria chequing",
      name: "JULY COFFEE",
      merchant: "Stub July",
      amount: -10,
      pending: "false",
      categoryPrimary: "FOOD_AND_DRINK",
      categoryDetailed: "FOOD_AND_DRINK_COFFEE",
      categoryConfidence: "LOW",
      budgetBucket: "together",
      countsTowardBudget: "yes",
      direction: "out",
      type: "purchase",
    }),
  ],
};

export const spendStub: SpendFeed = spendFeedFromWire(
  Schema.decodeUnknownSync(SpendFeedWire)(encodedSpendStub),
);
