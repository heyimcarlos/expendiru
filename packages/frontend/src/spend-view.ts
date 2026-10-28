import {
  type ChartMode,
  type SpendFilter,
  SpendFilter as SpendFilterSchema,
  formatCad,
} from "@expendiru/domain";
import { Button, Checkbox, Input, Select } from "@foldkit/ui";
import { Option } from "effect";
import type { Html, HtmlBuilder } from "foldkit/html";
import * as stylex from "@stylexjs/stylex";
import { chartClipInset } from "./chart-clip.ts";
import { Message } from "./message.ts";
import { type Model, Refresh, SpendMark, sameSpendMark } from "./model.ts";
import {
  type PresentedSpend,
  type SpendRow,
  lineChartHeight,
  lineChartWidth,
  pieRadius,
  presentSpend,
} from "./spend-present.ts";
import { palette, styleAttributes, styles } from "./theme.stylex.ts";

const chartModes: ReadonlyArray<{ readonly mode: ChartMode; readonly label: string }> = [
  { mode: "pie", label: "Pie" },
  { mode: "bar", label: "Bar" },
  { mode: "line", label: "Line" },
];

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
  choices: ReturnType<typeof presentSpend>["people"],
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
  choices: ReturnType<typeof presentSpend>["people"],
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

const isHidden = (hidden: ReadonlyArray<string>, key: string): boolean => {
  for (const item of hidden) {
    if (item === key) {
      return true;
    }
  }

  return false;
};

const engaged = (hover: SpendMark, focus: SpendMark): boolean =>
  !sameSpendMark(hover, SpendMark.Idle()) || !sameSpendMark(focus, SpendMark.Idle());

const dimmed = (hover: SpendMark, focus: SpendMark, mark: SpendMark): boolean =>
  engaged(hover, focus) &&
  !sameSpendMark(hover, mark) &&
  !sameSpendMark(focus, mark);

const rowMark = (chart: ChartMode, row: SpendRow): SpendMark => {
  if (chart === "bar") {
    return SpendMark.Merchant({ key: row.merchantKey });
  }

  if (chart === "line") {
    return SpendMark.Day({ key: row.date });
  }

  return SpendMark.Bucket({ key: row.bucketKey });
};

const tooltipText = (presented: PresentedSpend, hover: SpendMark): string =>
  SpendMark.match(hover, {
    Idle: () => "",
    Bucket: ({ key }) => {
      for (const ring of presented.rings) {
        if (ring.key === key) {
          return `${ring.label} · ${ring.amountLabel} · ${ring.percentLabel}`;
        }
      }

      return "";
    },
    Merchant: ({ key }) => {
      for (const bar of presented.bars) {
        if (bar.key === key) {
          return `${bar.label} · ${bar.amountLabel}`;
        }
      }

      return "";
    },
    Day: ({ key }) => {
      for (const point of presented.line.points) {
        if (point.date === key) {
          return `${point.date} · ${formatCad(point.cents)}`;
        }
      }

      return "";
    },
  });

const chartSwitch = (active: ChartMode, h: HtmlBuilder<Message>): Html =>
  h.div([...styleAttributes(h, stylex.props(styles.switchTrack))], [
    h.div([...styleAttributes(h, stylex.props(styles.switchStack))], [
      h.div(
        [
          h.Role("group"),
          h.AriaLabel("Chart mode"),
          ...styleAttributes(h, stylex.props(styles.switchGrid)),
        ],
        chartModes.map((item) =>
          h.button(
            [
              h.Type("button"),
              h.AriaPressed(active === item.mode ? "true" : "false"),
              h.OnClick(Message.ClickedChart({ mode: item.mode })),
              ...styleAttributes(h, stylex.props(styles.switchButton)),
            ],
            [item.label],
          ),
        ),
      ),
      h.div(
        [
          h.AriaHidden(true),
          h.DataAttribute("clip", active),
          ...styleAttributes(
            h,
            stylex.props(styles.switchActive, styles.switchClip(chartClipInset(active))),
          ),
        ],
        chartModes.map((item) =>
          h.span([...styleAttributes(h, stylex.props(styles.switchLabel))], [item.label]),
        ),
      ),
    ]),
  ]);

