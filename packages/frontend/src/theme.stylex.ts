import type { Attribute, HtmlBuilder } from "foldkit/html";
import * as stylex from "@stylexjs/stylex";

export const palette = {
  ink: "#1e1e1e",
  muted: "#5c5f66",
  paper: "#fbfaf6",
  grid: "#eeece4",
  blue: "#a5d8ff",
  green: "#b2f2bb",
  red: "#ffc9c9",
  yellow: "#ffec99",
  orange: "#ffd8a8",
  gray: "#e9ecef",
  greenInk: "#2b8a3e",
  redInk: "#c92a2a",
  blueInk: "#1971c2",
  orangeInk: "#e8590c",
  grayInk: "#868e96",
} as const;

export const tokens = stylex.defineVars({
  ink: "#1e1e1e",
  muted: "#5c5f66",
  paper: "#fbfaf6",
  grid: "#eeece4",
  blue: "#a5d8ff",
  green: "#b2f2bb",
  red: "#ffc9c9",
  yellow: "#ffec99",
  orange: "#ffd8a8",
  gray: "#e9ecef",
  greenInk: "#2b8a3e",
  redInk: "#c92a2a",
  blueInk: "#1971c2",
  orangeInk: "#e8590c",
  grayInk: "#868e96",
  fontHand: 'Excalifont, "Comic Sans MS", cursive',
  fontBody:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif',
  spaceSectionBlock: "44px",
  spaceSectionInline: "26px",
  radiusCard: "12px",
  shadowChunk: "3px 3px 0 #1e1e1e",
  shadowPressed: "1px 1px 0 #1e1e1e",
});

const grow = stylex.keyframes({
  from: { transform: "scaleX(0)" },
  to: { transform: "scaleX(1)" },
});

