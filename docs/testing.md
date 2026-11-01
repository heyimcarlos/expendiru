# Testing

```sh
pnpm typecheck
pnpm lint
pnpm test
```

`pnpm test` is domain, API, Worker, and the Foldkit Story and Scene suite. It does not open a browser and it does not need Cloudflare Access.

Stories in `packages/frontend/src/story.test.ts` cover chart selection, a stale spend generation, URL restore, and focus return after clear. Scenes cover the spend interactions, arrow keys on the chart mode, the loading skeleton, a failed refresh that keeps the stub, and a 30-row pager that mounts one page. Resolve `ReplaceSpendUrl` before the next Message whenever a step syncs the address. Resolve `FocusControl` when clear selection returns focus.

The fixture load effect is `packages/frontend/src/command.test.ts`. With no `VITE_API_URL` it returns the committed snapshot and spend stub.

## Browser, no Access

`scripts/verify-expendiru.mjs` serves the Vite fixture on `127.0.0.1:4173` and drives system Chrome. See `.cursor/skills/verify-expendiru`.

```sh
node scripts/verify-expendiru.mjs launch
node scripts/verify-expendiru.mjs doctor
node scripts/verify-expendiru.mjs drive pie-select
node scripts/verify-expendiru.mjs drive pager
node scripts/verify-expendiru.mjs drive a11y
node scripts/verify-expendiru.mjs cleanup
```

`pnpm test:e2e` runs the Playwright smoke against that same fixture shape on port 4174, using the system Chrome channel. It checks the skip link, the polite status, mobile touch targets, one chart-mode key, and an axe scan of `#main`. The scan skips `color-contrast` so the existing muted secondary text is not treated as a failure. It is not part of `pnpm test` or CI.
