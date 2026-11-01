import { Option } from "effect";
import { fromString } from "foldkit/url";
import { describe, expect, test } from "vitest";
import { AppRoute, defaultSpendLocation, spendPath, urlToAppRoute } from "./route.ts";

const mustUrl = (raw: string) =>
  Option.getOrThrowWith(fromString(raw), () => new Error(`bad url ${raw}`));

describe("spend route", () => {
  test("the default location stays on the bare path", () => {
    const path = spendPath(defaultSpendLocation);
    const route = urlToAppRoute(mustUrl(`http://127.0.0.1${path}`));

    expect(route).toEqual(
      AppRoute.Home({ chart: "line", person: "", mark: "", page: 0 }),
    );
  });

  test("chart, person, selection, and page round-trip", () => {
    const path = spendPath({
      chart: "pie",
      person: "Carlos",
      mark: "bucket:household",
      page: 2,
    });

    const route = urlToAppRoute(mustUrl(`http://127.0.0.1${path}`));

    expect(route).toEqual(
      AppRoute.Home({
        chart: "pie",
        person: "Carlos",
        mark: "bucket:household",
        page: 2,
      }),
    );
  });

  test("an unknown chart falls back to line", () => {
    const route = urlToAppRoute(mustUrl("http://127.0.0.1/?chart=scatter"));

    expect(route).toEqual(
      AppRoute.Home({ chart: "line", person: "", mark: "", page: 0 }),
    );
  });
});
