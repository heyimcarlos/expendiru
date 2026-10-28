import {
  type ChartMode,
  type SpendFilter,
  SpendFilter as SpendFilterSchema,
} from "@expendiru/domain";
import { Button, Checkbox, Input, Select } from "@foldkit/ui";
import type { Html, HtmlBuilder } from "foldkit/html";
import * as stylex from "@stylexjs/stylex";
import { Message } from "./message.ts";
import { type Model, Refresh } from "./model.ts";
import {
  type SpendChoice,
  lineChartHeight,
  lineChartWidth,
  pieRadius,
  presentSpend,
} from "./spend-present.ts";
import { palette, styleAttributes, styles } from "./theme.stylex.ts";

const pendingChoice = (value: string): SpendFilter["pending"] => {
  if (value === "true" || value === "false" || value === "unknown") {
    return value;
  }

  return "any";
};

const countsChoice = (value: string): SpendFilter["countsTowardBudget"] => {
  if (value === "yes" || value === "no") {
    return value;
  }

  return "any";
};

const withFilter = (filter: SpendFilter, patch: Partial<SpendFilter>): SpendFilter =>
  SpendFilterSchema.make({ ...filter, ...patch });

const optionNodes = (
  selected: string,
  anyValue: string,
  anyLabel: string,
  choices: ReadonlyArray<SpendChoice>,
  h: HtmlBuilder<Message>,
): ReadonlyArray<Html> => {
  const nodes: Array<Html> = [
    h.option([h.Value(anyValue), h.Selected(selected === anyValue)], [anyLabel]),
  ];

  for (const choice of choices) {
    nodes.push(
      h.option(
        [h.Value(choice.value), h.Selected(choice.value === selected)],
        [choice.label],
      ),
    );
  }

  return nodes;
};

const labeledSelect = (
  id: string,
  label: string,
  selected: string,
  anyValue: string,
  anyLabel: string,
  choices: ReadonlyArray<SpendChoice>,
  onChange: (value: string) => Message,
  h: HtmlBuilder<Message>,
): Html =>
  Select.view(
    {
      id,
      value: selected,
      onChange,
      toView: (attributes) =>
        h.div([...styleAttributes(h, stylex.props(styles.field))], [
          h.label(
            [...attributes.label, ...styleAttributes(h, stylex.props(styles.fieldLabel))],
            [label],
          ),
          h.select(
            [...attributes.select, ...styleAttributes(h, stylex.props(styles.control))],
            optionNodes(selected, anyValue, anyLabel, choices, h),
          ),
        ]),
    },
    h,
  );

const labeledInput = (
  id: string,
  label: string,
  value: string,
  type: string,
  onInput: (value: string) => Message,
  h: HtmlBuilder<Message>,
): Html =>
  Input.view(
    {
      id,
      type,
      value,
      onInput,
      toView: (attributes) =>
        h.div([...styleAttributes(h, stylex.props(styles.field))], [
          h.label(
            [...attributes.label, ...styleAttributes(h, stylex.props(styles.fieldLabel))],
            [label],
          ),
          h.input([
            ...attributes.input,
            ...styleAttributes(h, stylex.props(styles.control)),
          ]),
        ]),
    },
    h,
  );

const modeButton = (
  mode: ChartMode,
  label: string,
  active: ChartMode,
  h: HtmlBuilder<Message>,
): Html =>
  Button.view(
    {
      type: "button",
      onClick: Message.ClickedChart({ mode }),
      toView: (attributes) =>
        h.button(
          [
            ...attributes.button,
            h.AriaPressed(active === mode ? "true" : "false"),
            ...styleAttributes(
              h,
              active === mode
                ? stylex.props(styles.button, styles.buttonOn)
                : stylex.props(styles.button),
            ),
          ],
          [label],
        ),
    },
    h,
  );

