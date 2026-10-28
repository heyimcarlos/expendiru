# Expendiru

Private household dashboard for Carlos and Maria in Toronto. This v1 is a thin CAFE slice: the home screen is real, the numbers are a typed fixture, and Scotia / Wealthsimple are not connected.

## CAFE here

| Letter | Piece | Where it lives |
| --- | --- | --- |
| **C**loudflare | Runs the app | Alchemy deploys a Worker plus a Foldkit site |
| **A**lchemy | Declares that infra as an Effect | `alchemy.run.ts` |
| **F**oldkit | Draws the home screen | `packages/frontend` |
| **E**ffect | Types the snapshot and serves it | `packages/domain`, `packages/api`, `packages/backend` |

`@expendiru/domain` is the household model (Canadian cents, emergency fund, two Visa placeholders, four buckets). `@expendiru/api` is the HTTP contract (`GET /snapshot` and `GET /spend`). The Worker implements it with `HouseholdSource.liveLayer`. The Foldkit page renders that same fixture immediately. Alchemy inlines `VITE_API_URL` as `same-origin`, and the page then requests `/snapshot` and `/spend` on the site itself. `packages/frontend/src/edge.ts` proxies those GET paths, plus `/health`, to the API over a service binding.

Effect code follows [AGENTS.md](AGENTS.md) and `.cursor/skills/effect`.

