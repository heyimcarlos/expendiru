# Expendiru spend verification map

This directory is the maintained source for verifying the spend surface. Read the index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- Launch the fixture frontend with `node scripts/verify-expendiru.mjs launch`.
- The server is `http://127.0.0.1:4173` and its pid is `/tmp/verify-expendiru/server.json`.
- `node scripts/verify-expendiru.mjs doctor` must pass before a drive.
- The page is the committed stub: six filtered transactions and the Jul–Oct monthly bucket series. No Cloudflare Access login.
- Never drive an instance that was not started by this verification run.

## Driving conventions

- Start every recipe from the freshly launched fixture unless its preconditions say otherwise.
- Prefer ARIA names and `data-chart-surface` over coordinates. Touch points are sampled from those elements.
- Run browser actions through `node scripts/verify-expendiru.mjs drive <feature>`.
- Viewport for spend checks is 390×844 with touch emulation.
- Do not remove proof artifacts during cleanup.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof includes a screenshot before and after the action, plus `result.json`.
- Record the feature id with every artifact under `artifacts/verify-expendiru/<feature>/`.
- Report an unreachable path with the attempted command and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections in this order.

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with verify-expendiru` starts with `Preconditions:` and uses labeled bullets that pair each user action with an exact command and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

## Features

- [Pie selection](./pie-select.md) covers tapping a slice, keeping the page still, and filtering the table.
- [Stacked area](./stacked-area.md) covers the Line chart for the four monthly buckets.
- [Transaction pages](./transaction-pages.md) covers the 25-row pager.
- [Mobile edges](./mobile-edges.md) covers the 390px viewport staying inside the screen.
