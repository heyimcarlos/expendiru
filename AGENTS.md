# Expendiru

Effect code follows `.cursor/skills/effect` (kitlangton's Effect v4 guide). Read `SKILL.md` and the matching `references/*.md` before writing or changing Effect. Match those defaults: `Effect.gen` workflows, `Effect.fn` for service operations, `Context.Service` with `Layer.effect` and `Service.of`, `Schema.Struct` plus a same-name interface, `Schema.TaggedError`, and `Config` instead of `process.env`.

Foldkit owns the UI program (`defineMessageUnion`, Story, Scene). Do not replace that with a parallel Effect UI style.

The pinned `effect` package wins if a skill example disagrees with it. If `.cursor/rules/effect-fence.mdc` disagrees with the skill, follow the skill.

## Lint

Oxlint loads vendored anti-slop from `tools/oxlint/anti-slop/` (see `UPSTREAM.md` there), including every Effect rule in that snapshot. `pnpm lint` is the gate. Do not weaken those rules to get a commit through.

## CI is not a household member

GitHub Actions installs, typechecks, lints, tests, and deploys. It is not Carlos or Maria. Do not record product analytics from a workflow, and do not treat `GITHUB_ACTOR` as a person using the dashboard. If analytics are added later, they stay out of CI and honor `DO_NOT_TRACK`.

Merge-ready checks are `pnpm typecheck`, `pnpm lint`, and `pnpm test`. Deploy is a separate workflow and needs Cloudflare secrets. It does not replace those checks.

## This app

Expendiru is pinned to Foldkit 0.165, the same release cafe uses. That runtime is `Runtime.makeApplication` with `defineMessageUnion`, not the later Block composition API in foldkit-domains. Do not upgrade Foldkit or copy that app's `makeDefinition` / `KeyedQuery` graph into this repo. Read `FOLDKIT.md` for the local map. The installed `foldkit` package and `.cursor/skills/effect` win over examples from a newer canary.

The household page is one root. `model.ts` and `message.ts` are the state and events. `init.ts` reads the URL and starts the snapshot and spend loads. `update.ts` only matches Messages onto steps. `steps/location.ts` owns chart mode, person filter, selection, legend, and pager changes, and it is what asks for a URL replace. `steps/fetch.ts` owns generation admission: a completion whose generation is not current is dropped. `command.ts` defines the interruptible loads, `ReplaceSpendUrl`, focus, and navigation. `route.ts` is the bidirectional `/` query router. `view.ts` and `spend-view.ts` render. `entry.ts` starts the browser runtime with routing and Foldkit DevTools.

`@expendiru/domain` and `@expendiru/api` are the shared contracts. The page and the Worker both import them. Domain and api stay free of client and server code. The Worker does not import the page. Oxlint enforces that.

Spend URL query keys are `chart`, `person`, `mark`, and `page`. The default line chart, any person, no selection, and page 0 omit their keys. Clicks update the model and replace the URL. Back and forward arrive as `ChangedUrl`. A bad path sets `unknownPath` and shows the default spend view.

`LoadSnapshot` and `LoadSpend` are interruptible, one in flight each. Retry bumps the generation, interrupts the current load, and starts the next one only from the cancel result. While a phase is `Loading`, the view shows a skeleton and does not paint balances. A failure keeps the last feed or the fixture and says so. Do not invent dollars.

The emergency fund card stays Maria's liquid savings against the $30k target. The TFSA is not that card.

Story tests resolve every Command before the next Message, including `ReplaceSpendUrl`. Scene tests do the same. `node scripts/verify-expendiru.mjs` drives the Vite fixture in Chrome without Cloudflare Access. `pnpm test:e2e` is the Playwright smoke on that same fixture and is not part of `pnpm test`.