const legend = (
  items: ReadonlyArray<{
    readonly key: string;
    readonly label: string;
    readonly detail: string;
    readonly color: string;
    readonly mark: SpendMark;
  }>,
  hidden: ReadonlyArray<string>,
  hover: SpendMark,
  focus: SpendMark,
  h: HtmlBuilder<Message>,
): Html =>
  h.ul([...styleAttributes(h, stylex.props(styles.legend))], [
    ...items.map((item) => {
      const off = isHidden(hidden, item.key);

      return h.keyed("li")(item.key, [], [
        h.button(
          [
            h.Type("button"),
            h.AriaPressed(off ? "false" : "true"),
            h.AriaLabel(`Toggle ${item.label}`),
            h.OnClick(Message.ToggledSpendSeries({ key: item.key })),
            h.OnMouseEnter(Message.HoveredSpendMark({ mark: item.mark })),
            h.OnMouseLeave(Message.ClearedSpendHover()),
            ...styleAttributes(
              h,
              off || dimmed(hover, focus, item.mark)
                ? stylex.props(styles.legendButton, styles.markDim)
                : stylex.props(styles.legendButton),
            ),
          ],
          [
            h.span([...styleAttributes(h, stylex.props(styles.swatch(item.color)))]),
            h.span([], [`${item.label} · ${item.detail}`]),
          ],
        ),
      ]);
    }),
  ]);

const activate = (message: Message, h: HtmlBuilder<Message>) =>
  h.OnKeyDownPreventDefault((key) =>
    key === "Enter" || key === " " ? Option.some(message) : Option.none(),
  );

const pieChart = (
  presented: PresentedSpend,
  hover: SpendMark,
  focus: SpendMark,
  hidden: ReadonlyArray<string>,
  h: HtmlBuilder<Message>,
): Html =>
  h.div([...styleAttributes(h, stylex.props(styles.chartRow))], [
    h.svg(
      [
        h.ViewBox("0 0 240 240"),
        h.Role("group"),
        h.AriaLabel("Spending by bucket"),
        ...styleAttributes(h, stylex.props(styles.chartPie)),
      ],
      [
        h.circle([
          h.Cx("120"),
          h.Cy("120"),
          h.R(String(pieRadius)),
          h.Fill("none"),
          h.Stroke(palette.track),
          h.StrokeWidth("22"),
          h.Attribute("pointer-events", "none"),
        ]),
        ...presented.rings.map((ring) => {
          const mark = SpendMark.Bucket({ key: ring.key });
          const message = Message.ClickedSpendMark({ mark });

          return h.keyed("circle")(
            ring.key,
            [
              h.Cx("120"),
              h.Cy("120"),
              h.R(String(pieRadius)),
              h.Fill("none"),
              h.Stroke(ring.color),
              h.StrokeWidth("22"),
              h.StrokeLinecap("butt"),
              h.StrokeDasharray(
                `${ring.length.toFixed(2)} ${(ring.circumference - ring.length).toFixed(2)}`,
              ),
              h.StrokeDashoffset(ring.offset.toFixed(2)),
              h.Role("button"),
              h.Tabindex(0),
              h.AriaLabel(`Show ${ring.label}`),
              h.AriaPressed(sameSpendMark(focus, mark) ? "true" : "false"),
              h.OnClick(message),
              h.OnMouseEnter(Message.HoveredSpendMark({ mark })),
              h.OnMouseLeave(Message.ClearedSpendHover()),
              activate(message, h),
              ...styleAttributes(
                h,
                dimmed(hover, focus, mark)
                  ? stylex.props(styles.mark, styles.markDim)
                  : stylex.props(styles.mark),
              ),
            ],
            [h.title([], [`${ring.label} · ${ring.amountLabel}`])],
          );
        }),
      ],
    ),
    legend(
      presented.rings.map((ring) => ({
        key: ring.key,
        label: ring.label,
        detail: `${ring.amountLabel} · ${ring.percentLabel}`,
        color: ring.color,
        mark: SpendMark.Bucket({ key: ring.key }),
      })),
      hidden,
      hover,
      focus,
      h,
    ),
  ]);

