# Foldkit in Expendiru

This file is project-specific. Foldkit 0.165 does not own it, and it is not the foldkit-domains `FOLDKIT.md`. That demo is on a later canary whose root is `Block.makeDefinition`, Composition, and `KeyedQuery`. This app is pinned with cafe to `foldkit@0.165.0`. Stay on that API.

The installed package is the reference for signatures. Useful examples at that tag are `query-sync` (URL-backed filters) and `interrupting-commands` (cancel an in-flight Command). Do not import from a vendored checkout.

## Root

`packages/frontend/src/entry.ts` builds one `Runtime.makeApplication`. Routing reports `ClickedLink` and `ChangedUrl`. DevTools receive `Message`.

| File | Job |
| --- | --- |
| `model.ts` | Schema model, refresh phase, spend mark |
| `message.ts` | `defineMessageUnion` |
| `init.ts` | URL to model, then load commands |
| `update.ts` | Message match only |
| `steps/` | Chart, filter, selection, pager, fetch admission |
| `command.ts` | Loads, URL replace, focus, navigation |
| `route.ts` | `/` query router for chart, person, mark, page |
| `view.ts`, `spend-view.ts` | Document and spend section |
| `focus.ts` | Stable control ids shared by the view and focus Commands |

Update returns `modifyFields` results and Commands. It does not call `fetch`, read `window`, or write the URL itself.

There is no `KeyedQuery` in this Foldkit. Spend and snapshot freshness is the pair of interruptible Commands plus the generation on the model. A late success or failure for an older generation does not land.

## Tests

Stories drive `update` and resolve Commands with explicit result Messages. Scenes drive the view the same way. Neither runs the HTTP effect. `command.test.ts` runs the fixture load effect. Browser checks use `scripts/verify-expendiru.mjs` and `pnpm test:e2e`.

## Product rules that Foldkit code has to keep

The emergency fund figure is Maria's liquid savings against $30,000. Charts do not animate their geometry. The mode control is the clip-path, and press feedback scales to 0.97 unless reduced motion is set. The line chart reads `monthly_by_bucket`. The table renders one page of 25 rows. Loading skeletons do not show dollar amounts.
