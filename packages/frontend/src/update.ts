import type { Update } from "foldkit";
import { modifyFields } from "foldkit/struct";
import { Message } from "./message.ts";
import { Model } from "./model.ts";
import {
  acceptSnapshot,
  acceptSpend,
  changeSpendFilter,
  clearSpendHover,
  failSnapshot,
  failSpend,
  followLink,
  hoverSpendMark,
  modelFromRoute,
  resetSpend,
  retrySnapshot,
  retrySpend,
  selectChart,
  selectSpendPage,
  showHome,
  startSnapshot,
  startSpend,
  toggleSpendMark,
  toggleSpendSeries,
} from "./steps/index.ts";
import { urlToAppRoute } from "./route.ts";

type UpdateReturn = Update.Return<Model, Message>;

export const update = (model: Model, message: Message): UpdateReturn =>
  Message.match<UpdateReturn>(message, {
    LoadedSnapshot: ({ snapshot, generation }) => acceptSnapshot(model, snapshot, generation),
    FailedLoadSnapshot: ({ error, generation }) => failSnapshot(model, error, generation),
    CompletedCancelLoadSnapshot: () => startSnapshot(model),
    ClickedReplay: () => ({
      model: modifyFields(model, {
        replay: (replay) => replay + 1,
      }),
    }),
    ClickedRetry: () => retrySnapshot(model),
    LoadedSpend: ({ feed, generation }) => acceptSpend(model, feed, generation),
    FailedLoadSpend: ({ error, generation }) => failSpend(model, error, generation),
    CompletedCancelLoadSpend: () => startSpend(model),
    ClickedChart: ({ mode }) => selectChart(model, mode),
    ChangedSpendFilter: ({ filter }) => changeSpendFilter(model, filter),
    ClickedResetSpend: () => resetSpend(model),
    ClickedRetrySpend: () => retrySpend(model),
    ClickedSpendMark: ({ mark }) => toggleSpendMark(model, mark),
    HoveredSpendMark: ({ mark }) => hoverSpendMark(model, mark),
    ClearedSpendHover: () => clearSpendHover(model),
    ToggledSpendSeries: ({ key }) => toggleSpendSeries(model, key),
    ClickedSpendPage: ({ page }) => selectSpendPage(model, page),
    ClickedLink: ({ request }) => followLink(model, request),
    ChangedUrl: ({ url }) => ({
      model: modelFromRoute(model, urlToAppRoute(url)),
    }),
    ClickedHome: () => showHome(model),
    CompletedReplaceSpendUrl: () => ({ model }),
    CompletedNavigateInternal: () => ({ model }),
    CompletedLoadExternal: () => ({ model }),
    CompletedFocusControl: () => ({ model }),
  });
