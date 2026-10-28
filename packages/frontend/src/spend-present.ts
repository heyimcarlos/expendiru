import {
  type ChartMode,
  type DailySpend,
  type LedgerTransaction,
  type SpendFeed,
  type SpendFilter,
  type SpendSlice,
  bucketSlices,
  budgetBucketLabel,
  dailySeries,
  formatCad,
  formatPercent,
  merchantBars,
  merchantLabel,
  querySpend,
  sharePercent,
  totalOutflowCents,
} from "@expendiru/domain";
import { SpendMark } from "./model.ts";
import { seriesPalette } from "./theme.stylex.ts";

export type SpendChoice = {
  readonly value: string;
  readonly label: string;
};

export type PieRing = {
  readonly key: string;
  readonly label: string;
  readonly amountLabel: string;
  readonly percentLabel: string;
  readonly color: string;
  readonly length: number;
  readonly offset: number;
  readonly circumference: number;
};

export type BarMark = {
  readonly key: string;
  readonly label: string;
  readonly amountLabel: string;
  readonly widthPercent: number;
  readonly color: string;
};

export type LinePoint = {
  readonly date: string;
  readonly cents: number;
  readonly x: number;
  readonly y: number;
};

export type LineChart = {
  readonly width: number;
  readonly height: number;
  readonly top: number;
  readonly mid: number;
  readonly baseline: number;
  readonly points: ReadonlyArray<LinePoint>;
  readonly polyline: string;
  readonly maxLabel: string;
  readonly firstDate: string;
  readonly lastDate: string;
};

export type SpendRow = {
  readonly id: string;
  readonly date: string;
  readonly title: string;
  readonly detail: string;
  readonly category: string;
  readonly amountLabel: string;
  readonly pending: boolean;
  readonly incoming: boolean;
  readonly bucketKey: string;
  readonly merchantKey: string;
};

export type PresentedSpend = {
  readonly totalLabel: string;
  readonly countLabel: string;
  readonly chartTitle: string;
  readonly chartEmpty: boolean;
  readonly amountError: boolean;
  readonly rings: ReadonlyArray<PieRing>;
  readonly bars: ReadonlyArray<BarMark>;
  readonly line: LineChart;
  readonly rows: ReadonlyArray<SpendRow>;
  readonly people: ReadonlyArray<SpendChoice>;
  readonly accounts: ReadonlyArray<SpendChoice>;
  readonly buckets: ReadonlyArray<SpendChoice>;
  readonly categories: ReadonlyArray<SpendChoice>;
  readonly detailed: ReadonlyArray<SpendChoice>;
  readonly confidence: ReadonlyArray<SpendChoice>;
};

export const pieRadius = 78;

export const pieCircumference = 2 * Math.PI * pieRadius;

export const lineChartWidth = 640;

export const lineChartHeight = 220;

const linePad = 16;

export const seriesColor = (index: number): string => {
  const color = seriesPalette[index % seriesPalette.length];

  if (color !== undefined) {
    return color;
  }

  return "#5e6ad2";
};

const bucketColor = (bucket: string, index: number): string => {
  if (bucket === "household") {
    return seriesColor(0);
  }

  if (bucket === "together") {
    return seriesColor(1);
  }

  if (bucket === "carlos_personal") {
    return seriesColor(2);
  }

  if (bucket === "maria_personal") {
    return seriesColor(3);
  }

  if (bucket === "move_oneoffs") {
    return seriesColor(4);
  }

  return seriesColor(index);
};

export const categoryLabel = (value: string): string => {
  if (value === "") {
    return "Uncategorized";
  }

  const spaced = value.replaceAll("_", " ").toLowerCase();

  return `${spaced.charAt(0).toUpperCase()}${spaced.slice(1)}`;
};

export const pieRings = (slices: ReadonlyArray<SpendSlice>): ReadonlyArray<PieRing> => {
  let total = 0;

  for (const slice of slices) {
    total += slice.cents;
  }

  if (total <= 0) {
    return [];
  }

  const gap = slices.length > 1 ? 2 : 0;
  const rings: Array<PieRing> = [];
  let consumed = 0;
  let index = 0;

  for (const slice of slices) {
    const raw = (slice.cents / total) * pieCircumference;
    const length = slices.length === 1 ? pieCircumference : Math.max(0, raw - gap);

    rings.push({
      key: slice.key,
      label: slice.label,
      amountLabel: formatCad(slice.cents),
      percentLabel: formatPercent(sharePercent(slice.cents, total)),
      color: bucketColor(slice.key, index),
      length,
      offset: pieCircumference / 4 - consumed,
      circumference: pieCircumference,
    });
    consumed += raw;
    index += 1;
  }

  return rings;
};

