import { ChartMode } from "@expendiru/domain";
import { Option, Schema, SchemaTransformation, pipe } from "effect";
import { Route } from "foldkit";
import { defineRouteUnion } from "foldkit/route";

export interface SpendLocation {
  readonly chart: ChartMode;
  readonly person: string;
  readonly mark: string;
  readonly page: number;
}

export const defaultSpendLocation: SpendLocation = {
  chart: "line",
  person: "",
  mark: "",
  page: 0,
};

const chartOrLine = (value: string): ChartMode => {
  if (value === "pie" || value === "bar" || value === "line") {
    return value;
  }

  return "line";
};

const pageOrZero = (raw: Option.Option<string>): number =>
  Option.match(raw, {
    onNone: () => 0,
    onSome: (value) => {
      if (!/^\d+$/.test(value)) {
        return 0;
      }

      const parsed = Number(value);

      if (parsed > 10_000) {
        return 10_000;
      }

      return parsed;
    },
  });

const chartParam = Schema.OptionFromOptional(Schema.String).pipe(
  Schema.decodeTo(
    ChartMode,
    SchemaTransformation.transform({
      decode: (maybeRaw: Option.Option<string>): ChartMode =>
        Option.match(maybeRaw, {
          onNone: () => "line",
          onSome: chartOrLine,
        }),
      encode: (chart: ChartMode): Option.Option<string> =>
        chart === "line" ? Option.none() : Option.some(chart),
    }),
  ),
);

const textParam = Schema.OptionFromOptional(Schema.String).pipe(
  Schema.decodeTo(
    Schema.String,
    SchemaTransformation.transform({
      decode: (maybeRaw: Option.Option<string>): string =>
        Option.getOrElse(maybeRaw, () => ""),
      encode: (value: string): Option.Option<string> =>
        value === "" ? Option.none() : Option.some(value),
    }),
  ),
);

const pageParam = Schema.OptionFromOptional(Schema.String).pipe(
  Schema.decodeTo(
    Schema.Int,
    SchemaTransformation.transform({
      decode: pageOrZero,
      encode: (page: number): Option.Option<string> =>
        page <= 0 ? Option.none() : Option.some(globalThis.String(page)),
    }),
  ),
);

const HomeQuery = Schema.Struct({
  chart: chartParam,
  person: textParam,
  mark: textParam,
  page: pageParam,
});

export const AppRoute = defineRouteUnion({
  Home: {
    chart: ChartMode,
    person: Schema.String,
    mark: Schema.String,
    page: Schema.Int,
  },
  NotFound: { path: Schema.String },
});

export type AppRoute = typeof AppRoute.Type;

export const homeRouter = pipe(
  Route.root,
  Route.query(HomeQuery),
  Route.mapTo(AppRoute.Home),
);

const routeParser = Route.oneOf(homeRouter);

export const urlToAppRoute = Route.parseUrlWithFallback(
  routeParser,
  AppRoute.NotFound,
);

export const spendPath = (location: SpendLocation): string => homeRouter(location);

export const locationFromRoute = (route: AppRoute): SpendLocation =>
  AppRoute.match(route, {
    Home: ({ chart, person, mark, page }) => ({ chart, person, mark, page }),
    NotFound: () => defaultSpendLocation,
  });