Patterned on [Effect-TS/cafe](https://github.com/Effect-TS/cafe), not the heavier rat-stack template. A small import fence (oxlint) keeps `domain` and `api` browser-safe.

## Nix

Cafe's shell is a flake plus direnv. This repo copies that. There is no devenv.

The shell provides Node, pnpm, Bun, and cloudflared. Cafe also includes ffmpeg for demo videos; this repo does not record demos, so ffmpeg is omitted.

First time on a machine:

1. Install Nix from <https://nixos.org/download/>. Flakes need to be enabled. The Determinate Systems installer turns them on. The official installer may need this in `~/.config/nix/nix.conf`:

   ```
   experimental-features = nix-command flakes
   ```

2. Either enter the shell by hand:

   ```sh
   nix develop
   ```

   or install direnv, hook it into your shell, then from this directory run `direnv allow`. `.envrc` is `use flake`, the same one-liner cafe uses. After that, `cd` into the repo loads the shell.

`flake.lock` pins the same nixpkgs revision cafe locked, so the shell does not float on every `nix develop`.

## Run

Inside the Nix shell, or with Node 22+ and pnpm 12:

```sh
pnpm install
cp packages/backend/src/live-snapshot.generated.stub.ts packages/backend/src/live-snapshot.generated.ts
pnpm exec alchemy profile edit --add Cloudflare   # once per machine
pnpm dev                                          # alchemy dev: Worker + Vite
pnpm run deploy                                   # alchemy deploy (`pnpm deploy` is a pnpm built-in)
pnpm typecheck
pnpm test
pnpm lint
```

`pnpm --filter @expendiru/frontend dev` runs Vite alone. With no `VITE_API_URL`, the page shows the fixture and does not call the Worker.

The API Worker sets `compatibility.date` to `2026-10-28`. Logs stay on Alchemy's default. Traces come from `Cloudflare.Telemetry()` ([Workers tracing](https://alchemy.run/cloudflare/observability/workers-tracing/)), not a hand-written Wrangler block.

## Read the upstream trees

These libraries move. After cloning expendiru, clone the sources once and read those checkouts instead of guessing APIs:

```sh
./scripts/clone-references.sh
```

The script is idempotent: a directory that is already a git checkout is skipped. Clones go in `.reference/`, which is gitignored.

| Directory | Repo | Why it's here |
| --- | --- | --- |
| `.reference/effect` | [Effect-TS/effect](https://github.com/Effect-TS/effect) | Effect 4, including `@effect/platform-*` |
| `.reference/cafe` | [Effect-TS/cafe](https://github.com/Effect-TS/cafe) | Worker + Foldkit site + Alchemy stack this app follows |
| `.reference/foldkit` | [foldkit/foldkit](https://github.com/foldkit/foldkit) | UI source and examples, at the `foldkit@` tag in `pnpm-workspace.yaml` (cafe's foldkit skill pins the same way) |
| `.reference/alchemy` | [alchemy-run/alchemy](https://github.com/alchemy-run/alchemy) | Worker / Website resources, and the source of the alchemy.run docs |

To add another tree, append a `clone_one` line in `scripts/clone-references.sh`. Commented starters are already there for [Effect-TS/website](https://github.com/Effect-TS/website) and [anomalyco/opencode](https://github.com/anomalyco/opencode). `executor.sh` is named in the script without a URL until you paste the repo.

## Home screen

1. Emergency fund progress.
2. Room left on both Visa cards (placeholder labels, no account numbers).
3. Household, Together, Carlos, and Maria against a straight-line pace for 28 Oct 2026.
4. Spending: one pie / bar / line control, then the transactions in that same filter. A slice, bar, or day narrows the list. The legend hides a series.

The chart control is a duplicated tab layer clipped to the active third, so the accent fill and the label color move together. Money uses tabular figures. Meters are hairline tracks: green when spending is under pace, red when it is over, and the accent when it is on pace.

## Spending

`GET /spend` returns a `SpendFeed`. The page shows a small stub until that call succeeds, which is what CI runs. Live transactions are not committed.

The default filter is the feed period (`period.from` through `period.to`), `counts_toward_budget=yes`, and rent / `transfer_or_payment` / income hidden. On the Jul–Oct drop that is the whole window, so the pie matches Household Finance: Carlos about $11.4k, Maria about $6.0k, household about $3.9k, together about $2.4k, move one-offs about $1.6k. Charts sum money out (negative amounts). The list is the same filtered set. Search matches merchant, account, person, bucket, and Plaid category text. Category filters use `category_primary`, `category_detailed`, and `category_confidence`.

Choosing a pie slice, merchant bar, or day filters that same list. Choosing it again, or Clear selection, restores the list. The legend toggles a series out of both the chart and the list. Chart geometry stays put; the mode control is the one clip-path move, and press states scale to 0.97. `prefers-reduced-motion` drops those transforms.

Check a local drop against those totals (no-op when the directory is missing):

```sh
pnpm check:spend
```

Sync a Household Finance drop into the Worker:

```sh
pnpm sync:spend
```

The script reads `/workspace/finance/expendiru-feed` when that directory contains `transactions.json` and `summary.json`. Set `EXPENDIRU_FEED` to point somewhere else. It writes `packages/backend/src/spend.generated.ts`, which is gitignored. Restart `pnpm dev` so the Worker bundles the new file. If the directory is missing, the script leaves the current payload alone.

`pnpm install` creates the generated file as a re-export of the stub when it is absent. A deploy from a clean tree serves that stub. A deploy from a tree you already synced bundles the local feed into the Worker.

## Theme tokens

StyleX variables live in `packages/frontend/src/theme.stylex.ts` (`tokens`). The `.stylex.ts` suffix is what StyleX requires for `defineVars`. Component styles use those variables. SVG strokes use the matching `palette` object, because attributes are not CSS. Type is the system sans. Series colors for the charts live in `seriesPalette` — one accent plus quiet neutrals, not a status red.

| Token | Role |
| --- | --- |
| `paper` `#f4f4f5` | page background |
| `surface` `#ffffff` | cards and controls |
| `line` `#e4e4e7` | hairline borders |
| `ink` `#18181b` | text |
| `muted` `#71717a` | secondary copy |
| `accent` `#5e6ad2` | the one accent: chart control, on-pace, visa meters |
| `green` `#18794e` | under pace, money in |
| `red` `#d1242f` | over pace, money out, failed refresh |
| `track` `#ececee` | meter and bar tracks |
| `easeOut` | `cubic-bezier(0.23, 1, 0.32, 1)` for press feedback |
| `easeInOut` | `cubic-bezier(0.77, 0, 0.175, 1)` for the chart-mode clip |
| `fontBody` | system sans |
| `radius` | `10px` |

## Next: live Scotia and Wealthsimple

`HouseholdSource` in `packages/backend/src/source.ts` is the port. `HouseholdSource.layer` decodes the placeholder fixture; production uses `HouseholdSource.liveLayer`, which reads `live-snapshot.generated.ts` mapped from the Household Finance feed at `/workspace/finance/expendiru-feed` via `scripts/sync-expendiru-feed.py`. That generated file is gitignored — CI copies the stub so typecheck still works. Do not commit live balances or account numbers. The emergency fund card is liquid rainy-day cash only: Maria savings against `goals.emergency_liquid_target` ($30k). Carlos savings and the Wealthsimple TFSA are not included. The combined safety net remains `goals.emergency_fund_target` ($60k: $30k liquid + $30k TFSA) and is not that card's target.

`SpendSource` in `packages/backend/src/spend-source.ts` serves `GET /spend` from the gitignored `spend.generated.ts`, or the stub when that file only re-exports it. `pnpm sync:spend` writes it from the same feed directory. Do not commit the transaction dump.

## Who can open the deployed app

Cloudflare Access is declared on both the API Worker and the Foldkit site. One allow policy admits only these Google accounts:

- carlos.cruzta@gmail.com
- mariaeduarda.frdo@gmail.com

The policy is `householdAllowPolicy` in `packages/backend/src/access.ts`. Each Worker gets its own Access application (`access.policies`) so a direct visit to the API host and a visit to the site are both gated by that same list. The page does not call the API host. After one login on the site, snapshot and spend go to the site origin, and the edge worker forwards them to the API binding inside Cloudflare. `alchemy dev` does not show the login wall. The deployed `workers.dev` URLs do, after Access exists in the account.

Before the first deploy that creates those applications:

1. In the Cloudflare dashboard, open Zero Trust and add the **Google** identity provider. This repo does not create that provider, because it needs a Google OAuth client that is not stored here.
2. The CI token needs `Access: Apps and Policies Write` (included in `stacks/github.ts`) plus the Workers and Secrets Store permissions Alchemy's CI guide uses for `Cloudflare.state()`.

Anyone else, including other Google accounts, is denied. Do not add emails that are not on that list.

## CI

`.github/workflows/ci.yml` runs on pull requests and on pushes to `main`: `pnpm install --frozen-lockfile`, copy `packages/backend/src/live-snapshot.generated.stub.ts` to `live-snapshot.generated.ts`, `pnpm typecheck`, `pnpm lint`, `pnpm test`. Node 22, pnpm 12.9.1.

`.github/workflows/deploy.yml` follows [Alchemy CI](https://alchemy.run/environments/ci/). Pushes to `main` deploy `--stage prod`. Pull requests deploy `--stage pr-<number>` and post a preview comment when `GITHUB_TOKEN` is present. Closing a pull request runs `alchemy destroy` for that stage and refuses to destroy `prod`. Deploy and destroy copy the same stub after install so the gitignored module resolves.

Deploy and destroy no-op until these Actions secrets exist:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

`GITHUB_TOKEN` is provided by Actions and is used for the preview comment.

`stacks/github.ts` can mint that token and write the secrets, once, from an admin Alchemy profile (API token or Global API Key, not OAuth):

```sh
pnpm exec alchemy profile create admin
pnpm exec alchemy profile edit --profile admin
pnpm exec alchemy deploy --config stacks/github.ts --profile admin
```

That profile can create API tokens. Use it only for this stack. Until it has been deployed, create the two secrets by hand in the GitHub repo settings.

## Docs followed

- [Effect-TS/cafe](https://github.com/Effect-TS/cafe) — `alchemy.run.ts`, `Cloudflare.Worker`, `Cloudflare.Website.Foldkit`, HttpApi groups, `flake.nix`, `.envrc`
- [Foldkit on Alchemy](https://alchemy.run/cloudflare/frontend/foldkit/) — `rootDir`, `VITE_*` env
- [Alchemy Workers](https://alchemy.run/cloudflare/compute/workers/) — compatibility date, observability defaults
- [Alchemy Workers tracing](https://alchemy.run/cloudflare/observability/workers-tracing/) — `Cloudflare.Telemetry()`, compatibility date after `2026-07-28`
- [Functions and servers](https://alchemy.run/infrastructure-as-effects/functions-and-servers/) — Effect-native Worker shape
- [foldkit/foldkit](https://github.com/foldkit/foldkit) and cafe's `FOLDKIT.md` — `defineMessageUnion`, `Command.define`, Story and Scene tests
- [StyleX unplugin](https://stylexjs.com/docs/api/configuration/unplugin/) and [Vite install](https://stylexjs.com/docs/learn/installation/vite) — `stylex.vite()` appends generated CSS onto `src/styles.css`; dev imports `virtual:stylex:runtime`. `defineVars` lives in `theme.stylex.ts` so StyleX can hash the file.
- [Alchemy CI](https://alchemy.run/environments/ci/) — preview stages, prod deploy, and destroy on PR close
- [CAFE](https://ratstack.sh/lore/cafe-stack) — what the four letters mean
- Package pins match cafe's catalog (`effect@4.0.0`, `alchemy@2.0.0-beta.81`, `foldkit@0.165.0`) plus StyleX `0.19.1`
