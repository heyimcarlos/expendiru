import type { PaceStanding } from "@expendiru/domain";
import { Button } from "@foldkit/ui";
import type { Document, Html, HtmlBuilder } from "foldkit/html";
import { Message } from "./message.ts";
import { Model, Refresh } from "./model.ts";
import {
  type PaperTone,
  type PresentedBucket,
  type PresentedCard,
  type PresentedHousehold,
  presentHousehold,
} from "./present.ts";
import { sketchRectPath } from "./sketch.ts";
import * as stylex from "@stylexjs/stylex";
import { palette, styleAttributes, styles } from "./theme.stylex.ts";

const toneColor = (tone: PaperTone): string => {
  if (tone === "blue") {
    return palette.blue;
  }
  if (tone === "green") {
    return palette.green;
  }
  if (tone === "yellow") {
    return palette.yellow;
  }
  return palette.orange;
};

const toneFill = (tone: PaperTone) => {
  if (tone === "blue") {
    return styles.fillBlue;
  }
  if (tone === "green") {
    return styles.fillGreen;
  }
  if (tone === "yellow") {
    return styles.fillYellow;
  }
  return styles.fillOrange;
};

const standingFill = (standing: PaceStanding) => {
  if (standing === "under") {
    return styles.fillGreen;
  }
  if (standing === "on") {
    return styles.fillBlue;
  }
  return styles.fillRed;
};

const standingStyle = (standing: PaceStanding) => {
  if (standing === "under") {
    return styles.standingUnder;
  }
  if (standing === "on") {
    return styles.standingOn;
  }
  return styles.standingOver;
};

const sketchCard = (
  seed: number,
  tone: PaperTone,
  h: HtmlBuilder<Message>,
  body: ReadonlyArray<Html>,
): Html =>
  h.div(
    [...styleAttributes(h, stylex.props(styles.card))],
    [
      h.svg(
        [
          ...styleAttributes(h, stylex.props(styles.sketch)),
          h.ViewBox("0 0 300 180"),
          h.PreserveAspectRatio("none"),
          h.AriaHidden(true),
        ],
        [
          h.path([
            h.D(sketchRectPath(seed)),
            h.Fill(toneColor(tone)),
            h.Stroke(palette.ink),
            h.StrokeWidth("1.8"),
            h.StrokeLinejoin("round"),
            h.VectorEffect("non-scaling-stroke"),
          ]),
        ],
      ),
      ...body,
    ],
  );

const meter = (
  label: string,
  now: number,
  max: number,
  widthPercent: number,
  fill: (typeof styles)["fillGreen"],
  replayKey: string,
  delayMs: number,
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [
      h.Role("meter"),
      h.AriaLabel(label),
      h.AriaValuemin(0),
      h.AriaValuemax(max),
      h.AriaValuenow(Math.max(0, now)),
      ...styleAttributes(h, stylex.props(styles.track)),
    ],
    [
      h.div([
        h.Key(replayKey),
        ...styleAttributes(h, stylex.props(styles.fill(widthPercent, delayMs), fill)),
      ]),
    ],
  );

const emergencyView = (
  presented: PresentedHousehold,
  savedCents: number,
  targetCents: number,
  replay: number,
  h: HtmlBuilder<Message>,
): Html =>
  sketchCard(11, "green", h, [
    h.p([...styleAttributes(h, stylex.props(styles.label))], [presented.emergencyName]),
    h.p([...styleAttributes(h, stylex.props(styles.bigNumber))], [presented.savedLabel]),
    h.p(
      [...styleAttributes(h, stylex.props(styles.detail))],
      [`of ${presented.targetLabel}`],
    ),
    meter(
      "Emergency fund saved",
      savedCents,
      targetCents,
      Math.min(100, Math.max(0, presented.savedPercent)),
      styles.fillGreen,
      `emergency-${replay}`,
      0,
      h,
    ),
    h.p([...styleAttributes(h, stylex.props(styles.caption))], [presented.savedCaption]),
  ]);

const cardView = (
  card: PresentedCard,
  index: number,
  replay: number,
  h: HtmlBuilder<Message>,
): Html =>
  h.keyed("article")(
    card.id,
    [],
    [
      sketchCard(21 + index, card.tone, h, [
        h.p([...styleAttributes(h, stylex.props(styles.label))], ["room left"]),
        h.p([...styleAttributes(h, stylex.props(styles.bigNumber))], [card.roomLabel]),
        h.p([...styleAttributes(h, stylex.props(styles.detail))], [card.label]),
        meter(
          `Room left on ${card.label}`,
          card.roomPercent,
          100,
          card.roomPercent,
          toneFill(card.tone),
          `card-${card.id}-${replay}`,
          80 + index * 70,
          h,
        ),
        h.p([...styleAttributes(h, stylex.props(styles.caption))], [card.detail]),
      ]),
    ],
  );

