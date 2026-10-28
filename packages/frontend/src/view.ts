import type { PaceStanding } from "@expendiru/domain";
import { Button } from "@foldkit/ui";
import type { Document, Html, HtmlBuilder } from "foldkit/html";
import { Message } from "./message.ts";
import { Model, Refresh } from "./model.ts";
import {
  type PresentedBucket,
  type PresentedCard,
  type PresentedHousehold,
  presentHousehold,
} from "./present.ts";
import { spendView } from "./spend-view.ts";
import * as stylex from "@stylexjs/stylex";
import { styleAttributes, styles } from "./theme.stylex.ts";

const standingInk = (standing: PaceStanding) => {
  if (standing === "under") {
    return styles.fillGreenInk;
  }

  if (standing === "on") {
    return styles.fillAccent;
  }

  return styles.fillRedInk;
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

const card = (
  key: string,
  h: HtmlBuilder<Message>,
  body: ReadonlyArray<Html>,
): Html =>
  h.keyed("div")(key, [...styleAttributes(h, stylex.props(styles.card))], [...body]);

const meter = (
  label: string,
  now: number,
  max: number,
  widthPercent: number,
  fill: (typeof styles)["fillGreenInk"],
  key: string,
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
        h.Key(key),
        ...styleAttributes(h, stylex.props(styles.fill(widthPercent), fill)),
      ]),
    ],
  );

const emergencyView = (
  presented: PresentedHousehold,
  savedCents: number,
  targetCents: number,
  h: HtmlBuilder<Message>,
): Html =>
  card("emergency", h, [
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
      styles.fillGreenInk,
      "emergency-meter",
      h,
    ),
    h.p([...styleAttributes(h, stylex.props(styles.caption))], [presented.savedCaption]),
  ]);

const cardView = (
  cardPresented: PresentedCard,
  h: HtmlBuilder<Message>,
): Html =>
  card(cardPresented.id, h, [
    h.p([...styleAttributes(h, stylex.props(styles.label))], ["room left"]),
    h.p([...styleAttributes(h, stylex.props(styles.bigNumber))], [cardPresented.roomLabel]),
    h.p([...styleAttributes(h, stylex.props(styles.detail))], [cardPresented.label]),
    meter(
      `Room left on ${cardPresented.label}`,
      cardPresented.roomPercent,
      100,
      cardPresented.roomPercent,
      styles.fillAccent,
      `card-${cardPresented.id}`,
      h,
    ),
    h.p([...styleAttributes(h, stylex.props(styles.caption))], [cardPresented.detail]),
  ]);

const bucketView = (
  bucket: PresentedBucket,
  h: HtmlBuilder<Message>,
): Html =>
  card(bucket.id, h, [
    h.h3([...styleAttributes(h, stylex.props(styles.heading))], [bucket.name]),
    h.p([...styleAttributes(h, stylex.props(styles.bigNumber))], [bucket.spentLabel]),
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
          h.Key(`bucket-${bucket.id}`),
          ...styleAttributes(
            h,
            stylex.props(
              styles.fill(Math.min(100, Math.max(0, bucket.spentPercent))),
              standingInk(bucket.standing),
            ),
          ),
        ]),
        h.div([
          ...styleAttributes(
            h,
            stylex.props(styles.paceMarkBase, styles.paceMark(bucket.pacePercent)),
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
  ]);

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

const footerCopy = (source: Model["snapshot"]["source"]): string => {
  if (source === "live") {
    return "Household Finance snapshot for Carlos and Maria.";
  }

  return "Fixture for Carlos and Maria.";
};

const noticeView = (refresh: Refresh, h: HtmlBuilder<Message>): Html =>
  Refresh.match(refresh, {
    Idle: () => h.empty,
    Failed: ({ error }) =>
      h.div([...styleAttributes(h, stylex.props(styles.notice))], [
        h.p(
          [...styleAttributes(h, stylex.props(styles.noticeText))],
          [`Couldn't refresh from the household API. Showing the fixture. ${error}`],
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
        emergencyView(presented, fund.saved.cents, fund.target.cents, h),
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
          presented.cards.map((item) => cardView(item, h)),
        ),
      ]),
      h.section([...styleAttributes(h, stylex.props(styles.shell))], [
        h.h2([...styleAttributes(h, stylex.props(styles.heading))], ["Buckets vs pace"]),
        h.p([...styleAttributes(h, stylex.props(styles.lede))], [presented.paceCaption]),
        h.div(
          [...styleAttributes(h, stylex.props(styles.gridBuckets))],
          presented.buckets.map((bucket) => bucketView(bucket, h)),
        ),
      ]),
      spendView(model, h),
      h.p(
        [...styleAttributes(h, stylex.props(styles.footer))],
        [footerCopy(model.snapshot.source)],
      ),
    ]),
  };
};