const pieChart = (
  rings: ReturnType<typeof presentSpend>["rings"],
  replay: number,
  h: HtmlBuilder<Message>,
): Html =>
  h.div([...styleAttributes(h, stylex.props(styles.chartRow))], [
    h.svg(
      [
        h.ViewBox("0 0 240 240"),
        h.Role("img"),
        h.AriaLabel("Spending by bucket"),
        ...styleAttributes(h, stylex.props(styles.chartPie)),
      ],
      [
        h.circle([
          h.Cx("120"),
          h.Cy("120"),
          h.R(String(pieRadius)),
          h.Fill("none"),
          h.Stroke(palette.gray),
          h.StrokeWidth("36"),
        ]),
        ...rings.map((ring, index) =>
          h.keyed("circle")(
            `${ring.key}-${replay}`,
            [
              h.Cx("120"),
              h.Cy("120"),
              h.R(String(pieRadius)),
              h.Fill("none"),
              h.Stroke(ring.color),
              h.StrokeWidth("36"),
              h.StrokeLinecap("butt"),
              h.StrokeDasharray(
                `${ring.length.toFixed(2)} ${(ring.circumference - ring.length).toFixed(2)}`,
              ),
              h.StrokeDashoffset(ring.offset.toFixed(2)),
              ...styleAttributes(
                h,
                stylex.props(
                  styles.pieDraw(ring.offset + ring.length, ring.offset, index * 80),
                ),
              ),
            ],
          ),
        ),
      ],
    ),
    h.ul([...styleAttributes(h, stylex.props(styles.legend))], [
      ...rings.map((ring, index) =>
        h.keyed("li")(
          `${ring.key}-${replay}`,
          [...styleAttributes(h, stylex.props(styles.legendItem, styles.rise(120 + index * 70)))],
          [
            h.span([
              ...styleAttributes(h, stylex.props(styles.swatch(ring.color))),
            ]),
            h.span([], [`${ring.label} · ${ring.amountLabel} · ${ring.percentLabel}`]),
          ],
        ),
      ),
    ]),
  ]);

const barChart = (
  bars: ReturnType<typeof presentSpend>["bars"],
  replay: number,
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [
      h.Role("img"),
      h.AriaLabel("Spending by merchant"),
      ...styleAttributes(h, stylex.props(styles.chartFrame)),
    ],
    bars.map((bar, index) =>
      h.keyed("div")(
        `${bar.key}-${replay}`,
        [...styleAttributes(h, stylex.props(styles.barRow, styles.rise(index * 110)))],
        [
          h.span([...styleAttributes(h, stylex.props(styles.barLabel))], [bar.label]),
          h.div([...styleAttributes(h, stylex.props(styles.track, styles.barTrack))], [
            h.div([
              ...styleAttributes(
                h,
                stylex.props(styles.barFill(bar.widthPercent, bar.color, 80 + index * 110)),
              ),
            ]),
          ]),
          h.span([...styleAttributes(h, stylex.props(styles.barAmount))], [bar.amountLabel]),
        ],
      ),
    ),
  );

const gridLine = (
  key: string,
  y: number,
  ink: boolean,
  h: HtmlBuilder<Message>,
): Html =>
  h.keyed("line")(key, [
    h.X1("16"),
    h.X2(String(lineChartWidth - 16)),
    h.Y1(String(y)),
    h.Y2(String(y)),
    h.Stroke(ink ? palette.ink : palette.gray),
    h.StrokeWidth("2"),
    h.ShapeRendering("crispEdges"),
    h.VectorEffect("non-scaling-stroke"),
  ]);

const lineChart = (
  line: ReturnType<typeof presentSpend>["line"],
  replay: number,
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [
      h.Key(`line-${replay}`),
      ...styleAttributes(h, stylex.props(styles.chartFrame, styles.lineDraw)),
    ],
    [
    h.svg(
      [
        h.ViewBox(`0 0 ${lineChartWidth} ${lineChartHeight}`),
        h.Role("img"),
        h.AriaLabel("Spending by day"),
        h.PreserveAspectRatio("xMidYMid meet"),
        ...styleAttributes(h, stylex.props(styles.chartLine)),
      ],
      [
        gridLine("peak", line.top, false, h),
        gridLine("mid", line.mid, false, h),
        gridLine("base", line.baseline, true, h),
        h.polyline([
          h.Points(line.polyline),
          h.Fill("none"),
          h.Stroke(palette.ink),
          h.StrokeWidth("2"),
          h.StrokeLinecap("round"),
          h.StrokeLinejoin("round"),
          h.VectorEffect("non-scaling-stroke"),
        ]),
        ...line.points.map((point) =>
          h.keyed("circle")(
            point.date,
            [
              h.Cx(String(point.x)),
              h.Cy(String(point.y)),
              h.R("4"),
              h.Fill(palette.blueInk),
            ],
          ),
        ),
      ],
    ),
    h.p(
      [...styleAttributes(h, stylex.props(styles.caption))],
      [`${line.firstDate} → ${line.lastDate} · peak ${line.maxLabel}`],
    ),
  ]);

