import {
  type HouseholdSnapshot,
  type PaceStanding,
  cappedPercent,
  formatCad,
  formatPercent,
  paceCents,
  paceStanding,
  roomLeftCents,
  sharePercent,
} from "@expendiru/domain";

export type PaperTone = "blue" | "green" | "yellow" | "orange";

export type PresentedCard = Readonly<{
  id: string;
  label: string;
  roomLabel: string;
  detail: string;
  roomPercent: number;
  tone: PaperTone;
}>;

export type PresentedBucket = Readonly<{
  id: string;
  name: string;
  spentLabel: string;
  budgetLabel: string;
  paceLabel: string;
  spentPercent: number;
  pacePercent: number;
  standing: PaceStanding;
  standingLabel: string;
  tone: PaperTone;
}>;

export type PresentedHousehold = Readonly<{
  lede: string;
  emergencyName: string;
  savedLabel: string;
  targetLabel: string;
  savedPercent: number;
  savedCaption: string;
  cards: ReadonlyArray<PresentedCard>;
  buckets: ReadonlyArray<PresentedBucket>;
  paceCaption: string;
}>;

const standingLabel = (standing: PaceStanding): string => {
  if (standing === "under") {
    return "under pace";
  }

  if (standing === "on") {
    return "on pace";
  }

  return "over pace";
};

const bucketTone = (id: PresentedBucket["id"]): PaperTone => {
  if (id === "household") {
    return "blue";
  }

  if (id === "together") {
    return "yellow";
  }

  if (id === "carlos") {
    return "green";
  }

  return "orange";
};

export const presentHousehold = (
  snapshot: HouseholdSnapshot,
): PresentedHousehold => {
  const savedPercent = sharePercent(
    snapshot.emergencyFund.saved.cents,
    snapshot.emergencyFund.target.cents,
  );

  const savedLabel = formatCad(snapshot.emergencyFund.saved.cents);
  const targetLabel = formatCad(snapshot.emergencyFund.target.cents);

  return {
    lede: `${snapshot.householdName} · ${snapshot.city} · ${snapshot.periodLabel}, day ${snapshot.dayOfMonth} of ${snapshot.daysInMonth}.`,
    emergencyName: snapshot.emergencyFund.name,
    savedLabel,
    targetLabel,
    savedPercent,
    savedCaption: `${formatPercent(savedPercent)} of the ${targetLabel} target, as of ${snapshot.asOfLabel}.`,
    cards: snapshot.cards.map((card) => {
      const room = roomLeftCents(card.limit.cents, card.balance.cents);

      return {
        id: card.id,
        label: card.label,
        roomLabel: formatCad(room),
        detail: `${formatCad(card.balance.cents)} on the card · ${formatCad(card.limit.cents)} limit`,
        roomPercent: cappedPercent(sharePercent(room, card.limit.cents)),
        tone: card.holder === "Carlos" ? "blue" : "orange",
      };
    }),
    buckets: snapshot.buckets.map((bucket) => {
      const expected = paceCents(
        bucket.budget.cents,
        snapshot.dayOfMonth,
        snapshot.daysInMonth,
      );

      const standing = paceStanding(bucket.spent.cents, expected);

      return {
        id: bucket.id,
        name: bucket.name,
        spentLabel: formatCad(bucket.spent.cents),
        budgetLabel: formatCad(bucket.budget.cents),
        paceLabel: formatCad(expected),
        spentPercent: sharePercent(bucket.spent.cents, bucket.budget.cents),
        pacePercent: cappedPercent(
          sharePercent(expected, bucket.budget.cents),
        ),
        standing,
        standingLabel: standingLabel(standing),
        tone: bucketTone(bucket.id),
      };
    }),
    paceCaption: `Straight-line pace for ${snapshot.asOfLabel}. The ink tick is where spending would be if the month were even.`,
  };
};
