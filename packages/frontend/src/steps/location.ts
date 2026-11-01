import {
  type SpendFeed,
  type SpendFilter,
  SpendFilter as SpendFilterSchema,
  defaultSpendFilter,
  sameSpendFilter,
} from "@expendiru/domain";
import { Option } from "effect";
import type { Update } from "foldkit";
import { UrlRequest } from "foldkit/navigation";
import { modifyFields } from "foldkit/struct";
import { toString as urlToString } from "foldkit/url";
import {
  FocusControl,
  LoadExternal,
  NavigateInternal,
  ReplaceSpendUrl,
} from "../command.ts";
import { MAIN_ID, SPEND_ID } from "../focus.ts";
import { Message } from "../message.ts";
import { Model, SpendMark, parseSpendMark, sameSpendMark, spendMarkId } from "../model.ts";
import {
  AppRoute,
  type SpendLocation,
  locationFromRoute,
} from "../route.ts";

export const locationFromModel = (model: Model): SpendLocation => ({
  chart: model.spendChart,
  person: model.spendFilter.person,
  mark: spendMarkId(model.spendFocus),
  page: model.spendPage,
});

const withPerson = (filter: SpendFilter, person: string): SpendFilter =>
  SpendFilterSchema.make({ ...filter, person });

export const applySpendLocation = (model: Model, location: SpendLocation): Model => {
  const chartChanged = model.spendChart !== location.chart;

  return modifyFields(model, {
    spendChart: () => location.chart,
    spendFilter: (filter) => withPerson(filter, location.person),
    spendFocus: () => parseSpendMark(location.mark),
    spendHover: () => SpendMark.Idle(),
    spendPage: () => (location.page < 0 ? 0 : location.page),
    spendHidden: (hidden) => (chartChanged ? [] : hidden),
    unknownPath: () => false,
  });
};

export const modelFromRoute = (model: Model, route: AppRoute): Model => {
  const located = applySpendLocation(model, locationFromRoute(route));

  return AppRoute.match(route, {
    Home: () => located,
    NotFound: () => modifyFields(located, { unknownPath: () => true }),
  });
};

const commit = (model: Model): Update.Return<Model, Message> => ({
  model,
  commands: [ReplaceSpendUrl(locationFromModel(model))],
});

export const selectChart = (
  model: Model,
  mode: Model["spendChart"],
): Update.Return<Model, Message> =>
  commit(
    modifyFields(model, {
      spendChart: () => mode,
      spendFocus: () => SpendMark.Idle(),
      spendHover: () => SpendMark.Idle(),
      spendHidden: () => [],
      spendPage: () => 0,
      unknownPath: () => false,
    }),
  );

export const changeSpendFilter = (
  model: Model,
  filter: SpendFilter,
): Update.Return<Model, Message> =>
  commit(
    modifyFields(model, {
      spendFilter: () => filter,
      spendFocus: () => SpendMark.Idle(),
      spendHover: () => SpendMark.Idle(),
      spendPage: () => 0,
    }),
  );

export const resetSpend = (model: Model): Update.Return<Model, Message> =>
  commit(
    modifyFields(model, {
      spendFilter: () => defaultSpendFilter(model.spend.period.from, model.spend.period.to),
      spendFocus: () => SpendMark.Idle(),
      spendHover: () => SpendMark.Idle(),
      spendHidden: () => [],
      spendPage: () => 0,
      unknownPath: () => false,
    }),
  );

export const showHome = (model: Model): Update.Return<Model, Message> => resetSpend(model);

export const toggleSpendMark = (
  model: Model,
  mark: SpendMark,
): Update.Return<Model, Message> => {
  const next = sameSpendMark(model.spendFocus, mark) ? SpendMark.Idle() : mark;

  const committed = commit(
    modifyFields(model, {
      spendFocus: () => next,
      spendPage: () => 0,
    }),
  );

  const clearing = SpendMark.match(mark, {
    Idle: () => true,
    Bucket: () => false,
    Merchant: () => false,
    Day: () => false,
  });

  if (!clearing) {
    return committed;
  }

  return {
    model: committed.model,
    commands: [
      ReplaceSpendUrl(locationFromModel(committed.model)),
      FocusControl({ id: `spend-chart-${model.spendChart}`, preventScroll: true }),
    ],
  };
};

export const hoverSpendMark = (
  model: Model,
  mark: SpendMark,
): Update.Return<Model, Message> => ({
  model: modifyFields(model, { spendHover: () => mark }),
});

export const clearSpendHover = (model: Model): Update.Return<Model, Message> => ({
  model: modifyFields(model, { spendHover: () => SpendMark.Idle() }),
});

const withoutKey = (hidden: ReadonlyArray<string>, key: string): ReadonlyArray<string> => {
  const next: Array<string> = [];
  let found = false;

  for (const item of hidden) {
    if (item === key) {
      found = true;
      continue;
    }

    next.push(item);
  }

  if (!found) {
    next.push(key);
  }

  return next;
};

const focusKey = (focus: SpendMark): string =>
  SpendMark.match(focus, {
    Idle: () => "",
    Bucket: ({ key }) => key,
    Merchant: ({ key }) => key,
    Day: ({ key }) => key,
  });

export const toggleSpendSeries = (
  model: Model,
  key: string,
): Update.Return<Model, Message> =>
  commit(
    modifyFields(model, {
      spendHidden: (hidden) => withoutKey(hidden, key),
      spendFocus: (focus) => (focusKey(focus) === key ? SpendMark.Idle() : focus),
      spendPage: () => 0,
    }),
  );

export const selectSpendPage = (
  model: Model,
  page: number,
): Update.Return<Model, Message> =>
  commit(
    modifyFields(model, {
      spendPage: () => (page < 0 ? 0 : page),
    }),
  );

export const followLink = (
  model: Model,
  request: typeof UrlRequest.Type,
): Update.Return<Model, Message> =>
  UrlRequest.match(request, {
    External: ({ href }) => ({
      model,
      commands: [LoadExternal({ href })],
    }),
    Internal: ({ url }) => {
      const hash = Option.getOrElse(url.hash, () => "");

      if (hash === "spend") {
        return {
          model,
          commands: [FocusControl({ id: SPEND_ID, preventScroll: false })],
        };
      }

      if (hash === "main") {
        return {
          model,
          commands: [FocusControl({ id: MAIN_ID, preventScroll: false })],
        };
      }

      return {
        model,
        commands: [NavigateInternal({ url: urlToString(url) })],
      };
    },
  });

export const acceptSpendFeed = (model: Model, feed: SpendFeed): Model => {
  const nextFilter = sameSpendFilter(
    model.spendFilter,
    defaultSpendFilter(model.spend.period.from, model.spend.period.to),
  )
    ? defaultSpendFilter(feed.period.from, feed.period.to)
    : model.spendFilter;

  return modifyFields(model, {
    spend: () => feed,
    spendFilter: () => nextFilter,
    spendHover: () => SpendMark.Idle(),
  });
};
