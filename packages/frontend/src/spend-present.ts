import {
  type ChartMode,
  type LedgerTransaction,
  type MonthlyBucketSpend,
  type SpendFeed,
  type SpendFilter,
  type SpendSlice,
  bucketSlices,
  budgetBucketLabel,
  formatCad,
  formatPercent,
  merchantBars,
  merchantLabel,
  monthlyBucketSeries,
  querySpend,
  sharePercent,
  stackSpendCents,
  totalOutflowCents,
} from "@expendiru/domain";
import { SpendMark } from "./model.ts";
import { areaFills, seriesPalette } from "./theme.stylex.ts";

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
  readonly d: string;
};

export type BarMark = {
  readonly key: string;
  readonly label: string;
  readonly amountLabel: string;
  readonly widthPercent: number;
  readonly color: string;
};

export type StackBand = {
  readonly key: string;
  readonly label: string;
  readonly color: string;
  readonly fill: string;
  readonly stroke: string;
  readonly cents: number;
  readonly amountLabel: string;
  readonly shareLabel: string;
  readonly path: string;
  readonly line: string;
  readonly dotX: number;
  readonly dotY: number;
  readonly callout: string;
  readonly calloutX: number;
  readonly calloutY: number;
};

export type StackMonthMark = {
  readonly key: string;
  readonly label: string;
  readonly x: number;
};

export type StackChart = {
  readonly width: number;
  readonly height: number;
  readonly empty: boolean;
  readonly caption: string;
  readonly bands: ReadonlyArray<StackBand>;
  readonly months: ReadonlyArray<StackMonthMark>;
};