const transactionList = (
  rows: ReturnType<typeof presentSpend>["rows"],
  replay: number,
  h: HtmlBuilder<Message>,
): Html =>
  h.ul([...styleAttributes(h, stylex.props(styles.txList))], [
    ...rows.map((row, index) =>
      h.keyed("li")(
        `${row.id}-${replay}`,
        [
          ...styleAttributes(
            h,
            stylex.props(styles.txRow, styles.rise(Math.min(index, 14) * 40)),
          ),
        ],
        [
          h.div([], [
            h.p([...styleAttributes(h, stylex.props(styles.txTitle))], [
              `${row.date} · ${row.title}`,
              row.pending ? " · pending" : "",
            ]),
            h.p([...styleAttributes(h, stylex.props(styles.caption))], [row.detail]),
            h.p([...styleAttributes(h, stylex.props(styles.caption))], [row.category]),
          ]),
          h.p(
            [
              ...styleAttributes(
                h,
                stylex.props(row.incoming ? styles.amountIn : styles.amountOut),
              ),
            ],
            [row.amountLabel],
          ),
        ],
      ),
    ),
  ]);

const chartBody = (
  mode: ChartMode,
  presented: ReturnType<typeof presentSpend>,
  replay: number,
  h: HtmlBuilder<Message>,
): Html => {
  if (presented.chartEmpty) {
    return h.p(
      [...styleAttributes(h, stylex.props(styles.lede))],
      [
        presented.amountError
          ? "Amount filters need a number, like -42.10 or 100."
          : "No money out in this filter.",
      ],
    );
  }

  if (mode === "bar") {
    return barChart(presented.bars, replay, h);
  }

  if (mode === "line") {
    return lineChart(presented.line, replay, h);
  }

  return pieChart(presented.rings, replay, h);
};

const spendNotice = (refresh: Refresh, h: HtmlBuilder<Message>): Html =>
  Refresh.match(refresh, {
    Idle: () => h.empty,
    Failed: ({ error }) =>
      h.div([...styleAttributes(h, stylex.props(styles.notice))], [
        h.p(
          [...styleAttributes(h, stylex.props(styles.detail))],
          [`Couldn't refresh spending from the household API. Showing the stub. ${error}`],
        ),
        Button.view(
          {
            type: "button",
            onClick: Message.ClickedRetrySpend(),
            toView: (attributes) =>
              h.button(
                [...attributes.button, ...styleAttributes(h, stylex.props(styles.button))],
                ["try spending again"],
              ),
          },
          h,
        ),
      ]),
  });

