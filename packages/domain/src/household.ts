import { Schema } from "effect";

export const CanadianDollars = Schema.Struct({
  cents: Schema.Natural,
  currency: Schema.Literals(["CAD"]),
});

export interface CanadianDollars extends Schema.Schema.Type<typeof CanadianDollars> {}

export const Person = Schema.Literals(["Carlos", "Maria"]);

export type Person = Schema.Schema.Type<typeof Person>;

export const BucketId = Schema.Literals([
  "household",
  "together",
  "carlos",
  "maria",
]);

export type BucketId = Schema.Schema.Type<typeof BucketId>;

export const SnapshotSource = Schema.Literals(["fixture", "live"]);

export type SnapshotSource = Schema.Schema.Type<typeof SnapshotSource>;

export const EmergencyFund = Schema.Struct({
  name: Schema.String,
  saved: CanadianDollars,
  target: CanadianDollars,
});

export interface EmergencyFund extends Schema.Schema.Type<typeof EmergencyFund> {}

export const VisaCard = Schema.Struct({
  id: Schema.String,
  label: Schema.String,
  holder: Person,
  limit: CanadianDollars,
  balance: CanadianDollars,
});

export interface VisaCard extends Schema.Schema.Type<typeof VisaCard> {}

export const BudgetBucket = Schema.Struct({
  id: BucketId,
  name: Schema.String,
  budget: CanadianDollars,
  spent: CanadianDollars,
});

export interface BudgetBucket extends Schema.Schema.Type<typeof BudgetBucket> {}

export const HouseholdSnapshot = Schema.Struct({
  householdName: Schema.String,
  city: Schema.Literals(["Toronto"]),
  periodLabel: Schema.String,
  asOfLabel: Schema.String,
  dayOfMonth: Schema.Int,
  daysInMonth: Schema.Int,
  source: SnapshotSource,
  emergencyFund: EmergencyFund,
  cards: Schema.Tuple([VisaCard, VisaCard]),
  buckets: Schema.Tuple([
    BudgetBucket,
    BudgetBucket,
    BudgetBucket,
    BudgetBucket,
  ]),
}).annotate({ identifier: "HouseholdSnapshot" });

export interface HouseholdSnapshot extends Schema.Schema.Type<typeof HouseholdSnapshot> {}

export type PaceStanding = "under" | "on" | "over";

const cad = (cents: number) => ({ cents, currency: "CAD" });

export const formatCad = (cents: number): string => {
  const negative = cents < 0;
  const absolute = Math.abs(Math.trunc(cents));
  const dollars = Math.floor(absolute / 100);
  const remainder = absolute % 100;
  const grouped = String(dollars).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const prefix = negative ? "-$" : "$";

  return `${prefix}${grouped}.${String(remainder).padStart(2, "0")}`;
};

export const paceCents = (
  budgetCents: number,
  dayOfMonth: number,
  daysInMonth: number,
): number => {
  if (daysInMonth <= 0) {
    return 0;
  }

  return Math.round((budgetCents * dayOfMonth) / daysInMonth);
};

export const paceStanding = (
  spentCents: number,
  expectedCents: number,
): PaceStanding => {
  if (spentCents === expectedCents) {
    return "on";
  }

  return spentCents < expectedCents ? "under" : "over";
};

export const roomLeftCents = (limitCents: number, balanceCents: number): number =>
  limitCents - balanceCents;

export const sharePercent = (part: number, whole: number): number => {
  if (whole <= 0) {
    return 0;
  }

  return (part / whole) * 100;
};

export const cappedPercent = (value: number): number =>
  Math.min(100, Math.max(0, value));

export const formatPercent = (value: number): string => {
  const rounded = Math.round(value * 10) / 10;

  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
};

export const encodedHouseholdFixture = {
  householdName: "Carlos & Maria",
  city: "Toronto",
  periodLabel: "October 2026",
  asOfLabel: "28 Oct 2026",
  dayOfMonth: 28,
  daysInMonth: 31,
  source: "fixture",
  emergencyFund: {
    name: "Emergency fund",
    saved: cad(745_000),
    target: cad(1_200_000),
  },
  cards: [
    {
      id: "scotia-visa-carlos",
      label: "Scotia Visa · Carlos",
      holder: "Carlos",
      limit: cad(800_000),
      balance: cad(214_055),
    },
    {
      id: "scotia-visa-maria",
      label: "Scotia Visa · Maria",
      holder: "Maria",
      limit: cad(500_000),
      balance: cad(86_020),
    },
  ],
  buckets: [
    {
      id: "household",
      name: "Household",
      budget: cad(320_000),
      spent: cad(264_000),
    },
    {
      id: "together",
      name: "Together",
      budget: cad(90_000),
      spent: cad(102_000),
    },
    {
      id: "carlos",
      name: "Carlos",
      budget: cad(45_000),
      spent: cad(21_000),
    },
    {
      id: "maria",
      name: "Maria",
      budget: cad(45_000),
      spent: cad(43_000),
    },
  ],
};

export const householdFixture: HouseholdSnapshot =
  Schema.decodeUnknownSync(HouseholdSnapshot)(encodedHouseholdFixture);