export const barMarks = (slices: ReadonlyArray<SpendSlice>): ReadonlyArray<BarMark> => {
  let max = 0;

  for (const slice of slices) {
    if (slice.cents > max) {
      max = slice.cents;
    }
  }

  const marks: Array<BarMark> = [];
  let index = 0;

  for (const slice of slices) {
    marks.push({
      key: slice.key,
      label: slice.label,
      amountLabel: formatCad(slice.cents),
      widthPercent: max <= 0 ? 0 : (slice.cents / max) * 100,
      color: seriesColor(index),
    });
    index += 1;
  }

  return marks;
};

const yAt = (cents: number, maxCents: number): number => {
  const plotHeight = lineChartHeight - linePad * 2;

  if (maxCents <= 0) {
    return lineChartHeight - linePad;
  }

  return linePad + Math.round(plotHeight - (cents / maxCents) * plotHeight);
};

const xAt = (index: number, count: number): number => {
  const plotWidth = lineChartWidth - linePad * 2;

  if (count <= 1) {
    return linePad + Math.round(plotWidth / 2);
  }

  return linePad + Math.round((index * plotWidth) / (count - 1));
};

export const lineChart = (series: ReadonlyArray<DailySpend>): LineChart => {
  let maxCents = 0;

  for (const point of series) {
    if (point.cents > maxCents) {
      maxCents = point.cents;
    }
  }

  const points: Array<LinePoint> = [];
  let index = 0;

  for (const point of series) {
    points.push({
      date: point.date,
      cents: point.cents,
      x: xAt(index, series.length),
      y: yAt(point.cents, maxCents),
    });
    index += 1;
  }

  const top = yAt(maxCents, maxCents);
  const baseline = yAt(0, maxCents);
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
  const first = points[0];
  const last = points.at(-1);

  return {
    width: lineChartWidth,
    height: lineChartHeight,
    top,
    mid: Math.round((top + baseline) / 2),
    baseline,
    points,
    polyline,
    maxLabel: formatCad(maxCents),
    firstDate: first === undefined ? "" : first.date,
    lastDate: last === undefined ? "" : last.date,
  };
};

const emptyLine = (): LineChart => ({
  width: lineChartWidth,
  height: lineChartHeight,
  top: linePad,
  mid: Math.round(lineChartHeight / 2),
  baseline: lineChartHeight - linePad,
  points: [],
  polyline: "",
  maxLabel: formatCad(0),
  firstDate: "",
  lastDate: "",
});

const choiceList = (
  selected: string,
  values: ReadonlyArray<string>,
  labelFor: (value: string) => string,
): ReadonlyArray<SpendChoice> => {
  const unique = new Set<string>();

  for (const value of values) {
    if (value !== "") {
      unique.add(value);
    }
  }

  if (selected !== "") {
    unique.add(selected);
  }

  const sorted = [...unique].sort((left, right) => left.localeCompare(right));
  const choices: Array<SpendChoice> = [];

  for (const value of sorted) {
    choices.push({ value, label: labelFor(value) });
  }

  return choices;
};

const categoryLine = (tx: LedgerTransaction): string => {
  const parts: Array<string> = [];

  if (tx.categoryPrimary !== "") {
    parts.push(categoryLabel(tx.categoryPrimary));
  }

  if (tx.categoryDetailed !== "") {
    parts.push(categoryLabel(tx.categoryDetailed));
  }

  if (tx.categoryConfidence !== "") {
    parts.push(categoryLabel(tx.categoryConfidence));
  }

  if (parts.length === 0) {
    return "Uncategorized";
  }

  return parts.join(" · ");
};

const presentRow = (tx: LedgerTransaction): SpendRow => ({
  id: tx.id,
  date: tx.date,
  title: merchantLabel(tx),
  detail: `${tx.person} · ${tx.account} · ${budgetBucketLabel(tx.budgetBucket)}`,
  category: categoryLine(tx),
  amountLabel: formatCad(tx.amountCents),
  pending: tx.pending === "true",
  incoming: tx.amountCents > 0,
  bucketKey: tx.budgetBucket,
  merchantKey: merchantLabel(tx),
});

const chartTitle = (chart: ChartMode): string => {
  if (chart === "bar") {
    return "By merchant";
  }

  if (chart === "line") {
    return "By day";
  }

  return "By bucket";
};