export const styles = stylex.create({
  page: {
    minHeight: "100vh",
    color: tokens.ink,
    backgroundColor: tokens.paper,
    backgroundImage:
      "radial-gradient(#eeece4 1.2px, transparent 1.2px)",
    backgroundSize: "22px 22px",
    fontFamily: tokens.fontBody,
    fontSize: "16px",
    lineHeight: 1.55,
  },
  shell: {
    maxWidth: "1080px",
    marginTop: 0,
    marginRight: "auto",
    marginBottom: 0,
    marginLeft: "auto",
    paddingTop: tokens.spaceSectionBlock,
    paddingRight: tokens.spaceSectionInline,
    paddingBottom: "8px",
    paddingLeft: tokens.spaceSectionInline,
  },
  eyebrow: {
    margin: 0,
    color: tokens.muted,
    fontFamily: tokens.fontHand,
    fontSize: "18px",
  },
  title: {
    margin: 0,
    fontFamily: tokens.fontHand,
    fontWeight: 400,
    fontSize: {
      default: "52px",
      "@media (max-width: 860px)": "40px",
    },
    lineHeight: 1.05,
    color: tokens.ink,
  },
  heading: {
    margin: 0,
    fontFamily: tokens.fontHand,
    fontWeight: 400,
    fontSize: "36px",
    lineHeight: 1.1,
    color: tokens.ink,
  },
  lede: {
    marginTop: "10px",
    marginBottom: 0,
    maxWidth: "780px",
    fontSize: "18px",
    color: tokens.muted,
  },
  caption: {
    marginTop: "8px",
    marginBottom: 0,
    maxWidth: "860px",
    fontSize: "15px",
    color: tokens.muted,
  },
  nav: {
    display: "flex",
    gap: "12px",
    marginTop: "16px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  button: {
    fontFamily: tokens.fontHand,
    fontSize: "19px",
    backgroundColor: tokens.yellow,
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: tokens.ink,
    borderRadius: tokens.radiusCard,
    paddingTop: "3px",
    paddingBottom: "3px",
    paddingLeft: "16px",
    paddingRight: "16px",
    cursor: "pointer",
    boxShadow: tokens.shadowChunk,
    color: tokens.ink,
    ":active": {
      transform: "translate(2px, 2px)",
      boxShadow: tokens.shadowPressed,
    },
  },
  gridTwo: {
    display: "grid",
    gridTemplateColumns: {
      default: "1fr 1fr",
      "@media (max-width: 860px)": "1fr",
    },
    gap: "22px",
    marginTop: "22px",
  },
  gridBuckets: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginTop: "22px",
  },
  card: {
    position: "relative",
    isolation: "isolate",
    paddingTop: "18px",
    paddingRight: "22px",
    paddingBottom: "18px",
    paddingLeft: "22px",
    minHeight: "148px",
  },
  sketch: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: -1,
    overflow: "visible",
  },
  bigNumber: {
    margin: 0,
    fontFamily: tokens.fontHand,
    fontSize: "46px",
    lineHeight: 1,
    color: tokens.ink,
  },
  label: {
    marginTop: "4px",
    marginBottom: 0,
    color: tokens.muted,
    fontSize: "14px",
  },
  detail: {
    marginTop: "8px",
    marginBottom: 0,
    color: tokens.ink,
    fontSize: "15px",
  },
  standingUnder: { color: tokens.greenInk, fontFamily: tokens.fontHand, fontSize: "18px", marginTop: "8px", marginBottom: 0 },
  standingOn: { color: tokens.blueInk, fontFamily: tokens.fontHand, fontSize: "18px", marginTop: "8px", marginBottom: 0 },
  standingOver: { color: tokens.redInk, fontFamily: tokens.fontHand, fontSize: "18px", marginTop: "8px", marginBottom: 0 },
  track: {
    position: "relative",
    marginTop: "14px",
    height: "22px",
    backgroundColor: tokens.gray,
    borderRadius: "8px",
    overflow: "hidden",
  },
  fill: (widthPercent: number, delayMs: number) => ({
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: `${widthPercent}%`,
    transformOrigin: "left center",
    animationName: {
      default: grow,
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    animationDuration: "900ms",
    animationTimingFunction: "ease-out",
    animationDelay: `${delayMs}ms`,
    animationFillMode: "both",
  }),
  fillGreen: { backgroundColor: tokens.green },
  fillRed: { backgroundColor: tokens.red },
  fillBlue: { backgroundColor: tokens.blue },
  fillOrange: { backgroundColor: tokens.orange },
  fillYellow: { backgroundColor: tokens.yellow },
  paceMark: (leftPercent: number) => ({
    left: `${leftPercent}%`,
  }),
  paceMarkBase: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "2px",
    backgroundColor: tokens.ink,
    transform: "translateX(-1px)",
  },
  footer: {
    margin: 0,
    paddingTop: "28px",
    paddingRight: "26px",
    paddingBottom: "40px",
    paddingLeft: "26px",
    textAlign: "center",
    fontSize: "12.5px",
    color: tokens.grayInk,
  },
  notice: {
    marginTop: "16px",
    paddingTop: "12px",
    paddingRight: "14px",
    paddingBottom: "12px",
    paddingLeft: "14px",
    backgroundColor: tokens.red,
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: tokens.ink,
    borderRadius: tokens.radiusCard,
    color: tokens.ink,
  },
});

export const styleAttributes = <Message>(
  h: HtmlBuilder<Message>,
  result: ReturnType<typeof stylex.props>,
): ReadonlyArray<Attribute<Message>> => {
  const className = result.className;

  const classAttribute =
    className === undefined || className.length === 0 ? [] : [h.Class(className)];

  const inline = result.style;

  const styleAttribute =
    inline === undefined
      ? []
      : [
          h.Style(
            Object.fromEntries(
              Object.entries(inline).map(([key, value]) => [key, String(value)]),
            ),
          ),
        ];

  return [...classAttribute, ...styleAttribute];
};