const bucketView = (
  bucket: PresentedBucket,
  index: number,
  replay: number,
  h: HtmlBuilder<Message>,
): Html =>
  h.keyed("article")(
    bucket.id,
    [],
    [
      sketchCard(31 + index, bucket.tone, h, [
        h.h3([...styleAttributes(h, stylex.props(styles.heading))], [bucket.name]),
        h.p(
          [...styleAttributes(h, stylex.props(styles.bigNumber))],
          [bucket.spentLabel],
        ),
        h.p(
          [...styleAttributes(h, stylex.props(styles.detail))],
          [`of ${bucket.budgetLabel}`],
        ),
        h.div(
          [
            h.Role("meter"),
            h.AriaLabel(`${bucket.name} spent versus budget`),
            h.AriaValuemin(0),
            h.AriaValuemax(100),
            h.AriaValuenow(Math.min(100, Math.max(0, bucket.spentPercent))),
            ...styleAttributes(h, stylex.props(styles.track)),
          ],
          [
            h.div([
              h.Key(`bucket-${bucket.id}-${replay}`),
              ...styleAttributes(
                h,
                stylex.props(
                  styles.fill(
                    Math.min(100, Math.max(0, bucket.spentPercent)),
                    160 + index * 70,
                  ),
                  standingFill(bucket.standing),
                ),
              ),
            ]),
            h.div([
              ...styleAttributes(
                h,
                stylex.props(
                  styles.paceMarkBase,
                  styles.paceMark(bucket.pacePercent),
                ),
              ),
            ]),
          ],
        ),
        h.p(
          [...styleAttributes(h, stylex.props(standingStyle(bucket.standing)))],
          [bucket.standingLabel],
        ),
        h.p(
          [...styleAttributes(h, stylex.props(styles.caption))],
          [`pace ${bucket.paceLabel}`],
        ),
      ]),
    ],
  );

const replayButton = (h: HtmlBuilder<Message>): Html =>
  Button.view(
    {
      onClick: Message.ClickedReplay(),
      toView: (attributes) =>
        h.button(
          [...attributes.button, ...styleAttributes(h, stylex.props(styles.button))],
          ["replay the month"],
        ),
    },
    h,
  );

const retryButton = (h: HtmlBuilder<Message>): Html =>
  Button.view(
    {
      onClick: Message.ClickedRetry(),
      toView: (attributes) =>
        h.button(
          [...attributes.button, ...styleAttributes(h, stylex.props(styles.button))],
          ["try the api again"],
        ),
    },
    h,
  );

const noticeView = (refresh: Refresh, h: HtmlBuilder<Message>): Html =>
  Refresh.match(refresh, {
    Idle: () => h.empty,
    Failed: ({ error }) =>
      h.div([...styleAttributes(h, stylex.props(styles.notice))], [
        h.p(
          [...styleAttributes(h, stylex.props(styles.detail))],
          [
            `Couldn't refresh from the household API. Showing the fixture. ${error}`,
          ],
        ),
        retryButton(h),
      ]),
  });

export const view = (model: Model, h: HtmlBuilder<Message>): Document => {
  const presented = presentHousehold(model.snapshot);
  const fund = model.snapshot.emergencyFund;

  return {
    title: "Expendiru",
    body: h.main([...styleAttributes(h, stylex.props(styles.page))], [
      h.section([...styleAttributes(h, stylex.props(styles.shell))], [
        h.p([...styleAttributes(h, stylex.props(styles.eyebrow))], ["Toronto household"]),
        h.h1([...styleAttributes(h, stylex.props(styles.title))], ["Expendiru"]),
        h.p([...styleAttributes(h, stylex.props(styles.lede))], [presented.lede]),
        h.div([...styleAttributes(h, stylex.props(styles.nav))], [replayButton(h)]),
        noticeView(model.refresh, h),
      ]),
      h.section([...styleAttributes(h, stylex.props(styles.shell))], [
        h.h2([...styleAttributes(h, stylex.props(styles.heading))], ["Emergency fund"]),
        h.p(
          [...styleAttributes(h, stylex.props(styles.lede))],
          ["Cash set aside before anything else gets spent."],
        ),
        emergencyView(
          presented,
          fund.saved.cents,
          fund.target.cents,
          model.replay,
          h,
        ),
      ]),
      h.section([...styleAttributes(h, stylex.props(styles.shell))], [
        h.h2(
          [...styleAttributes(h, stylex.props(styles.heading))],
          ["Room left on the Visas"],
        ),
        h.p(
          [...styleAttributes(h, stylex.props(styles.lede))],
          ["Placeholder names only. No card numbers."],
        ),
        h.div(
          [...styleAttributes(h, stylex.props(styles.gridTwo))],
          presented.cards.map((card, index) =>
            cardView(card, index, model.replay, h),
          ),
        ),
      ]),
      h.section([...styleAttributes(h, stylex.props(styles.shell))], [
        h.h2([...styleAttributes(h, stylex.props(styles.heading))], ["Buckets vs pace"]),
        h.p([...styleAttributes(h, stylex.props(styles.lede))], [presented.paceCaption]),
        h.div(
          [...styleAttributes(h, stylex.props(styles.gridBuckets))],
          presented.buckets.map((bucket, index) =>
            bucketView(bucket, index, model.replay, h),
          ),
        ),
      ]),
      h.p(
        [...styleAttributes(h, stylex.props(styles.footer))],
        [
          "Fixture for Carlos and Maria. Scotia and Wealthsimple are not connected yet.",
        ],
      ),
    ]),
  };
};