const lineBounds = (
  filter: SpendFilter,
  rows: ReadonlyArray<LedgerTransaction>,
): { readonly from: string; readonly to: string } | undefined => {
  if (filter.dateFrom !== "" && filter.dateTo !== "" && filter.dateFrom <= filter.dateTo) {
    return { from: filter.dateFrom, to: filter.dateTo };
  }

  let from = "";
  let to = "";

  for (const tx of rows) {
    if (from === "" || tx.date < from) {
      from = tx.date;
    }

    if (to === "" || tx.date > to) {
      to = tx.date;
    }
  }

  if (from === "" || to === "") {
    return undefined;
  }

  return { from, to };
};

const seriesKey = (chart: ChartMode, tx: LedgerTransaction): string => {
  if (chart === "bar") {
    return merchantLabel(tx);
  }

  if (chart === "line") {
    return tx.date;
  }

  return tx.budgetBucket;
};

const withoutHidden = (
  transactions: ReadonlyArray<LedgerTransaction>,
  chart: ChartMode,
  hidden: ReadonlyArray<string>,
): ReadonlyArray<LedgerTransaction> => {
  if (hidden.length === 0) {
    return transactions;
  }

  const kept: Array<LedgerTransaction> = [];

  for (const tx of transactions) {
    const key = seriesKey(chart, tx);
    let skip = false;

    for (const hiddenKey of hidden) {
      if (hiddenKey === key) {
        skip = true;
        break;
      }
    }

    if (!skip) {
      kept.push(tx);
    }
  }

  return kept;
};

const matchingFocus = (
  transactions: ReadonlyArray<LedgerTransaction>,
  focus: SpendMark,
): ReadonlyArray<LedgerTransaction> => {
  const kept: Array<LedgerTransaction> = [];

  for (const tx of transactions) {
    const keep = SpendMark.match(focus, {
      Idle: () => true,
      Bucket: ({ key }) => tx.budgetBucket === key,
      Merchant: ({ key }) => merchantLabel(tx) === key,
      Day: ({ key }) => tx.date === key,
    });

    if (keep) {
      kept.push(tx);
    }
  }

  return kept;
};

export const presentSpend = (
  feed: SpendFeed,
  filter: SpendFilter,
  chart: ChartMode,
  focus: SpendMark = SpendMark.Idle(),
  hidden: ReadonlyArray<string> = [],
): PresentedSpend => {
  const queried = querySpend(feed.transactions, filter);
  const chartTransactions = withoutHidden(queried.transactions, chart, hidden);
  const listTransactions = matchingFocus(chartTransactions, focus);
  const outflow = totalOutflowCents(chartTransactions);
  const listOutflow = totalOutflowCents(listTransactions);
  const slices = bucketSlices(chartTransactions);
  const merchants = merchantBars(chartTransactions, 8);
  const bounds = lineBounds(filter, chartTransactions);

  const series =
    bounds === undefined ? [] : dailySeries(chartTransactions, bounds.from, bounds.to);

  const noun = listTransactions.length === 1 ? "transaction" : "transactions";

  return {
    totalLabel: formatCad(outflow),
    countLabel: `${listTransactions.length} ${noun} · ${formatCad(listOutflow)} out`,
    chartTitle: chartTitle(chart),
    chartEmpty: !queried.amountValid || outflow === 0,
    amountError: !queried.amountValid,
    rings: pieRings(slices),
    bars: barMarks(merchants),
    line: series.length === 0 || outflow === 0 ? emptyLine() : lineChart(series),
    rows: listTransactions.map(presentRow),
    people: choiceList(
      filter.person,
      feed.transactions.map((tx) => tx.person),
      (value) => value,
    ),
    accounts: choiceList(
      filter.account,
      feed.transactions.map((tx) => tx.account),
      (value) => value,
    ),
    buckets: choiceList(
      filter.budgetBucket,
      feed.transactions.map((tx) => tx.budgetBucket),
      budgetBucketLabel,
    ),
    categories: choiceList(
      filter.categoryPrimary,
      feed.transactions.map((tx) => tx.categoryPrimary),
      categoryLabel,
    ),
    detailed: choiceList(
      filter.categoryDetailed,
      feed.transactions.map((tx) => tx.categoryDetailed),
      categoryLabel,
    ),
    confidence: choiceList(
      filter.categoryConfidence,
      feed.transactions.map((tx) => tx.categoryConfidence),
      categoryLabel,
    ),
  };
};
