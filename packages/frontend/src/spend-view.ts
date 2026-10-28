import {
  type ChartMode,
  type SpendFilter,
  SpendFilter as SpendFilterSchema,
  formatCad,
} from "@expendiru/domain";
import { Button, Select } from "@foldkit/ui";
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

const personSelect = (
  filter: SpendFilter,
  people: ReturnType<typeof presentSpend>["people"],
  h: HtmlBuilder<Message>,
): Html =>
  Select.view(
    {
      id: "spend-person",
      value: filter.person,
      onChange: (person) =>
        Message.ChangedSpendFilter({ filter: withFilter(filter, { person }) }),
      toView: (attributes) =>
        h.div([...styleAttributes(h, stylex.props(styles.personField))], [
          h.label(
            [...attributes.label, ...styleAttributes(h, stylex.props(styles.fieldLabel))],
            ["Person"],
          ),
          h.select(
            [
              ...attributes.select,
              ...styleAttributes(h, stylex.props(styles.control, styles.personControl)),
            ],
            optionNodes(filter.person, "", "Any", people, h),
          ),
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
  h.div([...styleAttributes(h, stylex.props(styles.chartStage))], [
    h.div([...styleAttributes(h, stylex.props(styles.chartPlot))], [
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
    ]),
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
  h.div([...styleAttributes(h, stylex.props(styles.chartStage))], [
    h.div(
      [
        h.Role("group"),
        h.AriaLabel("Spending by merchant"),
        ...styleAttributes(h, stylex.props(styles.chartBars)),
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
      ],
    ),
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
  ]);

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

  return h.div(
    [...styleAttributes(h, stylex.props(styles.chartStage, styles.chartStageSolo))],
    [
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
        ...line.points.flatMap((point) => {
          if (point.cents <= 0) {
            return [];
          }

          const mark = SpendMark.Day({ key: point.date });
          const message = Message.ClickedSpendMark({ mark });
          const hot = sameSpendMark(focus, mark) || sameSpendMark(hover, mark);

          return [
            h.keyed("circle")(
            point.date,
            [
              h.Cx(String(point.x)),
              h.Cy(String(point.y)),
              h.R(hot ? "7" : "5"),
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
            ),
          ];
        }),
      ],
    ),
    h.p(
      [...styleAttributes(h, stylex.props(styles.caption))],
      [`${line.firstDate} → ${line.lastDate} · peak ${line.maxLabel}`],
    ),
  ]);
};

const rowStyle = (hover: SpendMark, focus: SpendMark, mark: SpendMark) => {
  if (dimmed(hover, focus, mark)) {
    return stylex.props(styles.txRow, styles.markDim);
  }

  if (sameSpendMark(focus, mark)) {
    return stylex.props(styles.txRow, styles.txRowOn);
  }

  return stylex.props(styles.txRow);
};

const transactionTable = (
  chart: ChartMode,
  rows: ReadonlyArray<SpendRow>,
  hover: SpendMark,
  focus: SpendMark,
  h: HtmlBuilder<Message>,
): Html =>
  h.table(
    [
      h.AriaLabel("Transactions"),
      ...styleAttributes(h, stylex.props(styles.txTable)),
    ],
    [
      h.thead([], [
        h.tr([], [
          h.th(
            [h.Scope("col"), ...styleAttributes(h, stylex.props(styles.txHead, styles.txDate))],
            ["Date"],
          ),
          h.th(
            [h.Scope("col"), ...styleAttributes(h, stylex.props(styles.txHead))],
            ["Merchant"],
          ),
          h.th(
            [h.Scope("col"), ...styleAttributes(h, stylex.props(styles.txHead))],
            ["Category"],
          ),
          h.th(
            [
              h.Scope("col"),
              ...styleAttributes(h, stylex.props(styles.txHead, styles.txNumeric)),
            ],
            ["Amount"],
          ),
        ]),
      ]),
      h.tbody(
        [],
        rows.map((row) => {
          const mark = rowMark(chart, row);
          const message = Message.ClickedSpendMark({ mark });

          return h.keyed("tr")(
            row.id,
            [
              h.Tabindex(0),
              h.AriaPressed(sameSpendMark(focus, mark) ? "true" : "false"),
              h.OnClick(message),
              h.OnMouseEnter(Message.HoveredSpendMark({ mark })),
              h.OnMouseLeave(Message.ClearedSpendHover()),
              activate(message, h),
              ...styleAttributes(h, rowStyle(hover, focus, mark)),
            ],
            [
              h.td(
                [...styleAttributes(h, stylex.props(styles.txCell, styles.txDate))],
                [
                  h.time([h.Datetime(row.date)], [row.date]),
                  row.pending
                    ? h.span(
                        [...styleAttributes(h, stylex.props(styles.txMeta))],
                        ["Pending"],
                      )
                    : h.empty,
                ],
              ),
              h.td([...styleAttributes(h, stylex.props(styles.txCell))], [
                h.span([...styleAttributes(h, stylex.props(styles.txMerchant))], [row.title]),
                h.span([...styleAttributes(h, stylex.props(styles.txMeta))], [row.detail]),
              ]),
              h.td([...styleAttributes(h, stylex.props(styles.txCell))], [
                h.span([...styleAttributes(h, stylex.props(styles.txMerchant))], [row.bucket]),
                h.span([...styleAttributes(h, stylex.props(styles.txMeta))], [row.category]),
              ]),
              h.td(
                [
                  ...styleAttributes(
                    h,
                    stylex.props(
                      styles.txCell,
                      styles.txNumeric,
                      row.incoming ? styles.amountIn : styles.amountOut,
                    ),
                  ),
                ],
                [row.amountLabel],
              ),
            ],
          );
        }),
      ),
    ],
  );

const chartBody = (
  mode: ChartMode,
  presented: PresentedSpend,
  hover: SpendMark,
  focus: SpendMark,
  hidden: ReadonlyArray<string>,
  h: HtmlBuilder<Message>,
): Html => {
  if (presented.chartEmpty) {
    return h.div(
      [...styleAttributes(h, stylex.props(styles.chartStage, styles.chartStageSolo))],
      [
        h.p(
          [...styleAttributes(h, stylex.props(styles.chartEmpty))],
          [
            presented.amountError
              ? "Amount filters need a number, like -42.10 or 100."
              : "No money out in this filter.",
          ],
        ),
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
    h.div([...styleAttributes(h, stylex.props(styles.spendHead))], [
      h.h2([...styleAttributes(h, stylex.props(styles.heading))], ["Spending"]),
      h.div([...styleAttributes(h, stylex.props(styles.spendMeta))], [
        h.p([...styleAttributes(h, stylex.props(styles.spendStat))], [presented.chartTitle]),
        h.p(
          [...styleAttributes(h, stylex.props(styles.spendStatMuted))],
          [presented.countLabel],
        ),
      ]),
    ]),
    spendNotice(model.spendRefresh, h),
    h.div([...styleAttributes(h, stylex.props(styles.toolbar))], [
      chartSwitch(model.spendChart, h),
      personSelect(filter, presented.people, h),
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
    chart,
    h.p(
      [...styleAttributes(h, stylex.props(styles.tooltip))],
      [tooltipText(presented, model.spendHover)],
    ),
    h.h3(
      [...styleAttributes(h, stylex.props(styles.heading, styles.txHeading))],
      ["Transactions"],
    ),
    presented.rows.length === 0
      ? h.p([...styleAttributes(h, stylex.props(styles.lede))], ["Nothing in this filter."])
      : transactionTable(
          model.spendChart,
          presented.rows,
          model.spendHover,
          model.spendFocus,
          h,
        ),
  ]);
};
