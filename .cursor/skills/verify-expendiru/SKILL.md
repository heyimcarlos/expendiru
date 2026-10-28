---
name: verify-expendiru
description: "Drive the Expendiru spend surface in a mobile browser and prove pie selection, the stacked-area line, pagination, and viewport edges. Use when a change touches the household dashboard and needs a scripted user-path check without Cloudflare Access."
---

# Verify Expendiru

The spend surface is a Foldkit page. Verification uses the frontend fixture: Vite with no `VITE_API_URL`, so the stub transactions and the committed Jul–Oct `monthly_by_bucket` series render without the Worker and without Cloudflare Access. `pnpm dev` (`alchemy dev`) is the same-origin production shape and also has no Access wall locally; this skill does not start it, because the fixture server is enough to drive the page and can run beside a developer server.

The helper is `node scripts/verify-expendiru.mjs`. It owns `http://127.0.0.1:4173` and Chrome's debug port `9223`. Do not drive a server this run did not launch.

## Launch

From the repo root, with dependencies already installed:

```sh
node scripts/verify-expendiru.mjs launch
```

That starts `packages/frontend/node_modules/vite/bin/vite.js` on `127.0.0.1:4173` with a detached process group. Ready means `GET /` returns 200 and the HTML title is `Expendiru`. The pid is written to `/tmp/verify-expendiru/server.json`. The log is `/tmp/verify-expendiru/vite.log`.

The page seeds itself from `spendStub`, including `monthlyByBucket` for July–October 2026. No migration and no Access login.

If port 4173 is already taken, launch fails. Clean up the previous verify pid instead of reusing another process.

## Doctor

```sh
node scripts/verify-expendiru.mjs doctor
```

Doctor is read-only. It passes only when all of these are true:

- `/tmp/verify-expendiru/server.json` exists
- that pid is alive
- the file records port `4173` and `http://127.0.0.1:4173/`
- `GET /` returns 200 and contains `<title>Expendiru</title>`

A foreign process on 4173 is not a healthy verify instance.

## Drive

Chrome is `google-chrome` in headless mode, viewport 390×844, touch emulation on. The helper speaks Chrome DevTools Protocol. It does not click through test-only endpoints.

```sh
node scripts/verify-expendiru.mjs drive pie-select
```

Stable handles on the spend page:

- pie surface: `[data-chart-surface="pie"]`
- pie group: `[aria-label="Spending by bucket"]`
- a slice button: `aria-label` `Show Household`, `Show Together`, `Show Carlos`, `Show Maria`, or `Show Move`
- line group: `[aria-label="Spending by month"]`
- chart mode buttons: visible names `Pie`, `Bar`, `Line`
- transaction table: `table[aria-label="Transactions"]`
- pager buttons: `Previous`, `Next`

`drive pie-select` scrolls the pie into view, records `window.scrollY`, touches one slice with a short drag, then touches a different slice. The count line changes (Household on the stub becomes `1 transaction`) and `scrollY` stays within 1px. `documentElement.scrollWidth` stays within 1px of `clientWidth`.

Other mapped features use the same browser session shape. Their recipes are in `features/`. Drive one feature per invocation.

## Evidence

Proof goes to `artifacts/verify-expendiru/<feature>/`. `pie-select` writes `before.png`, `after-first.png`, `after-second.png`, and `result.json`.

Standards:

- Exercise the fixture page in the browser, not a view-model setter.
- Capture the screen before the gesture and after each slice selection.
- `result.json` records scroll positions, the slice names, whether the table count changed, and the viewport width.
- The fixture is the production data boundary for local verify. It is not a mock of the chart.

## Cleanup

```sh
node scripts/verify-expendiru.mjs cleanup
```

Cleanup sends `SIGTERM` to the verify process group recorded in `/tmp/verify-expendiru/server.json`, kills the Chrome pid if a drive left one, and deletes `/tmp/verify-expendiru`. It does not delete `artifacts/verify-expendiru`.

## Helpers

`scripts/verify-expendiru.mjs` is the only helper. Run it from the repo root:

```sh
node scripts/verify-expendiru.mjs launch
node scripts/verify-expendiru.mjs doctor
node scripts/verify-expendiru.mjs drive pie-select
node scripts/verify-expendiru.mjs cleanup
```

Chrome must be on `PATH` as `google-chrome`. Node 22 runs the helper and Vite. No Playwright install is required.
