# Expendiru

Private household dashboard for Carlos and Maria in Toronto. This v1 is a thin CAFE slice: the home screen is real, the numbers are a typed fixture, and Scotia / Wealthsimple are not connected.

## CAFE here

| Letter | Piece | Where it lives |
| --- | --- | --- |
| **C**loudflare | Runs the app | Alchemy deploys a Worker plus a Foldkit site |
| **A**lchemy | Declares that infra as an Effect | `alchemy.run.ts` |
| **F**oldkit | Draws the home screen | `packages/frontend` |
| **E**ffect | Types the snapshot and serves it | `packages/domain`, `packages/api`, `packages/backend` |

`@expendiru/domain` is the household model (Canadian cents, emergency fund, two Visa placeholders, four buckets). `@expendiru/api` is the HTTP contract (`GET /snapshot`). The Worker implements it with `HouseholdSource.liveLayer`. The Foldkit page renders that same fixture immediately, and refreshes from `VITE_API_URL` when Alchemy inlines one.

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

Replay restarts the bar animation. Sketch frames are generated paths, in the same spirit as the rough.js cards in the theme reference.

## Theme tokens

StyleX variables live in `packages/frontend/src/theme.stylex.ts` (`tokens`). The `.stylex.ts` suffix is what StyleX requires for `defineVars`. Component styles use those variables. SVG fills use the matching `palette` object, because attributes are not CSS. `@font-face` for Excalifont is in `packages/frontend/src/styles.css` (OFL, see `public/fonts/OFL.txt`), with Comic Sans / cursive as the fallback.

| Token | Theme reference |
| --- | --- |
| `paper` `#fbfaf6` | page background |
| `grid` `#eeece4` | dot grid (the page gradient uses this hex; StyleX variables cannot sit inside that gradient string) |
| `ink` `#1e1e1e` | text and sketch stroke |
| `muted` `#5c5f66` | secondary copy |
| `blue` `#a5d8ff` | Carlos's Visa, Household bucket |
| `green` `#b2f2bb` | emergency fund, under-pace fill |
| `red` `#ffc9c9` | over-pace fill, API notice |
| `yellow` `#ffec99` | Together bucket, chunky buttons |
| `orange` `#ffd8a8` | Maria's Visa, Maria's bucket |
| `gray` `#e9ecef` | meter track |
| `greenInk` `#2b8a3e` | under pace |
| `redInk` `#c92a2a` | over pace |
| `blueInk` `#1971c2` | on pace |
| `orangeInk` `#e8590c` | reserved, matches the reference |
| `grayInk` `#868e96` | footer |
| `fontHand` | Excalifont, then Comic Sans, then cursive |
| `fontBody` | system sans |
| `shadowChunk` / `shadowPressed` | `3px 3px 0` ink, then `1px 1px 0` while pressed |
| `radiusCard` | `12px` |
| `spaceSectionBlock` / `spaceSectionInline` | `44px` / `26px` |

## Next: live Scotia and Wealthsimple

`HouseholdSource` in `packages/backend/src/source.ts` is the port. `HouseholdSource.layer` decodes the placeholder fixture; production uses `HouseholdSource.liveLayer`, which reads `live-snapshot.generated.ts` mapped from the Household Finance feed at `/workspace/finance/expendiru-feed` via `scripts/sync-expendiru-feed.py`. That generated file is gitignored — CI copies the stub so typecheck still works. Do not commit live balances or account numbers. The emergency fund card is liquid rainy-day cash only: Maria savings against `goals.emergency_liquid_target` ($30k). Carlos savings and the Wealthsimple TFSA are not included. The combined safety net remains `goals.emergency_fund_target` ($60k: $30k liquid + $30k TFSA) and is not that card's target.

## Who can open the deployed app

Cloudflare Access is declared on both the API Worker and the Foldkit site. One allow policy admits only these Google accounts:

- carlos.cruzta@gmail.com
- mariaeduarda.frdo@gmail.com

The policy is `householdAllowPolicy` in `packages/backend/src/access.ts`. Each Worker gets its own Access application (`access.policies`) so the API and the site are both gated by that same list. `alchemy dev` does not show the login wall. The deployed `workers.dev` URLs do, after Access exists in the account.

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