export const spendView = (model: Model, h: HtmlBuilder<Message>): Html => {
  const filter = model.spendFilter;
  const presented = presentSpend(model.spend, filter, model.spendChart);
  const chart = chartBody(model.spendChart, presented, model.replay, h);

  return h.section([...styleAttributes(h, stylex.props(styles.shell))], [
    h.h2([...styleAttributes(h, stylex.props(styles.heading))], ["Spending"]),
    h.p(
      [...styleAttributes(h, stylex.props(styles.lede))],
      [
        "Pie, bar, and line share one filter across the feed period. Search, person, bucket, and dates narrow it. Positive amounts are money in. Charts add up money out.",
      ],
    ),
    spendNotice(model.spendRefresh, h),
    h.div(
      [
        h.Role("group"),
        h.AriaLabel("Chart mode"),
        ...styleAttributes(h, stylex.props(styles.nav)),
      ],
      [
        modeButton("pie", "Pie", model.spendChart, h),
        modeButton("bar", "Bar", model.spendChart, h),
        modeButton("line", "Line", model.spendChart, h),
      ],
    ),
    h.div([...styleAttributes(h, stylex.props(styles.filters))], [
      labeledInput(
        "spend-search",
        "Search",
        filter.search,
        "search",
        (search) => Message.ChangedSpendFilter({ filter: withFilter(filter, { search }) }),
        h,
      ),
      labeledSelect(
        "spend-person",
        "Person",
        filter.person,
        "",
        "Any",
        presented.people,
        (person) => Message.ChangedSpendFilter({ filter: withFilter(filter, { person }) }),
        h,
      ),
      labeledSelect(
        "spend-account",
        "Account",
        filter.account,
        "",
        "Any",
        presented.accounts,
        (account) => Message.ChangedSpendFilter({ filter: withFilter(filter, { account }) }),
        h,
      ),
      labeledSelect(
        "spend-bucket",
        "Budget bucket",
        filter.budgetBucket,
        "",
        "Any",
        presented.buckets,
        (budgetBucket) =>
          Message.ChangedSpendFilter({ filter: withFilter(filter, { budgetBucket }) }),
        h,
      ),
      labeledSelect(
        "spend-category",
        "Category",
        filter.categoryPrimary,
        "",
        "Any",
        presented.categories,
        (categoryPrimary) =>
          Message.ChangedSpendFilter({ filter: withFilter(filter, { categoryPrimary }) }),
        h,
      ),
      labeledSelect(
        "spend-detailed",
        "Detailed category",
        filter.categoryDetailed,
        "",
        "Any",
        presented.detailed,
        (categoryDetailed) =>
          Message.ChangedSpendFilter({ filter: withFilter(filter, { categoryDetailed }) }),
        h,
      ),
      labeledSelect(
        "spend-confidence",
        "Category confidence",
        filter.categoryConfidence,
        "",
        "Any",
        presented.confidence,
        (categoryConfidence) =>
          Message.ChangedSpendFilter({
            filter: withFilter(filter, { categoryConfidence }),
          }),
        h,
      ),
      labeledSelect(
        "spend-pending",
        "Pending",
        filter.pending,
        "any",
        "Any",
        [
          { value: "true", label: "Pending" },
          { value: "false", label: "Posted" },
          { value: "unknown", label: "Unknown" },
        ],
        (value) =>
          Message.ChangedSpendFilter({
            filter: withFilter(filter, { pending: pendingChoice(value) }),
          }),
        h,
      ),
      labeledSelect(
        "spend-counts",
        "Budget",
        filter.countsTowardBudget,
        "any",
        "All activity",
        [
          { value: "yes", label: "In the budget" },
          { value: "no", label: "Outside the budget" },
        ],
        (value) =>
          Message.ChangedSpendFilter({
            filter: withFilter(filter, { countsTowardBudget: countsChoice(value) }),
          }),
        h,
      ),
      labeledInput(
        "spend-from",
        "From",
        filter.dateFrom,
        "date",
        (dateFrom) => Message.ChangedSpendFilter({ filter: withFilter(filter, { dateFrom }) }),
        h,
      ),
      labeledInput(
        "spend-to",
        "To",
        filter.dateTo,
        "date",
        (dateTo) => Message.ChangedSpendFilter({ filter: withFilter(filter, { dateTo }) }),
        h,
      ),
      labeledInput(
        "spend-min",
        "Amount min",
        filter.amountMin,
        "text",
        (amountMin) => Message.ChangedSpendFilter({ filter: withFilter(filter, { amountMin }) }),
        h,
      ),
      labeledInput(
        "spend-max",
        "Amount max",
        filter.amountMax,
        "text",
        (amountMax) => Message.ChangedSpendFilter({ filter: withFilter(filter, { amountMax }) }),
        h,
      ),
    ]),
    h.div([...styleAttributes(h, stylex.props(styles.nav))], [
      Checkbox.view(
        {
          id: "spend-exclude",
          isChecked: filter.excludeNonSpend,
          onToggle: (excludeNonSpend) =>
            Message.ChangedSpendFilter({
              filter: withFilter(filter, { excludeNonSpend }),
            }),
          toView: (attributes) =>
            h.div([...styleAttributes(h, stylex.props(styles.checkRow))], [
              h.button(
                [...attributes.checkbox, ...styleAttributes(h, stylex.props(styles.check))],
                [filter.excludeNonSpend ? "✓" : ""],
              ),
              h.label(
                [...attributes.label, ...styleAttributes(h, stylex.props(styles.fieldLabel))],
                ["Hide rent, transfers, and income"],
              ),
            ]),
        },
        h,
      ),
      Button.view(
        {
          type: "button",
          onClick: Message.ClickedResetSpend(),
          toView: (attributes) =>
            h.button(
              [...attributes.button, ...styleAttributes(h, stylex.props(styles.button))],
              ["Reset filters"],
            ),
        },
        h,
      ),
    ]),
    h.p([...styleAttributes(h, stylex.props(styles.detail))], [presented.chartTitle]),
    h.p([...styleAttributes(h, stylex.props(styles.lede))], [presented.countLabel]),
    h.div(
      [
        h.Key(`chart-${model.spendChart}-${model.replay}`),
        ...styleAttributes(h, stylex.props(styles.rise(60))),
      ],
      [chart],
    ),
    h.h3([...styleAttributes(h, stylex.props(styles.heading))], ["Transactions"]),
    presented.rows.length === 0
      ? h.p(
          [...styleAttributes(h, stylex.props(styles.lede))],
          ["Nothing in this filter."],
        )
      : transactionList(presented.rows, model.replay, h),
  ]);
};