const barChart = (
  presented: PresentedSpend,
  hover: SpendMark,
  focus: SpendMark,
  hidden: ReadonlyArray<string>,
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [
      h.Role("group"),
      h.AriaLabel("Spending by merchant"),
      ...styleAttributes(h, stylex.props(styles.chartFrame)),
    ],
    [
      ...presented.bars.map((bar) => {
        const mark = SpendMark.Merchant({ key: bar.key });
        const message = Message.ClickedSpendMark({ mark });

        return h.button(
          [
            h.Key(bar.key),
            h.Type("button"),
            h.AriaLabel(`Show ${bar.label}`),
            h.AriaPressed(sameSpendMark(focus, mark) ? "true" : "false"),
            h.OnClick(message),
            h.OnMouseEnter(Message.HoveredSpendMark({ mark })),
            h.OnMouseLeave(Message.ClearedSpendHover()),
            ...styleAttributes(
              h,
              dimmed(hover, focus, mark)
                ? stylex.props(styles.barButton, styles.markDim)
                : stylex.props(styles.barButton),
            ),
          ],
          [
            h.span([...styleAttributes(h, stylex.props(styles.barLabel))], [bar.label]),
            h.span([...styleAttributes(h, stylex.props(styles.chartTrack))], [
              h.span([
                ...styleAttributes(h, stylex.props(styles.barFill(bar.widthPercent, bar.color))),
              ]),
            ]),
            h.span([...styleAttributes(h, stylex.props(styles.barAmount))], [bar.amountLabel]),
          ],
        );
      }),
      legend(
        presented.bars.map((bar) => ({
          key: bar.key,
          label: bar.label,
          detail: bar.amountLabel,
          color: bar.color,
          mark: SpendMark.Merchant({ key: bar.key }),
        })),
        hidden,
        hover,
        focus,
        h,
      ),
    ],
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
    h.Stroke(ink ? palette.ink : palette.line),
    h.StrokeWidth("1"),
    h.ShapeRendering("crispEdges"),
    h.VectorEffect("non-scaling-stroke"),
  ]);

const lineChart = (
  presented: PresentedSpend,
  hover: SpendMark,
  focus: SpendMark,
  h: HtmlBuilder<Message>,
): Html => {
  const line = presented.line;

  return h.div([...styleAttributes(h, stylex.props(styles.chartFrame))], [
    h.svg(
      [
        h.ViewBox(`0 0 ${lineChartWidth} ${lineChartHeight}`),
        h.Role("group"),
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
          h.Stroke(palette.accent),
          h.StrokeWidth("1.5"),
          h.StrokeLinejoin("round"),
          h.StrokeLinecap("round"),
          h.VectorEffect("non-scaling-stroke"),
          h.Attribute("pointer-events", "none"),
        ]),
        ...line.points.map((point) => {
          const mark = SpendMark.Day({ key: point.date });
          const message = Message.ClickedSpendMark({ mark });
          const hot = sameSpendMark(focus, mark) || sameSpendMark(hover, mark);

          return h.keyed("circle")(
            point.date,
            [
              h.Cx(String(point.x)),
              h.Cy(String(point.y)),
              h.R(hot ? "5" : "3.5"),
              h.Fill(hot ? palette.accent : palette.ink),
              h.Role("button"),
              h.Tabindex(0),
              h.AriaLabel(`Show ${point.date}`),
              h.AriaPressed(sameSpendMark(focus, mark) ? "true" : "false"),
              h.OnClick(message),
              h.OnMouseEnter(Message.HoveredSpendMark({ mark })),
              h.OnMouseLeave(Message.ClearedSpendHover()),
              activate(message, h),
              ...styleAttributes(
                h,
                dimmed(hover, focus, mark)
                  ? stylex.props(styles.mark, styles.markDim)
                  : stylex.props(styles.mark),
              ),
            ],
            [h.title([], [`${point.date} · ${formatCad(point.cents)}`])],
          );
        }),
      ],
    ),
    h.p(
      [...styleAttributes(h, stylex.props(styles.caption))],
      [`${line.firstDate} → ${line.lastDate} · peak ${line.maxLabel}`],
    ),
  ]);
};

