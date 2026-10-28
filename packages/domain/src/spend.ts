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

export const SpendFeed = Schema.Struct({
  period: SpendPeriod,
  asOf: IsoDate,
  transactions: Schema.Array(LedgerTransaction),
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

export const spendFeedFromWire = (wire: SpendFeedWire): SpendFeed =>
  SpendFeed.make({
    period: wire.period,
    asOf: wire.as_of,
    transactions: wire.transactions.map(toLedger),
  });

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
