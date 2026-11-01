# Architecture

Expendiru is a household dashboard: one Foldkit page, one Worker, and shared Effect contracts. It follows cafe's Foldkit 0.165 runtime. It does not use the Block composition or KeyedQuery from the later foldkit-domains canary. The same ideas show up here as steps, a query route, and generation-checked loads.

## Packages

`packages/domain` is the household and spend model. `packages/api` is `GET /snapshot` and `GET /spend`. `packages/backend` serves those routes and the Cloudflare Access policy. `packages/frontend` is the page. Shared packages do not import the page or the Worker. The Worker does not import the page. The page calls the API through the same-origin edge proxy in `edge.ts`, which keeps Access on the site host.

## Page

`entry.ts` starts the runtime with URL routing and DevTools. `init` parses `/` and starts `LoadSnapshot` and `LoadSpend` at generation 0, in the loading phase. The model still holds the fixture underneath so a failed refresh has something honest to show, but the loading view does not print those amounts.

`update` delegates:

- `steps/location.ts` changes chart mode, the person filter, the selection, the hidden series, and the page, then returns `ReplaceSpendUrl`.
- `steps/fetch.ts` ignores a snapshot or spend result whose generation is not the model's, and it sequences retry as interrupt-then-load.

`route.ts` prints and parses `chart`, `person`, `mark`, and `page`. Defaults stay off the query string. History navigation is `ChangedUrl`. An unknown path flags `unknownPath` and shows the default spend view.

`LoadSnapshot` and `LoadSpend` use `interrupt: true`, so each has one in-flight key. Retry increments the generation first, so a response that wins the race against cancel still fails the generation check.

## Spend surface

The line chart is the stacked monthly area from `monthly_by_bucket`. Pie and bar are the quieter modes. The table is the same filtered rows, 25 at a time. Selection, person, chart mode, and page are the URL. The legend's hidden series stays in the model only.

The emergency fund card is unchanged: Maria's liquid savings against the $30k target.