export type SpendRow = {
  readonly id: string;
  readonly date: string;
  readonly title: string;
  readonly detail: string;
  readonly category: string;
  readonly bucket: string;
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
  readonly stack: StackChart;
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

export const stackChartWidth = 520;

export const stackChartHeight = 230;

const stackPadLeft = 4;

const stackPadRight = 136;

const stackPadTop = 18;

const stackPadBottom = 28;

const pieCenter = 120;

const pieInner = pieRadius - 11;

const pieOuter = pieRadius + 11;

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

const areaFill = (index: number): string => {
  const color = areaFills[index % areaFills.length];

  if (color !== undefined) {
    return color;
  }

  return "#efece6";
};

const bucketFill = (bucket: string, index: number): string => {
  if (bucket === "household") {
    return areaFill(0);
  }

  if (bucket === "together") {
    return areaFill(1);
  }

  if (bucket === "carlos_personal") {
    return areaFill(2);
  }

  if (bucket === "maria_personal") {
    return areaFill(3);
  }

  if (bucket === "move_oneoffs") {
    return areaFill(4);
  }

  return areaFill(index);
};

const coord = (value: number): string => {
  const rounded = Math.round(value * 100) / 100;

  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
};

const arcPoint = (radius: number, turns: number): readonly [number, number] => {
  const theta = turns * 2 * Math.PI - Math.PI / 2;

  return [pieCenter + radius * Math.cos(theta), pieCenter + radius * Math.sin(theta)];
};

const arcCommand = (radius: number, from: number, to: number, sweep: 0 | 1): string => {
  const [x, y] = arcPoint(radius, to);
  const span = Math.abs(to - from);
  const large = span > 0.5 ? 1 : 0;

  return `A ${coord(radius)} ${coord(radius)} 0 ${large} ${sweep} ${coord(x)} ${coord(y)}`;
};

export const donutSlicePath = (startTurns: number, endTurns: number): string => {
  const span = endTurns - startTurns;

  if (span <= 0) {
    return "";
  }

  if (span >= 0.999) {
    const [outerX, outerY] = arcPoint(pieOuter, 0);
    const [innerX, innerY] = arcPoint(pieInner, 0);

    return [
      `M ${coord(outerX)} ${coord(outerY)}`,
      arcCommand(pieOuter, 0, 0.5, 1),
      arcCommand(pieOuter, 0.5, 1, 1),
      `L ${coord(innerX)} ${coord(innerY)}`,
      arcCommand(pieInner, 1, 0.5, 0),
      arcCommand(pieInner, 0.5, 0, 0),
      "Z",
    ].join(" ");
  }

  const [outerX, outerY] = arcPoint(pieOuter, startTurns);
  const [innerEndX, innerEndY] = arcPoint(pieInner, endTurns);

  return [
    `M ${coord(outerX)} ${coord(outerY)}`,
    arcCommand(pieOuter, startTurns, endTurns, 1),
    `L ${coord(innerEndX)} ${coord(innerEndY)}`,
    arcCommand(pieInner, endTurns, startTurns, 0),
    "Z",
  ].join(" ");
};

export const pieTrackPath = donutSlicePath(0, 1);

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

    const start = consumed / pieCircumference;

    rings.push({
      key: slice.key,
      label: slice.label,
      amountLabel: formatCad(slice.cents),
      percentLabel: formatPercent(sharePercent(slice.cents, total)),
      color: bucketColor(slice.key, index),
      length,
      offset: pieCircumference / 4 - consumed,
      circumference: pieCircumference,
      d: donutSlicePath(start, start + length / pieCircumference),
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

const formatShare = (value: number): string => {
  const rounded = Math.round(value * 10) / 10;

  return `${rounded.toFixed(1)}%`;
};

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const monthLabel = (month: string, first: boolean): string => {
  const index = Number(month.slice(5, 7)) - 1;
  const name = monthNames[index];
  const short = name === undefined ? month : name;

  if (!first) {
    return short;
  }

  return `${short} '${month.slice(2, 4)}`;
};

const stackPlotWidth = stackChartWidth - stackPadLeft - stackPadRight;

const stackPlotHeight = stackChartHeight - stackPadTop - stackPadBottom;

const stackBaseline = stackPadTop + stackPlotHeight;

const stackX = (index: number, count: number): number => {
  if (count <= 1) {
    return stackPadLeft + Math.round(stackPlotWidth / 2);
  }

  return stackPadLeft + Math.round((index * stackPlotWidth) / (count - 1));
};

const stackY = (cents: number, maxCents: number): number => {
  if (maxCents <= 0) {
    return stackBaseline;
  }

  return Math.round(stackPadTop + stackPlotHeight - (cents / maxCents) * stackPlotHeight);
};

const bucketCents = (row: MonthlyBucketSpend, key: string): number => {
  if (key === "household") {
    return row.household;
  }

  if (key === "together") {
    return row.together;
  }

  if (key === "carlos_personal") {
    return row.carlosPersonal;
  }

  if (key === "maria_personal") {
    return row.mariaPersonal;
  }

  return 0;
};

const stackLayers = [
  { key: "household", label: "Household" },
  { key: "together", label: "Together" },
  { key: "carlos_personal", label: "Carlos" },
  { key: "maria_personal", label: "Maria" },
] as const;

type CurvePoint = {
  readonly x: number;
  readonly y: number;
};

const smoothLine = (points: ReadonlyArray<CurvePoint>): string => {
  const first = points[0];

  if (first === undefined) {
    return "";
  }

  if (points.length === 1) {
    return `M ${coord(first.x)} ${coord(first.y)}`;
  }

  const slopes: Array<number> = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const left = points[index];
    const right = points[index + 1];
    const run = (right?.x ?? 0) - (left?.x ?? 0);
    const rise = (right?.y ?? 0) - (left?.y ?? 0);
    slopes.push(run === 0 ? 0 : rise / run);
  }

  const tangents = slopes.map((slope, index) => {
    if (index === 0) {
      return slope;
    }

    const previous = slopes[index - 1] ?? 0;

    if (previous * slope <= 0) {
      return 0;
    }

    return (previous + slope) / 2;
  });

  const lastSlope = slopes.at(-1) ?? 0;
  tangents.push(lastSlope);

  for (let index = 0; index < slopes.length; index += 1) {
    const slope = slopes[index] ?? 0;

    if (slope === 0) {
      tangents[index] = 0;
      tangents[index + 1] = 0;
      continue;
    }

    const start = (tangents[index] ?? 0) / slope;
    const end = (tangents[index + 1] ?? 0) / slope;
    const scale = Math.hypot(start, end);

    if (scale > 3) {
      const tau = 3 / scale;
      tangents[index] = tau * start * slope;
      tangents[index + 1] = tau * end * slope;
    }
  }

  const commands = [`M ${coord(first.x)} ${coord(first.y)}`];

  for (let index = 0; index < points.length - 1; index += 1) {
    const left = points[index];
    const right = points[index + 1];

    if (left === undefined || right === undefined) {
      continue;
    }

    const run = right.x - left.x;
    const start = tangents[index] ?? 0;
    const end = tangents[index + 1] ?? 0;
    commands.push(
      `C ${coord(left.x + run / 3)} ${coord(left.y + (start * run) / 3)} ${coord(right.x - run / 3)} ${coord(right.y - (end * run) / 3)} ${coord(right.x)} ${coord(right.y)}`,
    );
  }

  return commands.join(" ");
};

const separateCallouts = (ys: ReadonlyArray<number>): Array<number> => {
  const order = ys
    .map((y, index) => ({ y, index }))
    .sort((left, right) => left.y - right.y);

  const placed = order.map((item) => item.y);
  const minGap = 22;
  let index = 1;

  while (index < placed.length) {
    const previous = placed[index - 1] ?? stackPadTop;
    const current = placed[index] ?? previous;

    if (current < previous + minGap) {
      placed[index] = previous + minGap;
    }

    index += 1;
  }

  const last = placed.at(-1);

  if (last !== undefined && last > stackBaseline) {
    const shift = last - stackBaseline;
    let cursor = 0;

    while (cursor < placed.length) {
      const value = placed[cursor] ?? stackBaseline;
      placed[cursor] = Math.max(stackPadTop, value - shift);
      cursor += 1;
    }
  }

  const result = ys.map((y) => y);
  let cursor = 0;

  while (cursor < order.length) {
    const item = order[cursor];
    const y = placed[cursor];

    if (item !== undefined && y !== undefined) {
      result[item.index] = y;
    }

    cursor += 1;
  }

  return result;
};

export const stackChart = (rows: ReadonlyArray<MonthlyBucketSpend>): StackChart => {
  const months: Array<StackMonthMark> = [];
  let index = 0;

  for (const row of rows) {
    months.push({
      key: row.month,
      label: monthLabel(row.month, index === 0),
      x: stackX(index, rows.length),
    });
    index += 1;
  }

  let maxCents = 0;

  for (const row of rows) {
    const total = stackSpendCents(row);

    if (total > maxCents) {
      maxCents = total;
    }
  }

  const totals = {
    household: 0,
    together: 0,
    carlosPersonal: 0,
    mariaPersonal: 0,
  };

  for (const row of rows) {
    totals.household += row.household;
    totals.together += row.together;
    totals.carlosPersonal += row.carlosPersonal;
    totals.mariaPersonal += row.mariaPersonal;
  }

  const whole =
    totals.household + totals.together + totals.carlosPersonal + totals.mariaPersonal;

  const endRow = rows.at(-1);
  const endWhole = endRow === undefined ? 0 : stackSpendCents(endRow);

  const totalRow: MonthlyBucketSpend = {
    month: "0000-01",
    household: totals.household,
    together: totals.together,
    carlosPersonal: totals.carlosPersonal,
    mariaPersonal: totals.mariaPersonal,
  };

  const bands: Array<StackBand> = [];
  const calloutYs: Array<{ readonly y: number }> = [];
  const floors = rows.map(() => 0);

  for (const layer of stackLayers) {
    const cents = bucketCents(totalRow, layer.key);
    const endCents = endRow === undefined ? 0 : bucketCents(endRow, layer.key);
    const shareLabel = formatShare(sharePercent(endCents, endWhole));

    if (cents <= 0 || rows.length === 0) {
      continue;
    }

    const top = floors.map((floor, point) => {
      const row = rows[point];
      const next = floor + (row === undefined ? 0 : bucketCents(row, layer.key));

      floors[point] = next;

      return next;
    });

    const ceiling: Array<CurvePoint> = [];
    const floorLine: Array<CurvePoint> = [];

    for (let point = 0; point < top.length; point += 1) {
      const row = rows[point];
      const added = row === undefined ? 0 : bucketCents(row, layer.key);
      const x = months[point]?.x ?? stackPadLeft;
      ceiling.push({ x, y: stackY(top[point] ?? 0, maxCents) });
      floorLine.push({ x, y: stackY((top[point] ?? 0) - added, maxCents) });
    }

    const ceilingPath = smoothLine(ceiling);
    const floorPath = smoothLine([...floorLine].reverse()).replace(/^M/, "L");
    const end = ceiling.at(-1);
    const dotX = end?.x ?? stackPadLeft;
    const dotY = end?.y ?? stackBaseline;
    const stroke = bucketColor(layer.key, bands.length);

    calloutYs.push({ y: dotY });
    bands.push({
      key: layer.key,
      label: layer.label,
      color: stroke,
      fill: bucketFill(layer.key, bands.length),
      stroke,
      cents,
      amountLabel: formatCad(cents),
      shareLabel,
      path: `${ceilingPath} ${floorPath} Z`,
      line: ceilingPath,
      dotX,
      dotY,
      callout: `${layer.label} ${shareLabel}`,
      calloutX: dotX + 14,
      calloutY: dotY,
    });
  }

  const placed = separateCallouts(calloutYs.map((band) => band.y));

  const shifted = bands.map((band, bandIndex) => ({
    ...band,
    calloutY: placed[bandIndex] ?? band.calloutY,
  }));

  const first = months[0];
  const last = months.at(-1);

  return {
    width: stackChartWidth,
    height: stackChartHeight,
    empty: whole <= 0 || months.length === 0,
    caption:
      first === undefined || last === undefined ? "" : `${first.label} → ${last.label}`,
    bands: shifted,
    months,
  };
};

const emptyStack = (): StackChart => ({
  width: stackChartWidth,
  height: stackChartHeight,
  empty: true,
  caption: "",
  bands: [],
  months: [],
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
  detail: `${tx.person} · ${tx.account}`,
  category: categoryLine(tx),
  bucket: budgetBucketLabel(tx.budgetBucket),
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
    return "By month";
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

const isHiddenSeries = (hidden: ReadonlyArray<string>, key: string): boolean => {
  for (const item of hidden) {
    if (item === key) {
      return true;
    }
  }

  return false;
};

const seriesKey = (chart: ChartMode, tx: LedgerTransaction): string => {
  if (chart === "bar") {
    return merchantLabel(tx);
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

  const fromTransactions =
    bounds === undefined
      ? []
      : monthlyBucketSeries(chartTransactions, bounds.from, bounds.to);

  const feedMonths = feed.monthlyByBucket ?? [];
  const rangedFeed: Array<MonthlyBucketSpend> = [];

  for (const row of feedMonths) {
    if (bounds === undefined) {
      rangedFeed.push(row);
      continue;
    }

    const start = bounds.from.slice(0, 7);
    const end = bounds.to.slice(0, 7);

    if (row.month >= start && row.month <= end) {
      rangedFeed.push(row);
    }
  }

  const hiddenRows: Array<MonthlyBucketSpend> = [];

  for (const row of rangedFeed.length > 0 ? rangedFeed : fromTransactions) {
    hiddenRows.push({
      month: row.month,
      household: isHiddenSeries(hidden, "household") ? 0 : row.household,
      together: isHiddenSeries(hidden, "together") ? 0 : row.together,
      carlosPersonal: isHiddenSeries(hidden, "carlos_personal") ? 0 : row.carlosPersonal,
      mariaPersonal: isHiddenSeries(hidden, "maria_personal") ? 0 : row.mariaPersonal,
    });
  }

  const stacked = hiddenRows;

  const noun = listTransactions.length === 1 ? "transaction" : "transactions";

  return {
    totalLabel: formatCad(outflow),
    countLabel: `${listTransactions.length} ${noun} · ${formatCad(listOutflow)} out`,
    chartTitle: chartTitle(chart),
    chartEmpty: !queried.amountValid || outflow === 0,
    amountError: !queried.amountValid,
    rings: pieRings(slices),
    bars: barMarks(merchants),
    stack: stacked.length === 0 ? emptyStack() : stackChart(stacked),
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