const transactionList = (
  chart: ChartMode,
  rows: ReadonlyArray<SpendRow>,
  hover: SpendMark,
  focus: SpendMark,
  h: HtmlBuilder<Message>,
): Html =>
  h.ul([...styleAttributes(h, stylex.props(styles.txList))], [
    ...rows.map((row) => {
      const mark = rowMark(chart, row);
      const message = Message.ClickedSpendMark({ mark });

      return h.keyed("li")(row.id, [], [
        h.button(
          [
            h.Type("button"),
            h.AriaPressed(sameSpendMark(focus, mark) ? "true" : "false"),
            h.OnClick(message),
            h.OnMouseEnter(Message.HoveredSpendMark({ mark })),
            h.OnMouseLeave(Message.ClearedSpendHover()),
            ...styleAttributes(
              h,
              dimmed(hover, focus, mark)
                ? stylex.props(styles.txRow, styles.markDim)
                : stylex.props(styles.txRow),
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
      ]);
    }),
  ]);

const chartBody = (
  mode: ChartMode,
  presented: PresentedSpend,
  hover: SpendMark,
  focus: SpendMark,
  hidden: ReadonlyArray<string>,
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
    return barChart(presented, hover, focus, hidden, h);
  }

  if (mode === "line") {
    return lineChart(presented, hover, focus, h);
  }

  return pieChart(presented, hover, focus, hidden, h);
};

const spendNotice = (refresh: Refresh, h: HtmlBuilder<Message>): Html =>
  Refresh.match(refresh, {
    Idle: () => h.empty,
    Failed: ({ error }) =>
      h.div([...styleAttributes(h, stylex.props(styles.notice))], [
        h.p(
          [...styleAttributes(h, stylex.props(styles.noticeText))],
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

  const presented = presentSpend(
    model.spend,
    filter,
    model.spendChart,
    model.spendFocus,
    model.spendHidden,
  );

  const chart = chartBody(
    model.spendChart,
    presented,
    model.spendHover,
    model.spendFocus,
    model.spendHidden,
    h,
  );

  const focused = !sameSpendMark(model.spendFocus, SpendMark.Idle());

  return h.section([...styleAttributes(h, stylex.props(styles.shell))], [
    h.h2([...styleAttributes(h, stylex.props(styles.heading))], ["Spending"]),
    h.p(
      [...styleAttributes(h, stylex.props(styles.lede))],
      ["Pie, bar, and line share one filter. Choose a mark to narrow the list."],
    ),
    spendNotice(model.spendRefresh, h),
    h.div([...styleAttributes(h, stylex.props(styles.nav))], [
      chartSwitch(model.spendChart, h),
    ]),
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
      focused
        ? Button.view(
            {
              type: "button",
              onClick: Message.ClickedSpendMark({ mark: SpendMark.Idle() }),
              toView: (attributes) =>
                h.button(
                  [...attributes.button, ...styleAttributes(h, stylex.props(styles.button))],
                  ["Clear selection"],
                ),
            },
            h,
          )
        : h.empty,
    ]),
    h.p([...styleAttributes(h, stylex.props(styles.detail))], [presented.chartTitle]),
    h.p([...styleAttributes(h, stylex.props(styles.lede))], [presented.countLabel]),
    chart,
    h.p(
      [...styleAttributes(h, stylex.props(styles.tooltip))],
      [tooltipText(presented, model.spendHover)],
    ),
    h.h3([...styleAttributes(h, stylex.props(styles.heading))], ["Transactions"]),
    presented.rows.length === 0
      ? h.p([...styleAttributes(h, stylex.props(styles.lede))], ["Nothing in this filter."])
      : transactionList(model.spendChart, presented.rows, model.spendHover, model.spendFocus, h),
  ]);
};
